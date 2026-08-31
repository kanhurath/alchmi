const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const sharp   = require('sharp');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router   = express.Router();
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Memory storage — sharp processes the buffer before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB raw (compressed output is much smaller)
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Image processing ──────────────────────────────────────────────────────────
// Given a buffer (or file path), writes four optimised variants to uploadDir:
//   {stem}.jpg        — full-size progressive JPEG  ≤1600 px wide,  q82
//   {stem}.webp       — full-size WebP              ≤1600 px wide,  q80
//   {stem}-thumb.jpg  — thumbnail progressive JPEG  ≤800 px wide,   q75
//   {stem}-thumb.webp — thumbnail WebP              ≤800 px wide,   q72
// Returns the stem used.

async function processImage(input, stem) {
  const pipeline = sharp(input, { failOnError: false }).rotate(); // auto-rotate by EXIF

  const fullOpts  = { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true };
  const thumbOpts = { width: 800,  height: 800,  fit: 'inside', withoutEnlargement: true };

  await Promise.all([
    pipeline.clone().resize(fullOpts).jpeg({ quality: 82, progressive: true })
      .toFile(path.join(uploadDir, `${stem}.jpg`)),

    pipeline.clone().resize(fullOpts).webp({ quality: 80, effort: 4 })
      .toFile(path.join(uploadDir, `${stem}.webp`)),

    pipeline.clone().resize(thumbOpts).jpeg({ quality: 75, progressive: true })
      .toFile(path.join(uploadDir, `${stem}-thumb.jpg`)),

    pipeline.clone().resize(thumbOpts).webp({ quality: 72, effort: 4 })
      .toFile(path.join(uploadDir, `${stem}-thumb.webp`)),
  ]);

  return stem;
}

// Clean up files written for a stem on error
function cleanupStem(stem) {
  [`${stem}.jpg`, `${stem}.webp`, `${stem}-thumb.jpg`, `${stem}-thumb.webp`].forEach(f => {
    try { fs.unlinkSync(path.join(uploadDir, f)); } catch (_) {}
  });
}

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM gal_hero LIMIT 1'),
      db.query('SELECT * FROM gal_images ORDER BY sort_order, id'),
    ]);
    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];
    res.json({ hero: rows(0)[0] || {}, images: rows(1) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gal_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM gal_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE gal_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO gal_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM gal_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GALLERY IMAGES ────────────────────────────────────────────────────────────
router.get('/images', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gal_images ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create — JSON metadata only (image uploaded separately)
router.post('/images', verifyToken, async (req, res) => {
  const { cat, caption, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO gal_images (cat,caption,image_url,sort_order) VALUES (?,?,?,?)',
      [cat || 'iks', caption || '', '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM gal_images WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update metadata
router.put('/images/:id', verifyToken, async (req, res) => {
  const { cat, caption, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE gal_images SET cat=?,caption=?,sort_order=? WHERE id=?',
      [cat || '', caption || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM gal_images WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload / replace image — compresses and generates responsive variants
router.post('/images/:id/upload', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const stem = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  try {
    await processImage(req.file.buffer, stem);
    const imageUrl = `/uploads/gallery/${stem}.jpg`;
    await db.query('UPDATE gal_images SET image_url=? WHERE id=?', [imageUrl, req.params.id]);
    res.json({ image_url: imageUrl });
  } catch (err) {
    cleanupStem(stem);
    res.status(500).json({ error: err.message });
  }
});

// Reprocess existing images — generates WebP + thumbnail variants for images
// uploaded before optimisation was in place. Safe to call multiple times.
router.post('/images/reprocess', verifyToken, async (req, res) => {
  try {
    const [images] = await db.query(
      "SELECT id, image_url FROM gal_images WHERE image_url != '' AND image_url IS NOT NULL"
    );
    const results = { processed: 0, skipped: 0, errors: [] };

    for (const img of images) {
      const filename = path.basename(img.image_url);
      const stem     = filename.replace(/\.[^.]+$/, ''); // strip extension

      // Skip rows that are already pointing at a -thumb file (shouldn't happen)
      if (stem.endsWith('-thumb')) { results.skipped++; continue; }

      const fullPath    = path.join(uploadDir, filename);
      const thumbWebp   = path.join(uploadDir, `${stem}-thumb.webp`);

      // Already processed — skip
      if (fs.existsSync(thumbWebp)) { results.skipped++; continue; }

      if (!fs.existsSync(fullPath)) { results.skipped++; continue; }

      try {
        // Write WebP + thumbnail variants from the existing (possibly large) original
        await Promise.all([
          // Full WebP (beside the original JPEG)
          sharp(fullPath, { failOnError: false }).rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80, effort: 4 })
            .toFile(path.join(uploadDir, `${stem}.webp`)),

          // Thumbnail JPEG
          sharp(fullPath, { failOnError: false }).rotate()
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true })
            .toFile(path.join(uploadDir, `${stem}-thumb.jpg`)),

          // Thumbnail WebP
          sharp(fullPath, { failOnError: false }).rotate()
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 72, effort: 4 })
            .toFile(thumbWebp),
        ]);

        // Compress the original in-place if it is over 300 KB
        const stat = fs.statSync(fullPath);
        if (stat.size > 300 * 1024) {
          const tmpPath = fullPath + '.tmp';
          await sharp(fullPath, { failOnError: false }).rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true })
            .toFile(tmpPath);
          fs.renameSync(tmpPath, fullPath);
        }

        results.processed++;
      } catch (e) {
        results.errors.push({ id: img.id, url: img.image_url, error: e.message });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/images/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url FROM gal_images WHERE id=?', [req.params.id]);
    if (rows[0]?.image_url) {
      const stem = path.basename(rows[0].image_url).replace(/\.[^.]+$/, '');
      cleanupStem(stem); // delete all four variants
    }
    await db.query('DELETE FROM gal_images WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
