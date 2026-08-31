const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM con_hero LIMIT 1'),
      db.query('SELECT * FROM con_section LIMIT 1'),
      db.query('SELECT * FROM con_links ORDER BY sort_order, id'),
    ]);
    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];
    res.json({
      hero:    rows(0)[0] || {},
      section: rows(1)[0] || {},
      links:   rows(2),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM con_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM con_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE con_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO con_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM con_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SECTION (description text) ────────────────────────────────────────────────
router.get('/section', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM con_section LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/section', verifyToken, async (req, res) => {
  const { description } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM con_section LIMIT 1');
    if (ex.length) {
      await db.query('UPDATE con_section SET description=? WHERE id=?', [description, ex[0].id]);
    } else {
      await db.query('INSERT INTO con_section (description) VALUES (?)', [description]);
    }
    const [rows] = await db.query('SELECT * FROM con_section LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── LINKS ─────────────────────────────────────────────────────────────────────
router.get('/links', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM con_links ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/links', verifyToken, async (req, res) => {
  const { icon, label, href, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO con_links (icon,label,href,sort_order) VALUES (?,?,?,?)',
      [icon || '', label, href, sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM con_links WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/links/:id', verifyToken, async (req, res) => {
  const { icon, label, href, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE con_links SET icon=?,label=?,href=?,sort_order=? WHERE id=?',
      [icon || '', label, href, sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM con_links WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/links/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM con_links WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
