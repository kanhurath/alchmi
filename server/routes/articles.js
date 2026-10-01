const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const db       = require('../db');
const { verifyToken } = require('../middleware/verifyToken');
const { writeArticleSeoHtml, removeArticleSeoHtml } = require('../seoHtmlBuilder');

const router = express.Router();

// ── Image upload ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'articles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, `article-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Comment images use the same directory, same filter, 5 MB limit
const commentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, `comment-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const uploadComment = multer({
  storage: commentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Table setup ───────────────────────────────────────────────────────────────
async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS articles_hero (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eyebrow    VARCHAR(200) DEFAULT 'Writing',
      title      VARCHAR(300) DEFAULT 'Recent',
      title_em   VARCHAR(300) DEFAULT 'Articles',
      subtitle   TEXT,
      breadcrumb VARCHAR(200) DEFAULT 'Articles'
    )
  `);

  await db.execute(`
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

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS article_likes (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      article_id  INT UNSIGNED NOT NULL,
      user_token  VARCHAR(120) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_like (article_id, user_token)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      article_id  INT UNSIGNED NOT NULL,
      author_name VARCHAR(200) NOT NULL DEFAULT 'Anonymous',
      content     TEXT,
      image_url   VARCHAR(1000) DEFAULT '',
      status      ENUM('pending','approved','rejected') DEFAULT 'pending',
      is_admin    TINYINT(1)   DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_article_status (article_id, status)
    )
  `);

  // Add is_admin column if it was created before this migration ran
  try {
    await db.execute(`ALTER TABLE article_comments ADD COLUMN is_admin TINYINT(1) DEFAULT 0`);
  } catch (e) {
    if (!e.message.includes('Duplicate column')) console.warn('[articles] is_admin column:', e.message);
  }

  // Add virtual_likes column for admin-controlled like boost
  try {
    await db.execute(`ALTER TABLE articles ADD COLUMN virtual_likes INT DEFAULT 0`);
  } catch (e) {
    if (!e.message.includes('Duplicate column')) console.warn('[articles] virtual_likes column:', e.message);
  }
}

ensureTables().catch(e => console.error('[articles] table init failed:', e.message));

