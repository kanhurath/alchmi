const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

const VALID_SLUGS = new Set(['home', 'biography', 'teaching', 'videos', 'events', 'workshops', 'connect', 'gallery']);

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pages');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload    = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadPdf = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf')
      cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const parseContent = row => {
  if (!row) return null;
  let content = {};
  try { if (row.content) content = JSON.parse(row.content); } catch { /* ignore */ }
  return { ...row, content };
};

// ── GET /:slug — list blocks ──────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  try {
    const [rows] = await db.query(
      'SELECT * FROM site_page_blocks WHERE page_slug=? ORDER BY sort_order',
      [req.params.slug]
    );
    res.json(rows.map(parseContent));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /:slug — add block ───────────────────────────────────────────────────
router.post('/:slug', verifyToken, async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  const { block_type, content, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO site_page_blocks (page_slug, block_type, content, sort_order) VALUES (?,?,?,?)',
      [req.params.slug, block_type, JSON.stringify(content || {}), sort_order || 0]
    );
    const [[row]] = await db.query('SELECT * FROM site_page_blocks WHERE id=?', [r.insertId]);
    res.status(201).json(parseContent(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:slug/reorder — reorder blocks ───────────────────────────────────────
router.put('/:slug/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;
  try {
    await Promise.all(items.map(({ id, sort_order }) =>
      db.query('UPDATE site_page_blocks SET sort_order=? WHERE id=? AND page_slug=?',
        [sort_order, id, req.params.slug])
    ));
    res.json({ updated: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:slug/:blockId — update block content ────────────────────────────────
router.put('/:slug/:blockId', verifyToken, async (req, res) => {
  const { content } = req.body;
  try {
    await db.query(
      'UPDATE site_page_blocks SET content=? WHERE id=? AND page_slug=?',
      [JSON.stringify(content), req.params.blockId, req.params.slug]
    );
    const [[row]] = await db.query('SELECT * FROM site_page_blocks WHERE id=?', [req.params.blockId]);
    res.json(parseContent(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /:slug/:blockId ────────────────────────────────────────────────────
router.delete('/:slug/:blockId', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM site_page_blocks WHERE id=? AND page_slug=?',
      [req.params.blockId, req.params.slug]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /:slug/upload — image upload ────────────────────────────────────────
router.post('/:slug/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

// ── POST /:slug/upload-pdf — PDF upload ──────────────────────────────────────
router.post('/:slug/upload-pdf', verifyToken, uploadPdf.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

module.exports = router;
