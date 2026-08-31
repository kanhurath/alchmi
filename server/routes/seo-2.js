const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

const VALID_SLUGS = new Set(['home', 'biography', 'teaching', 'videos', 'events', 'workshops', 'connect', 'gallery', 'news', 'testimonials']);

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pages');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── GET /:slug ────────────────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  try {
    const [[row]] = await db.execute('SELECT * FROM page_seo WHERE page_slug=?', [req.params.slug]);
    res.json(row || { page_slug: req.params.slug });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:slug — upsert SEO settings ─────────────────────────────────────────
router.put('/:slug', verifyToken, async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  const { seo_title, meta_description, focus_keyword, canonical_url, og_image_url, custom_schema } = req.body;
  const slug = req.params.slug;
  const vals = [
    seo_title        || null,
    meta_description || null,
    focus_keyword    || null,
    canonical_url    || null,
    og_image_url     || null,
    custom_schema    || null,
  ];
  try {
    const [[existing]] = await db.execute(
      'SELECT page_slug FROM page_seo WHERE page_slug=?', [slug]
    );
    if (existing) {
      await db.execute(
        `UPDATE page_seo
         SET seo_title=?, meta_description=?, focus_keyword=?, canonical_url=?, og_image_url=?, custom_schema=?
         WHERE page_slug=?`,
        [...vals, slug]
      );
    } else {
      await db.execute(
        `INSERT INTO page_seo (page_slug, seo_title, meta_description, focus_keyword, canonical_url, og_image_url, custom_schema)
         VALUES (?,?,?,?,?,?,?)`,
        [slug, ...vals]
      );
    }
    const [[row]] = await db.execute('SELECT * FROM page_seo WHERE page_slug=?', [slug]);
    res.json(row);
  } catch (err) {
    console.error('[seo] PUT /' + slug + ' error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /:slug/upload-image — OG image upload ───────────────────────────────
router.post('/:slug/upload-image', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

module.exports = router;