// Add FULLTEXT indexes if not already present (safe to run each boot).
// Two separate indexes are needed: the composite one backs the WHERE-clause
// relevance filter across all searchable columns, and the title-only one
// backs the ORDER BY below, which scores title matches on their own —
// MySQL requires a MATCH() column list to exactly match an existing
// FULLTEXT index's column list, so a composite index alone can't serve a
// MATCH(a.title) query (raises "Can't find FULLTEXT index matching the
// column list").
async function ensureFulltextIndex(indexName, columns) {
  try {
    const [[{ cnt }]] = await db.execute(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'articles'
        AND INDEX_NAME   = ?
    `, [indexName]);
    if (cnt === 0) {
      await db.execute(`ALTER TABLE articles ADD FULLTEXT INDEX ${indexName} (${columns.join(', ')})`);
    }
  } catch (e) {
    console.warn(`[articles] FULLTEXT index setup skipped for ${indexName}:`, e.message);
  }
}
ensureFulltextIndex('ft_search', ['title', 'excerpt', 'tags']);
ensureFulltextIndex('ft_title', ['title']);

// ── Helpers ───────────────────────────────────────────────────────────────────

// FULLTEXT BOOLEAN MODE reserves +, -, <, >, ~, *, ", (, ) as operators, so a
// raw query like "Jala-Brahma" was parsed as +Jala -Brahma (require "Jala",
// exclude "Brahma") and silently filtered out the very article the hyphen
// came from. Replacing every run of non-alphanumeric characters with a
// space neutralizes those operators before the query reaches MySQL — this
// also matches how InnoDB's own FULLTEXT tokenizer already treats -, _, &,
// /, : etc. as word separators when indexing article titles, so a search
// matches a title whether or not the special characters are included.
function sanitizeFulltextQuery(raw) {
  return raw.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Accepts any date string (ISO, YYYY-MM-DD, Date object) and returns
// 'YYYY-MM-DD' for MySQL DATE columns, or null if falsy / invalid.
function toMySqlDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d)) return null;
  return d.toISOString().split('T')[0];
}

// ── PUBLIC: list articles ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page, 10)     || 1);
    const per_page = Math.min(50, parseInt(req.query.per_page, 10) || 10);
    const category = (req.query.category || '').trim();
    const search   = sanitizeFulltextQuery((req.query.search || '').trim());
    const status   = req.query.status || 'published';
    const offset   = (page - 1) * per_page;

    let where = 'WHERE a.status = ?';
    const params = [status];

    if (category) {
      where += ' AND FIND_IN_SET(?, REPLACE(a.categories, " ", ","))';
      params.push(category);
    }

    // MySQL FULLTEXT ignores purely numeric tokens and tokens shorter than its
    // ft_min_word_len (default 3–4). Use LIKE for those cases so that article
    // titles/content beginning with numbers are still found.
    const useLike = search && search.split(/\s+/).every(tok => /^\d+$/.test(tok) || tok.length < 3);
    const likeVal = search ? `%${search}%` : null;

    if (search) {
      if (useLike) {
        where += ' AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.tags LIKE ?)';
        params.push(likeVal, likeVal, likeVal);
      } else {
        // FULLTEXT for text queries; also include a LIKE fallback so that
        // alphanumeric tokens (e.g. "10 tips") aren't silently dropped when the
        // numeric part alone would match a title.
        where += ` AND (MATCH(a.title, a.excerpt, a.tags) AGAINST (? IN BOOLEAN MODE)
                    OR a.title LIKE ? OR a.excerpt LIKE ? OR a.tags LIKE ?)`;
        params.push(search, likeVal, likeVal, likeVal);
      }
    }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM articles a ${where}`,
      params
    );

    // Title matches sort above excerpt/tag matches. For LIKE-only queries,
    // order by title match first (CASE), then standard featured/date ordering.
    const orderBy = search
      ? (useLike
          ? `ORDER BY
               CASE WHEN a.title LIKE ? THEN 0 ELSE 1 END,
               a.is_featured DESC, a.pub_date DESC, a.sort_order, a.id DESC`
          : `ORDER BY
               MATCH(a.title) AGAINST (? IN BOOLEAN MODE) DESC,
               a.is_featured DESC, a.pub_date DESC, a.sort_order, a.id DESC`)
      : `ORDER BY a.is_featured DESC, a.pub_date DESC, a.sort_order, a.id DESC`;

    const rowParams = search ? [...params, useLike ? likeVal : search] : params;

    const [rows] = await db.execute(
      `SELECT a.* FROM articles a ${where} ${orderBy} LIMIT ${per_page} OFFSET ${offset}`,
      rowParams
    );

    res.json({
      articles:    rows,
      total:       Number(total),
      total_pages: Math.ceil(Number(total) / per_page),
      page,
      per_page,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: categories with counts ───────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  try {
    const [cats] = await db.execute(
      'SELECT * FROM article_categories ORDER BY sort_order, name'
    );
    const [articles] = await db.execute(
      "SELECT categories FROM articles WHERE status='published'"
    );
    const counts = {};
    for (const a of articles) {
      (a.categories || '').split(/[\s,]+/).filter(Boolean).forEach(slug => {
        counts[slug] = (counts[slug] || 0) + 1;
      });
    }
    const result = cats.map(c => ({ ...c, count: counts[c.slug] || 0 }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: list all articles (including drafts) — before /:slug wildcard ──────
router.get('/admin/all', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM articles ORDER BY pub_date DESC, sort_order, id DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: get single article by ID — before /:slug wildcard ─────────────────
router.get('/by-id/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: CKEditor inline image upload — before /:slug wildcard ─────────────
// Accepts a 'upload' field (CKEditor SimpleUploadAdapter convention).
// Returns { url } on success or { error: { message } } on failure.
router.post('/upload-image', verifyToken, upload.single('upload'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
  const relativePath = `/uploads/articles/${req.file.filename}`;
  // Build an absolute URL that the browser can actually reach — use the
  // origin the request came from (works in both dev and production).
  const proto   = req.headers['x-forwarded-proto'] || req.protocol;
  const host    = req.headers['x-forwarded-host']  || req.get('host');
  const baseUrl = `${proto}://${host}`;
  res.json({ url: `${baseUrl}${relativePath}` });
});

// ── ADMIN: categories CRUD — before /:slug wildcard ──────────────────────────
router.get('/categories/all', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM article_categories ORDER BY sort_order, name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────

const HERO_DEFAULTS = {
  eyebrow:    'Writing',
  title:      'Recent',
  title_em:   'Articles',
  subtitle:   'Reflections on Dharma, Indian Knowledge Systems, education, and the ancient wisdom of Bhārata applied to modern life.',
  breadcrumb: 'Articles',
};

router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles_hero LIMIT 1');
    res.json(rows[0] ? { ...HERO_DEFAULTS, ...rows[0] } : HERO_DEFAULTS);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: all comments (global list with optional status filter) ─────────────
router.get('/admin/comments', verifyToken, async (req, res) => {
  try {
    const status = req.query.status || '';
    let sql = `
      SELECT c.*, a.title AS article_title, a.slug AS article_slug
      FROM article_comments c
      JOIN articles a ON a.id = c.article_id
    `;
    const params = [];
    if (status) { sql += ' WHERE c.status = ?'; params.push(status); }
    sql += ' ORDER BY c.created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: all comments for one article ──────────────────────────────────────
router.get('/admin/:id/comments', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM article_comments WHERE article_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: post a comment as admin (auto-approved, is_admin=1) ────────────────
router.post('/admin/:id/comments', verifyToken, async (req, res) => {
  const { author_name = 'Admin', content = '', image_url = '', status = 'approved' } = req.body;
  const safeStatus = ['pending','approved','rejected'].includes(status) ? status : 'approved';
  if (!content.trim() && !image_url.trim())
    return res.status(400).json({ error: 'Comment content or image is required' });
  try {
    const [r] = await db.execute(
      'INSERT INTO article_comments (article_id, author_name, content, image_url, status, is_admin) VALUES (?,?,?,?,?,1)',
      [req.params.id, author_name.trim() || 'Admin', content.trim(), image_url.trim(), safeStatus]
    );
    const [[row]] = await db.execute('SELECT * FROM article_comments WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: update comment (status and/or content/author_name) ─────────────────
router.put('/admin/comments/:cid', verifyToken, async (req, res) => {
  const { status, content, author_name } = req.body;
  try {
    const [[existing]] = await db.execute('SELECT * FROM article_comments WHERE id=?', [req.params.cid]);
    if (!existing) return res.status(404).json({ error: 'Comment not found' });

    const newStatus      = status      !== undefined ? status      : existing.status;
    const newContent     = content     !== undefined ? content     : existing.content;
    const newAuthorName  = author_name !== undefined ? author_name : existing.author_name;

    if (!['pending','approved','rejected'].includes(newStatus))
      return res.status(400).json({ error: 'Invalid status' });

    await db.execute(
      'UPDATE article_comments SET status=?, content=?, author_name=? WHERE id=?',
      [newStatus, newContent, newAuthorName, req.params.cid]
    );
    const [[row]] = await db.execute('SELECT * FROM article_comments WHERE id=?', [req.params.cid]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/comments/:cid', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM article_comments WHERE id=?', [req.params.cid]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: like stats for all articles ───────────────────────────────────────
const ADMIN_LIKE_TOKEN = 'vk_admin_like_token';

router.get('/admin/likes', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id, a.title, a.slug, a.status,
             COALESCE(a.virtual_likes, 0) AS virtual_likes,
             COUNT(l.id) AS user_like_count,
             SUM(l.user_token = ?) AS admin_liked
      FROM articles a
      LEFT JOIN article_likes l ON l.article_id = a.id
      GROUP BY a.id
      ORDER BY (COUNT(l.id) + COALESCE(a.virtual_likes,0)) DESC, a.pub_date DESC
    `, [ADMIN_LIKE_TOKEN]);
    res.json(rows.map(r => ({
      ...r,
      user_like_count: Number(r.user_like_count),
      virtual_likes:   Number(r.virtual_likes),
      like_count:      Number(r.user_like_count) + Number(r.virtual_likes),
      admin_liked:     r.admin_liked > 0,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: set total like count (adjusts virtual_likes) ──────────────────────
// total_likes = user_like_count + virtual_likes
// virtual_likes = max(0, requested_total - user_like_count)
router.put('/admin/:id/likes', verifyToken, async (req, res) => {
  const total = parseInt(req.body.total_likes, 10);
  if (isNaN(total) || total < 0)
    return res.status(400).json({ error: 'total_likes must be a non-negative integer' });
  try {
    const [[{ cnt }]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM article_likes WHERE article_id=?', [req.params.id]
    );
    const userLikes   = Number(cnt);
    const virtualLikes = Math.max(0, total - userLikes);
    await db.execute('UPDATE articles SET virtual_likes=? WHERE id=?', [virtualLikes, req.params.id]);
    res.json({ user_like_count: userLikes, virtual_likes: virtualLikes, like_count: userLikes + virtualLikes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: toggle admin like for an article ───────────────────────────────────
router.post('/admin/:id/like', verifyToken, async (req, res) => {
  try {
    const [[{ n }]] = await db.execute(
      'SELECT COUNT(*) AS n FROM article_likes WHERE article_id=? AND user_token=?',
      [req.params.id, ADMIN_LIKE_TOKEN]
    );
    if (n > 0) {
      await db.execute('DELETE FROM article_likes WHERE article_id=? AND user_token=?', [req.params.id, ADMIN_LIKE_TOKEN]);
    } else {
      await db.execute('INSERT INTO article_likes (article_id, user_token) VALUES (?,?)', [req.params.id, ADMIN_LIKE_TOKEN]);
    }
    const [[{ cnt }]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM article_likes WHERE article_id=?', [req.params.id]
    );
    const [[{ virtual_likes }]] = await db.execute(
      'SELECT COALESCE(virtual_likes,0) AS virtual_likes FROM articles WHERE id=?', [req.params.id]
    );
    const total = Number(cnt) + Number(virtual_likes);
    res.json({ count: total, user_like_count: Number(cnt), virtual_likes: Number(virtual_likes), admin_liked: n === 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: upload image for an admin comment (auth-gated) ─────────────────────
router.post('/admin/:id/comments/image', verifyToken, uploadComment.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const relativePath = `/uploads/articles/${req.file.filename}`;
  res.json({ image_url: relativePath });
});

router.put('/hero', verifyToken, async (req, res) => {
  const eyebrow    = req.body.eyebrow    ?? null;
  const title      = req.body.title      ?? null;
  const title_em   = req.body.title_em   ?? null;
  const subtitle   = req.body.subtitle   ?? null;
  const breadcrumb = req.body.breadcrumb ?? null;
  try {
    const [existing] = await db.query('SELECT id FROM articles_hero LIMIT 1');
    if (existing.length) {
      await db.query(
        'UPDATE articles_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO articles_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM articles_hero LIMIT 1');
    res.json({ ...HERO_DEFAULTS, ...rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: single article by slug ───────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [[article]] = await db.execute(
      "SELECT * FROM articles WHERE slug = ? AND status = 'published'",
      [req.params.slug]
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Fetch full category objects for this article
    const slugs = (article.categories || '').split(/[\s,]+/).filter(Boolean);
    let categories = [];
    if (slugs.length) {
      const placeholders = slugs.map(() => '?').join(',');
      const [cats] = await db.execute(
        `SELECT * FROM article_categories WHERE slug IN (${placeholders})`,
        slugs
      );
      categories = cats;
    }

    // Prev / Next for navigation
    const [[prev]] = await db.execute(
      "SELECT slug, title FROM articles WHERE status='published' AND pub_date < ? ORDER BY pub_date DESC LIMIT 1",
      [article.pub_date || '9999-12-31']
    );
    const [[next]] = await db.execute(
      "SELECT slug, title FROM articles WHERE status='published' AND pub_date > ? ORDER BY pub_date ASC LIMIT 1",
      [article.pub_date || '0000-01-01']
    );

    res.json({ article, categories, prev: prev || null, next: next || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: create article ─────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const {
    slug, status = 'draft', is_featured = 0, title, excerpt = '', content = '',
    featured_image_url = '', author_name = 'Vinay Kulkarni',
    pub_date = null, pub_date_display = '', categories = '', tags = '',
    seo_title = '', meta_description = '', og_image_url = '', canonical_url = '',
    sort_order = 0,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });

  const finalSlug  = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const safePubDate = toMySqlDate(pub_date);
  const pubDisplay  = pub_date_display || formatDisplayDate(safePubDate);

  try {
    const [r] = await db.execute(
      `INSERT INTO articles
       (slug,status,is_featured,title,excerpt,content,featured_image_url,author_name,
        pub_date,pub_date_display,categories,tags,seo_title,meta_description,
        og_image_url,canonical_url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [finalSlug, status, is_featured ? 1 : 0, title, excerpt, content, featured_image_url,
       author_name, safePubDate, pubDisplay, categories, tags,
       seo_title, meta_description, og_image_url, canonical_url, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [r.insertId]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── ADMIN: reorder (before /:id so it doesn't match) ─────────────────────────
router.put('/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;
  try {
    for (const { id, sort_order } of items) {
      await db.execute('UPDATE articles SET sort_order=? WHERE id=?', [sort_order, id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: update article ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const {
    slug, status, is_featured, title, excerpt, content, featured_image_url,
    author_name, pub_date, pub_date_display, categories, tags,
    seo_title, meta_description, og_image_url, canonical_url, sort_order,
  } = req.body;

  const safePubDate = toMySqlDate(pub_date);
  const pubDisplay  = pub_date_display || formatDisplayDate(safePubDate);

  try {
    await db.execute(
      `UPDATE articles SET
       slug=?,status=?,is_featured=?,title=?,excerpt=?,content=?,
       featured_image_url=?,author_name=?,pub_date=?,pub_date_display=?,
       categories=?,tags=?,seo_title=?,meta_description=?,
       og_image_url=?,canonical_url=?,sort_order=?
       WHERE id=?`,
      [slug, status, is_featured ? 1 : 0, title, excerpt || '', content || '',
       featured_image_url || '', author_name || 'Vinay Kulkarni',
       safePubDate, pubDisplay, categories || '', tags || '',
       seo_title || '', meta_description || '', og_image_url || '', canonical_url || '',
       sort_order || 0, req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    else removeArticleSeoHtml(row.slug); // unpublished → remove stale pre-rendered file
    res.json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── ADMIN: upload featured image ──────────────────────────────────────────────
router.post('/:id/image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const image_url = `/uploads/articles/${req.file.filename}`;
  try {
    await db.execute('UPDATE articles SET featured_image_url=? WHERE id=?', [image_url, req.params.id]);
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    res.json({ image_url, article: row });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: delete article ─────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT slug FROM articles WHERE id=?', [req.params.id]);
    await db.execute('DELETE FROM articles WHERE id=?', [req.params.id]);
    if (row) removeArticleSeoHtml(row.slug);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', verifyToken, async (req, res) => {
  const { name, slug, description = '', sort_order = 0, wp_id = null } = req.body;
  try {
    const [r] = await db.execute(
      'INSERT INTO article_categories (name,slug,description,wp_id,sort_order) VALUES (?,?,?,?,?)',
      [name, slug, description, wp_id, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM article_categories WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/categories/:id', verifyToken, async (req, res) => {
  const { name, slug, description, sort_order } = req.body;
  try {
    await db.execute(
      'UPDATE article_categories SET name=?,slug=?,description=?,sort_order=? WHERE id=?',
      [name, slug, description || '', sort_order || 0, req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM article_categories WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categories/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM article_categories WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: likes ─────────────────────────────────────────────────────────────
// GET  /:id/likes  — return { count, liked } for a given user_token
// count = real user likes + virtual_likes boost set by admin
router.get('/:id/likes', async (req, res) => {
  const token = (req.query.token || '').trim();
  try {
    const [[{ cnt }]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM article_likes WHERE article_id=?', [req.params.id]
    );
    const [[{ virtual_likes }]] = await db.execute(
      'SELECT COALESCE(virtual_likes,0) AS virtual_likes FROM articles WHERE id=?', [req.params.id]
    );
    let liked = false;
    if (token) {
      const [[{ n }]] = await db.execute(
        'SELECT COUNT(*) AS n FROM article_likes WHERE article_id=? AND user_token=?',
        [req.params.id, token]
      );
      liked = n > 0;
    }
    res.json({ count: Number(cnt) + Number(virtual_likes), liked });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/like   — toggle like, body: { token }
router.post('/:id/like', async (req, res) => {
  const token = (req.body.token || '').trim();
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const [[{ n }]] = await db.execute(
      'SELECT COUNT(*) AS n FROM article_likes WHERE article_id=? AND user_token=?',
      [req.params.id, token]
    );
    if (n > 0) {
      await db.execute('DELETE FROM article_likes WHERE article_id=? AND user_token=?', [req.params.id, token]);
    } else {
      await db.execute('INSERT INTO article_likes (article_id, user_token) VALUES (?,?)', [req.params.id, token]);
    }
    // Return real + virtual so the count matches what GET /:id/likes returns
    const [[{ cnt }]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM article_likes WHERE article_id=?', [req.params.id]
    );
    const [[{ virtual_likes }]] = await db.execute(
      'SELECT COALESCE(virtual_likes,0) AS virtual_likes FROM articles WHERE id=?', [req.params.id]
    );
    res.json({ count: Number(cnt) + Number(virtual_likes), liked: n === 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: comments ──────────────────────────────────────────────────────────
// GET /:id/comments — approved comments only
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, author_name, content, image_url, created_at FROM article_comments WHERE article_id=? AND status='approved' ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/comments — submit a comment (goes to pending)
router.post('/:id/comments', async (req, res) => {
  const { author_name = 'Anonymous', content = '', image_url = '' } = req.body;
  if (!content.trim() && !image_url.trim())
    return res.status(400).json({ error: 'Comment content or image is required' });
  try {
    const [r] = await db.execute(
      'INSERT INTO article_comments (article_id, author_name, content, image_url) VALUES (?,?,?,?)',
      [req.params.id, author_name.trim() || 'Anonymous', content.trim(), image_url.trim()]
    );
    const [[row]] = await db.execute('SELECT * FROM article_comments WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /:id/comments/image — upload image for a comment (public, 5 MB)
router.post('/:id/comments/image', uploadComment.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const relativePath = `/uploads/articles/${req.file.filename}`;
  res.json({ image_url: relativePath });
});

module.exports = router;
