const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

const VALID_SLUGS = [
  'home', 'biography', 'teaching', 'videos', 'events',
  'news', 'workshops', 'testimonials', 'gallery', 'connect',
];

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_page_status (
      slug       VARCHAR(50) PRIMARY KEY,
      status     ENUM('published','draft') NOT NULL DEFAULT 'published',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}
ensureTable().catch(e => console.error('[page-status] init failed:', e.message));

// GET /api/page-status — all statuses as a flat object { home: 'published', ... }
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT slug, status FROM cms_page_status');
    const result = {};
    VALID_SLUGS.forEach(s => { result[s] = 'published'; }); // default all to published
    rows.forEach(r => { result[r.slug] = r.status; });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/page-status/:slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!VALID_SLUGS.includes(slug)) return res.status(400).json({ error: 'Unknown slug' });
  try {
    const [[row]] = await db.execute('SELECT status FROM cms_page_status WHERE slug=?', [slug]);
    res.json({ slug, status: row?.status || 'published' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/page-status/:slug  (admin only)
router.put('/:slug', verifyToken, async (req, res) => {
  const { slug } = req.params;
  if (!VALID_SLUGS.includes(slug)) return res.status(400).json({ error: 'Unknown slug' });
  const { status } = req.body;
  if (!['published', 'draft'].includes(status)) {
    return res.status(400).json({ error: "status must be 'published' or 'draft'" });
  }
  try {
    await db.execute(
      `INSERT INTO cms_page_status (slug, status) VALUES (?,?)
       ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [slug, status]
    );
    res.json({ slug, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
