const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Upload (block images) ─────────────────────────────────────────────────────
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

// ── Add layout / area columns if they don't exist yet ─────────────────────────
async function ensureColumns() {
  try {
    await db.query(
      `ALTER TABLE custom_pages ADD COLUMN layout
       ENUM('no_sidebar','left_sidebar','right_sidebar') NOT NULL DEFAULT 'no_sidebar'`
    );
  } catch (_) { /* column already exists */ }
  try {
    await db.query(
      `ALTER TABLE page_blocks ADD COLUMN area
       ENUM('main','sidebar') NOT NULL DEFAULT 'main'`
    );
  } catch (_) { /* column already exists */ }
}
ensureColumns().catch(e => console.error('[customPages] column migration failed:', e.message));

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseContent = row => {
  if (!row) return null;
  let content = {};
  try { if (row.content) content = JSON.parse(row.content); }
  catch (e) { console.warn(`[page_blocks id=${row.id}] JSON.parse failed:`, e.message); }
  return { ...row, content };
};

// ── GET /api/custom-pages — list ──────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT p.*, COUNT(b.id) AS block_count
      FROM custom_pages p
      LEFT JOIN page_blocks b ON b.page_id = p.id
      GROUP BY p.id ORDER BY p.created_at DESC
    `);
    res.json(pages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/custom-pages/by-slug/:slug — frontend fetch ─────────────────────
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const [[page]] = await db.query(
      "SELECT * FROM custom_pages WHERE slug=? AND status='published'",
      [req.params.slug]
    );
    if (!page) return res.status(404).json({ error: 'Page not found or not published' });
    const [blocks] = await db.query(
      'SELECT * FROM page_blocks WHERE page_id=? ORDER BY sort_order',
      [page.id]
    );
    res.json({ ...page, blocks: blocks.map(parseContent) });
  } catch (err) {
    console.error(`[by-slug/${req.params.slug}] 500:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/custom-pages/:id — single page with blocks ──────────────────────
router.get('/:id', async (req, res) => {
  const numId = parseInt(req.params.id, 10);
  if (!numId) return res.status(404).json({ error: 'Not found' });
  try {
    const [[page]] = await db.query('SELECT * FROM custom_pages WHERE id=?', [numId]);
    if (!page) return res.status(404).json({ error: 'Not found' });
    const [blocks] = await db.query(
      'SELECT * FROM page_blocks WHERE page_id=? ORDER BY sort_order',
      [page.id]
    );
    res.json({ ...page, blocks: blocks.map(parseContent) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/custom-pages — create page ─────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const {
    title, slug, status, layout = 'no_sidebar',
    meta_description, seo_title, focus_keyword, canonical_url, og_image_url, custom_schema,
  } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO custom_pages
       (title, slug, status, layout, meta_description, seo_title, focus_keyword, canonical_url, og_image_url, custom_schema)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        title || 'Untitled', slug || '', status || 'draft', layout,
        meta_description || '',
        seo_title || null, focus_keyword || null, canonical_url || null,
        og_image_url || null, custom_schema || null,
      ]
    );
    const [[row]] = await db.query('SELECT * FROM custom_pages WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/custom-pages/:id — update page meta ─────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const numId = parseInt(req.params.id, 10);
  if (!numId) return res.status(404).json({ error: 'Not found' });
  const {
    title, slug, status, layout = 'no_sidebar',
    meta_description, seo_title, focus_keyword, canonical_url, og_image_url, custom_schema,
  } = req.body;
  try {
    await db.query(
      `UPDATE custom_pages
       SET title=?, slug=?, status=?, layout=?, meta_description=?,
           seo_title=?, focus_keyword=?, canonical_url=?, og_image_url=?, custom_schema=?
       WHERE id=?`,
      [
        title, slug, status, layout, meta_description || '',
        seo_title || null, focus_keyword || null, canonical_url || null,
        og_image_url || null, custom_schema || null,
        numId,
      ]
    );
    const [[row]] = await db.query('SELECT * FROM custom_pages WHERE id=?', [numId]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/custom-pages/:id ─────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  const numId = parseInt(req.params.id, 10);
  if (!numId) return res.status(404).json({ error: 'Not found' });
  try {
    await db.query('DELETE FROM custom_pages WHERE id=?', [numId]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/custom-pages/:id/blocks/upload (images) ────────────────────────
router.post('/:id/blocks/upload', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

// ── POST /api/custom-pages/:id/blocks/upload-pdf ─────────────────────────────
router.post('/:id/blocks/upload-pdf', verifyToken, uploadPdf.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

// ── PUT /api/custom-pages/:id/blocks/reorder ─────────────────────────────────
router.put('/:id/blocks/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;
  try {
    await Promise.all(items.map(({ id, sort_order }) =>
      db.query('UPDATE page_blocks SET sort_order=? WHERE id=? AND page_id=?', [sort_order, id, req.params.id])
    ));
    res.json({ updated: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/custom-pages/:id/blocks ────────────────────────────────────────
router.post('/:id/blocks', verifyToken, async (req, res) => {
  const { block_type, content, sort_order, area = 'main' } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO page_blocks (page_id, block_type, content, sort_order, area) VALUES (?,?,?,?,?)',
      [req.params.id, block_type, JSON.stringify(content || {}), sort_order || 0, area]
    );
    const [[row]] = await db.query('SELECT * FROM page_blocks WHERE id=?', [r.insertId]);
    res.status(201).json(parseContent(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/custom-pages/:id/blocks/:bid ────────────────────────────────────
router.put('/:id/blocks/:bid', verifyToken, async (req, res) => {
  const { content } = req.body;
  try {
    await db.query('UPDATE page_blocks SET content=? WHERE id=? AND page_id=?',
      [JSON.stringify(content), req.params.bid, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM page_blocks WHERE id=?', [req.params.bid]);
    res.json(parseContent(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/custom-pages/:id/blocks/:bid ─────────────────────────────────
router.delete('/:id/blocks/:bid', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM page_blocks WHERE id=? AND page_id=?', [req.params.bid, req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
