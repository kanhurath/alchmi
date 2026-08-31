/**
 * Backfills blank seo_title and meta_description on articles.
 * Safe to re-run — only touches rows where each field is empty/null.
 *
 * Usage:  node scripts/backfill-seo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db');

// Strip HTML tags and collapse whitespace
function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Trim to maxLen at a word boundary, append … if cut
function trimToWords(text, maxLen = 155) {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen).replace(/\s+\S*$/, '');
  return cut + '…';
}

async function run() {
  const [rows] = await db.execute(`
    SELECT id, title, excerpt, content, seo_title, meta_description
    FROM articles
    WHERE (seo_title IS NULL OR TRIM(seo_title) = '')
       OR (meta_description IS NULL OR TRIM(meta_description) = '')
  `);

  if (!rows.length) {
    console.log('No articles need SEO backfill.');
    await db.end();
    return;
  }

  console.log(`Found ${rows.length} article(s) with missing SEO fields.\n`);

  let updated = 0;

  for (const row of rows) {
    const needsTitle = !row.seo_title || !row.seo_title.trim();
    const needsDesc  = !row.meta_description || !row.meta_description.trim();

    // seo_title — use the article title, max 300 chars
    const newTitle = needsTitle
      ? (row.title || '').slice(0, 300).trim()
      : row.seo_title;

    // meta_description — prefer excerpt, fall back to content
    let newDesc = row.meta_description;
    if (needsDesc) {
      const source = row.excerpt
        ? stripHtml(row.excerpt)
        : stripHtml(row.content || '');
      newDesc = trimToWords(source, 155);
    }

    if (!needsTitle && !needsDesc) continue;

    // Build a targeted UPDATE that only touches the blank columns
    if (needsTitle && needsDesc) {
      await db.execute(
        'UPDATE articles SET seo_title=?, meta_description=? WHERE id=?',
        [newTitle, newDesc, row.id]
      );
    } else if (needsTitle) {
      await db.execute(
        'UPDATE articles SET seo_title=? WHERE id=?',
        [newTitle, row.id]
      );
    } else {
      await db.execute(
        'UPDATE articles SET meta_description=? WHERE id=?',
        [newDesc, row.id]
      );
    }

    console.log(`[${row.id}] "${(row.title || '').slice(0, 60)}"`);
    if (needsTitle) console.log(`  seo_title       → "${newTitle.slice(0, 80)}"`);
    if (needsDesc)  console.log(`  meta_description → "${newDesc.slice(0, 80)}…"`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} article(s).`);
  await db.end();
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
