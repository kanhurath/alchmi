/**
 * WordPress → Local CMS Import Script
 *
 * Imports posts from the WordPress `vk_blog_wp` database into the
 * local CMS database (articles + article_categories tables).
 *
 * Usage:
 *   node server/scripts/import-wp-articles.js
 *
 * Environment (server/.env):
 *   DB_HOST, DB_USER, DB_PASS  — shared credentials for both databases
 *   DB_NAME                    — CMS target database (e.g. vk_portal_db)
 *   WP_DB_NAME                 — WordPress source database (default: vk_blog_wp)
 *   WP_TABLE_PREFIX            — WordPress table prefix  (default: wppv_)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const DB_HOST  = process.env.DB_HOST   || '66.116.245.211';
const DB_USER  = process.env.DB_USER   || 'root';
const DB_PASS  = process.env.DB_PASS   || '';
const DB_NAME  = process.env.DB_NAME   || 'vk_portal_db';
const WP_DB    = process.env.WP_DB_NAME      || 'vk_blog_wp';
const P        = process.env.WP_TABLE_PREFIX || 'wppv_';   // table prefix

const connOpts = { host: DB_HOST, user: DB_USER, password: DB_PASS, charset: 'utf8mb4' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toDateOnly(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt) ? null : dt.toISOString().split('T')[0];
}

function formatDisplayDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? '' : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Strip Gutenberg block comments and tidy HTML for display
function cleanContent(raw) {
  if (!raw) return '';
  return raw
    .replace(/<!-- \/?wp:[^>]*-->/g, '')   // remove block comments
    .replace(/\n{3,}/g, '\n\n')            // collapse blank lines
    .trim();
}

// Strip all HTML tags for plain-text excerpt fallback
function stripTags(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📥  WordPress → CMS Import');
  console.log(`    Source : ${WP_DB}  (prefix: ${P})`);
  console.log(`    Target : ${DB_NAME}\n`);

  const wp  = await mysql.createConnection({ ...connOpts, database: WP_DB  });
  const cms = await mysql.createConnection({ ...connOpts, database: DB_NAME });

  // ── Detect WP uploads base URL from options ───────────────────────────────
  const [[urlOpt]] = await wp.execute(
    `SELECT option_value FROM ${P}options WHERE option_name='siteurl' LIMIT 1`
  );
  const siteUrl     = (urlOpt?.option_value || 'http://localhost:3001/blog').replace(/\/$/, '');
  const uploadsBase = `${siteUrl}/wp-content/uploads`;
  console.log(`    WP site URL : ${siteUrl}`);
  console.log(`    Uploads URL : ${uploadsBase}\n`);

  // ── Ensure target tables ──────────────────────────────────────────────────
  await cms.execute(`
    CREATE TABLE IF NOT EXISTS article_categories (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      slug        VARCHAR(200) NOT NULL UNIQUE,
      description TEXT,
      wp_id       INT UNSIGNED DEFAULT NULL,
      sort_order  INT DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await cms.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      wp_id               INT UNSIGNED DEFAULT NULL,
      slug                VARCHAR(500) NOT NULL UNIQUE,
      status              ENUM('published','draft') DEFAULT 'draft',
      is_featured         TINYINT(1)   DEFAULT 0,
      title               TEXT         NOT NULL,
      excerpt             TEXT,
      content             LONGTEXT,
      featured_image_url  VARCHAR(1000) DEFAULT '',
      author_name         VARCHAR(200)  DEFAULT 'Vinay Kulkarni',
      pub_date            DATE          DEFAULT NULL,
      pub_date_display    VARCHAR(100)  DEFAULT '',
      categories          VARCHAR(1000) DEFAULT '',
      tags                VARCHAR(1000) DEFAULT '',
      seo_title           VARCHAR(300)  DEFAULT '',
      meta_description    VARCHAR(1000) DEFAULT '',
      og_image_url        VARCHAR(1000) DEFAULT '',
      canonical_url       VARCHAR(1000) DEFAULT '',
      sort_order          INT           DEFAULT 0,
      created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // ── 1. Import categories ──────────────────────────────────────────────────
  console.log('1/4  Importing categories…');
  const [wpCats] = await wp.execute(`
    SELECT t.term_id, t.name, t.slug, tt.count, tt.description
    FROM ${P}terms t
    JOIN ${P}term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'category' AND t.name != 'Uncategorized'
    ORDER BY tt.count DESC
  `);

  const catSlugMap = {};   // wp term_id → local slug
  let catOrder = 0;
  for (const term of wpCats) {
    const localSlug = slugify(term.slug) || slugify(term.name);
    catSlugMap[term.term_id] = localSlug;
    await cms.execute(`
      INSERT INTO article_categories (name, slug, wp_id, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), wp_id=VALUES(wp_id),
        description=VALUES(description), sort_order=VALUES(sort_order)
    `, [term.name, localSlug, term.term_id, term.description || '', catOrder++]);
    console.log(`     ✓ ${term.name} → ${localSlug} (${term.count} posts)`);
  }
  console.log(`     ${wpCats.length} categories done.\n`);

  // ── 2. Fetch all posts ────────────────────────────────────────────────────
  console.log('2/4  Fetching posts from WordPress…');
  const [wpPosts] = await wp.execute(`
    SELECT p.ID, p.post_title, p.post_name, p.post_content,
           p.post_excerpt, p.post_date, p.post_status
    FROM ${P}posts p
    WHERE p.post_type = 'post'
      AND p.post_status IN ('publish', 'draft')
    ORDER BY p.post_date DESC
  `);
  console.log(`     Found ${wpPosts.length} posts.\n`);

  // ── 3. Build lookup maps ──────────────────────────────────────────────────
  console.log('3/4  Building lookup maps…');

  // Category relationships
  const [wpRels] = await wp.execute(`
    SELECT tr.object_id AS post_id, tt.term_id
    FROM ${P}term_relationships tr
    JOIN ${P}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
    WHERE tt.taxonomy = 'category'
  `);
  const postCatMap = {};
  for (const r of wpRels) {
    if (!postCatMap[r.post_id]) postCatMap[r.post_id] = [];
    if (catSlugMap[r.term_id])  postCatMap[r.post_id].push(catSlugMap[r.term_id]);
  }

  // Tag relationships
  const [wpTagRels] = await wp.execute(`
    SELECT tr.object_id AS post_id, t.name AS tag_name
    FROM ${P}term_relationships tr
    JOIN ${P}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
    JOIN ${P}terms t          ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'post_tag'
  `);
  const postTagMap = {};
  for (const r of wpTagRels) {
    if (!postTagMap[r.post_id]) postTagMap[r.post_id] = [];
    postTagMap[r.post_id].push(r.tag_name);
  }

  // Featured image (thumbnail) IDs
  const [thumbMetas] = await wp.execute(`
    SELECT post_id, meta_value AS thumb_id
    FROM ${P}postmeta WHERE meta_key = '_thumbnail_id'
  `);
  const thumbIdMap = {};
  for (const m of thumbMetas) thumbIdMap[m.post_id] = m.thumb_id;

  // Attachment file paths → full URLs
  const thumbIds = [...new Set(Object.values(thumbIdMap))].filter(Boolean);
  const attachUrlMap = {};
  if (thumbIds.length) {
    const [attachments] = await wp.execute(`
      SELECT p.ID, pm.meta_value AS file_path
      FROM ${P}posts p
      JOIN ${P}postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
      WHERE p.ID IN (${thumbIds.map(() => '?').join(',')})
    `, thumbIds);
    for (const a of attachments) {
      attachUrlMap[a.ID] = `${uploadsBase}/${a.file_path}`;
    }
  }

  // AIOSEO SEO data
  const [seoRows] = await wp.execute(`
    SELECT post_id, title, description, og_title, og_description, og_image_url, canonical_url
    FROM ${P}aioseo_posts
  `);
  const seoMap = {};
  for (const s of seoRows) seoMap[s.post_id] = s;

  console.log(`     Category map: ${Object.keys(postCatMap).length} posts mapped`);
  console.log(`     Tag map:      ${Object.keys(postTagMap).length} posts with tags`);
  console.log(`     Thumbnails:   ${thumbIds.length} attachments`);
  console.log(`     SEO rows:     ${seoRows.length}\n`);

  // ── 4. Insert posts ───────────────────────────────────────────────────────
  console.log('4/4  Importing posts…');
  let imported = 0, updated = 0, failed = 0;

  for (let i = 0; i < wpPosts.length; i++) {
    const post   = wpPosts[i];
    const slug   = post.post_name || slugify(post.post_title) || `post-${post.ID}`;
    const status = post.post_status === 'publish' ? 'published' : 'draft';

    const cats    = [...new Set(postCatMap[post.ID] || [])].join(',');
    const tags    = [...new Set(postTagMap[post.ID] || [])].join(',');
    const thumbId = thumbIdMap[post.ID];
    const imgUrl  = thumbId ? (attachUrlMap[thumbId] || '') : '';
    const seo     = seoMap[post.ID] || {};

    const seoTitle   = seo.title       || '';
    const seoDesc    = seo.description || '';
    const ogImage    = seo.og_image_url || imgUrl;
    const canonical  = seo.canonical_url
      || `${siteUrl}/${toDateOnly(post.post_date)?.replace(/-/g, '/')}/${slug}/`;

    const pubDate    = toDateOnly(post.post_date);
    const pubDisplay = formatDisplayDate(post.post_date);

    const content = cleanContent(post.post_content);

    // Excerpt: use WP excerpt if present, otherwise first 300 chars of plain text
    const rawExcerpt = (post.post_excerpt || '').trim();
    const excerpt    = rawExcerpt || stripTags(content).substring(0, 300);

    const label = `[${String(i + 1).padStart(3)}/${wpPosts.length}]`;
    try {
      const [result] = await cms.execute(`
        INSERT INTO articles
          (wp_id, slug, status, title, excerpt, content, featured_image_url,
           author_name, pub_date, pub_date_display, categories, tags,
           seo_title, meta_description, og_image_url, canonical_url, sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          status=VALUES(status), title=VALUES(title),
          excerpt=VALUES(excerpt), content=VALUES(content),
          featured_image_url=VALUES(featured_image_url),
          pub_date=VALUES(pub_date), pub_date_display=VALUES(pub_date_display),
          categories=VALUES(categories), tags=VALUES(tags),
          seo_title=VALUES(seo_title), meta_description=VALUES(meta_description),
          og_image_url=VALUES(og_image_url), canonical_url=VALUES(canonical_url)
      `, [
        post.ID, slug, status,
        post.post_title, excerpt, content, imgUrl,
        'Vinay Kulkarni', pubDate, pubDisplay,
        cats, tags, seoTitle, seoDesc, ogImage, canonical, i,
      ]);

      if (result.affectedRows === 1) { imported++; console.log(`  ${label} ✓ NEW  ${post.post_title.substring(0, 55)}`); }
      else                           { updated++;  console.log(`  ${label} ↺ UPD  ${post.post_title.substring(0, 55)}`); }
    } catch (err) {
      failed++;
      console.error(`  ${label} ✗ FAIL ${slug}: ${err.message}`);
    }
  }

  await wp.end();
  await cms.end();

  console.log('\n✅  Import complete');
  console.log(`    Inserted : ${imported}`);
  console.log(`    Updated  : ${updated}`);
  console.log(`    Failed   : ${failed}`);
  console.log(`    Categories: ${wpCats.length}\n`);
}

main().catch(err => {
  console.error('\n❌  Import failed:', err.message);
  process.exit(1);
});
