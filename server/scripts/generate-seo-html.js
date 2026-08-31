'use strict';

/**
 * generate-seo-html.js
 *
 * One-time / deployment script: pre-renders SEO HTML for every published
 * article so that static hosts (nginx, CDN) serve correct meta tags in
 * View Page Source without needing Node.js to handle the HTML request.
 *
 * Run after every frontend build AND whenever bulk re-generation is needed:
 *   node server/scripts/generate-seo-html.js
 *   — or —
 *   cd server && npm run generate-seo
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const db = require('../db');
const {
  buildArticleTags,
  injectTags,
  DIST_HTML,
  DIST_DIR,
} = require('../seoHtmlBuilder');

async function main() {
  if (!fs.existsSync(DIST_HTML)) {
    console.error(`[generate-seo] dist/index.html not found at ${DIST_HTML}`);
    console.error('  Run `npm run build` in the frontend directory first.');
    process.exit(1);
  }

  const template = fs.readFileSync(DIST_HTML, 'utf8');

  let articles;
  try {
    const [rows] = await db.execute(
      `SELECT slug, title, excerpt, seo_title, meta_description,
              og_image_url, featured_image_url, canonical_url,
              tags, pub_date, author_name
       FROM articles
       WHERE status = 'published'
       ORDER BY pub_date DESC`
    );
    articles = rows;
  } catch (err) {
    console.error('[generate-seo] DB error:', err.message);
    process.exit(1);
  }

  let count = 0;
  for (const article of articles) {
    try {
      const tags    = buildArticleTags(article);
      const html    = injectTags(template, tags);
      const outDir  = path.join(DIST_DIR, 'articles', article.slug);
      const outFile = path.join(outDir, 'index.html');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, html, 'utf8');
      console.log(`[generate-seo]   wrote dist/articles/${article.slug}/index.html`);
      count++;
    } catch (err) {
      console.warn(`[generate-seo]   skipped "${article.slug}":`, err.message);
    }
  }

  console.log(`\n[generate-seo] done — ${count} of ${articles.length} articles written.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[generate-seo] fatal:', err.message);
  process.exit(1);
});
