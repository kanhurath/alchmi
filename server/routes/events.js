const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback; }
  catch { return fallback; }
}

function parseUpcoming(row) {
  return {
    ...row,
    featured:      !!row.featured,
    spots_percent: row.spots_percent ?? null,
    meta:          safeJson(row.meta_json, []),
  };
}

function parseCompleted(row) {
  return { ...row, meta: safeJson(row.meta_json, []) };
}

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM evt_hero LIMIT 1'),
      db.query('SELECT * FROM evt_upcoming ORDER BY sort_order, id'),
      db.query('SELECT * FROM evt_completed ORDER BY sort_order, id'),
    ]);

    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];

    res.json({
      hero:      rows(0)[0] || {},
      upcoming:  rows(1).map(parseUpcoming),
      completed: rows(2).map(parseCompleted),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evt_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM evt_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE evt_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO evt_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM evt_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── UPCOMING EVENTS ───────────────────────────────────────────────────────────
router.get('/upcoming', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evt_upcoming ORDER BY sort_order, id');
    res.json(rows.map(parseUpcoming));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/upcoming', verifyToken, async (req, res) => {
  const { featured, day, month, year, type, title, description,
          meta, register_label, spots_percent, spots_label, url, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO evt_upcoming
       (featured,day,month,year,type,title,description,meta_json,
        register_label,spots_percent,spots_label,url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [featured ? 1 : 0, day, month, year || '', type, title, description || '',
       JSON.stringify(meta || []), register_label || 'Register',
       spots_percent ?? null, spots_label || '', url || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM evt_upcoming WHERE id=?', [r.insertId]);
    res.status(201).json(parseUpcoming(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/upcoming/:id', verifyToken, async (req, res) => {
  const { featured, day, month, year, type, title, description,
          meta, register_label, spots_percent, spots_label, url, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE evt_upcoming SET featured=?,day=?,month=?,year=?,type=?,title=?,description=?,
       meta_json=?,register_label=?,spots_percent=?,spots_label=?,url=?,sort_order=?
       WHERE id=?`,
      [featured ? 1 : 0, day, month, year || '', type, title, description || '',
       JSON.stringify(meta || []), register_label || 'Register',
       spots_percent ?? null, spots_label || '', url || '',
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM evt_upcoming WHERE id=?', [req.params.id]);
    res.json(parseUpcoming(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/upcoming/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM evt_upcoming WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COMPLETED EVENTS ──────────────────────────────────────────────────────────
router.get('/completed', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evt_completed ORDER BY sort_order, id');
    res.json(rows.map(parseCompleted));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/completed', verifyToken, async (req, res) => {
  const { day, month, type, title, meta, url, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO evt_completed (day,month,type,title,meta_json,url,sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [day, month, type, title, JSON.stringify(meta || []), url || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM evt_completed WHERE id=?', [r.insertId]);
    res.status(201).json(parseCompleted(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/completed/:id', verifyToken, async (req, res) => {
  const { day, month, type, title, meta, url, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE evt_completed SET day=?,month=?,type=?,title=?,meta_json=?,url=?,sort_order=?
       WHERE id=?`,
      [day, month, type, title, JSON.stringify(meta || []), url || '',
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM evt_completed WHERE id=?', [req.params.id]);
    res.json(parseCompleted(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/completed/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM evt_completed WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
