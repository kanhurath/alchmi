/**
 * Download Article Images — WordPress → Local
 *
 * Downloads every featured_image_url and og_image_url that still points
 * to the WordPress blog, saves files into /server/public/uploads/articles/,
 * then updates the database rows to use the local relative path.
 *
 * Usage:
 *   node server/scripts/download-article-images.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https   = require('https');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const db      = require('../db');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'articles');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

function localFilename(imageUrl) {
  try {
    const u        = new URL(imageUrl);
    const ext      = path.extname(u.pathname).toLowerCase() || '.jpg';
    const baseName = path.basename(u.pathname, path.extname(u.pathname));
    // Keep original name but sanitise and cap length
    const safe = baseName.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_').substring(0, 80);
    return `${safe}${ext}`;
  } catch {
    return `img-${Date.now()}.jpg`;
  }
}

function download(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    // Follow up to 5 redirects
    function get(url, hops) {
      if (hops > 5) return reject(new Error('Too many redirects'));
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return get(res.headers.location, hops + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const out = fs.createWriteStream(destPath);
        res.pipe(out);
        out.on('finish', () => out.close(resolve));
        out.on('error', reject);
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
    }
    get(imageUrl, 0);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📥  Article Image Downloader');
  console.log(`    Destination: ${UPLOAD_DIR}\n`);

  const [articles] = await db.execute(
    'SELECT id, slug, featured_image_url, og_image_url FROM articles ORDER BY id'
  );

  // Build a de-duplicated map: original URL → local relative path
  // We only download URLs that point to WordPress.
  const urlToLocal = new Map();
  const usedNames  = new Set();

  // Pre-populate with files already locally stored (from previous CKEditor uploads)
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    usedNames.add(f);
  }

  function registerUrl(url) {
    if (!url || !url.includes('vinaykulkarni.com')) return;
    if (urlToLocal.has(url)) return;              // already seen

    let filename = localFilename(url);
    // Avoid filename collisions
    if (usedNames.has(filename)) {
      const ext  = path.extname(filename);
      const base = path.basename(filename, ext);
      filename   = `${base}_${Date.now()}${ext}`;
    }
    usedNames.add(filename);
    urlToLocal.set(url, `/uploads/articles/${filename}`);
  }

  for (const a of articles) {
    registerUrl(a.featured_image_url);
    registerUrl(a.og_image_url);
  }

  console.log(`    ${urlToLocal.size} unique WordPress image URLs to download.\n`);

  // ── Download phase ──────────────────────────────────────────────────────────
  let ok = 0, fail = 0;
  const failed = [];
  const entries = [...urlToLocal.entries()];

  for (let i = 0; i < entries.length; i++) {
    const [url, localPath] = entries[i];
    const filename = path.basename(localPath);
    const destPath = path.join(UPLOAD_DIR, filename);
    const label    = `[${String(i + 1).padStart(3)}/${entries.length}]`;

    // Skip if file already exists and is non-empty
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`  ${label} ⏭  SKIP  ${filename}`);
      ok++;
      continue;
    }

    try {
      await download(url, destPath);
      const size = fs.statSync(destPath).size;
      console.log(`  ${label} ✓  ${(size / 1024).toFixed(0).padStart(5)} KB  ${filename}`);
      ok++;
    } catch (err) {
      console.error(`  ${label} ✗  FAIL  ${filename}  (${err.message})`);
      failed.push({ url, filename, error: err.message });
      // Remove empty/partial file
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      urlToLocal.delete(url);   // don't update DB for this URL
      fail++;
    }
  }

  console.log(`\n    Downloaded: ${ok}  |  Failed: ${fail}\n`);

  // ── Database update phase ───────────────────────────────────────────────────
  console.log('🔄  Updating database…');
  let updated = 0;

  for (const a of articles) {
    const newFeatured = urlToLocal.get(a.featured_image_url) ?? null;
    const newOg       = urlToLocal.get(a.og_image_url)       ?? null;

    // Only update if at least one field actually changed
    if (!newFeatured && !newOg) continue;

    const fields = [];
    const params = [];

    if (newFeatured) { fields.push('featured_image_url=?'); params.push(newFeatured); }
    if (newOg)       { fields.push('og_image_url=?');       params.push(newOg);       }

    params.push(a.id);
    await db.execute(`UPDATE articles SET ${fields.join(', ')} WHERE id=?`, params);
    updated++;
    console.log(`  ✓ #${a.id} ${a.slug?.substring(0, 55)}`);
  }

  console.log(`\n✅  Done — ${updated} articles updated in the database.`);

  if (failed.length) {
    console.log('\n⚠️  Failed downloads (manual attention needed):');
    failed.forEach(f => console.log(`   ${f.url}`));
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Script failed:', err.message);
  process.exit(1);
});
