const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM tst_hero LIMIT 1'),
      db.query('SELECT * FROM tst_filters ORDER BY sort_order'),
      db.query('SELECT * FROM tst_featured LIMIT 1'),
      db.query('SELECT * FROM tst_cards ORDER BY sort_order, id'),
      db.query('SELECT * FROM tst_stats ORDER BY sort_order'),
      db.query('SELECT * FROM tst_pull_quotes ORDER BY sort_order, id'),
    ]);
    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];
    res.json({
      hero:       rows(0)[0] || {},
      filters:    rows(1),
      featured:   rows(2)[0] || {},
      cards:      rows(3),
      stats:      rows(4),
      pullQuotes: rows(5),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM tst_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE tst_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO tst_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM tst_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── FILTERS ───────────────────────────────────────────────────────────────────
router.get('/filters', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_filters ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/filters', verifyToken, async (req, res) => {
  const { key_name, label, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO tst_filters (key_name,label,sort_order) VALUES (?,?,?)',
      [key_name, label, sort_order || 0]);
    const [rows] = await db.query('SELECT * FROM tst_filters WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/filters/:id', verifyToken, async (req, res) => {
  const { key_name, label, sort_order } = req.body;
  try {
    await db.query('UPDATE tst_filters SET key_name=?,label=?,sort_order=? WHERE id=?',
      [key_name, label, sort_order, req.params.id]);
    const [rows] = await db.query('SELECT * FROM tst_filters WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/filters/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tst_filters WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── FEATURED QUOTE ────────────────────────────────────────────────────────────
router.get('/featured', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_featured LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/featured', verifyToken, async (req, res) => {
  const { quote, author, role, program } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM tst_featured LIMIT 1');
    if (ex.length) {
      await db.query('UPDATE tst_featured SET quote=?,author=?,role=?,program=? WHERE id=?',
        [quote, author, role, program, ex[0].id]);
    } else {
      await db.query('INSERT INTO tst_featured (quote,author,role,program) VALUES (?,?,?,?)',
        [quote, author, role, program]);
    }
    const [rows] = await db.query('SELECT * FROM tst_featured LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TESTIMONIAL CARDS ─────────────────────────────────────────────────────────
router.get('/cards', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_cards ORDER BY sort_order, id');
    res.json(rows.map(r => ({ ...r, large: !!r.large })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cards', verifyToken, async (req, res) => {
  const { cat_keys, large, avatar, text, author, role, program, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO tst_cards (cat_keys,large,avatar,text,author,role,program,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [cat_keys || '', large ? 1 : 0, avatar || '', text, author, role || '', program || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM tst_cards WHERE id=?', [r.insertId]);
    res.status(201).json({ ...rows[0], large: !!rows[0].large });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cards/:id', verifyToken, async (req, res) => {
  const { cat_keys, large, avatar, text, author, role, program, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE tst_cards SET cat_keys=?,large=?,avatar=?,text=?,author=?,role=?,program=?,sort_order=? WHERE id=?',
      [cat_keys || '', large ? 1 : 0, avatar || '', text, author, role || '', program || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM tst_cards WHERE id=?', [req.params.id]);
    res.json({ ...rows[0], large: !!rows[0].large });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/cards/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tst_cards WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_stats ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/stats', verifyToken, async (req, res) => {
  const { number, suffix, label, description, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO tst_stats (number,suffix,label,description,sort_order) VALUES (?,?,?,?,?)',
      [number, suffix || '', label, description || '', sort_order || 0]);
    const [rows] = await db.query('SELECT * FROM tst_stats WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/stats/:id', verifyToken, async (req, res) => {
  const { number, suffix, label, description, sort_order } = req.body;
  try {
    await db.query('UPDATE tst_stats SET number=?,suffix=?,label=?,description=?,sort_order=? WHERE id=?',
      [number, suffix || '', label, description || '', sort_order, req.params.id]);
    const [rows] = await db.query('SELECT * FROM tst_stats WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/stats/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tst_stats WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PULL QUOTES ───────────────────────────────────────────────────────────────
router.get('/pull-quotes', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tst_pull_quotes ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pull-quotes', verifyToken, async (req, res) => {
  const { program, avatar, text, author, role, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO tst_pull_quotes (program,avatar,text,author,role,sort_order) VALUES (?,?,?,?,?,?)',
      [program || '', avatar || '', text, author, role || '', sort_order || 0]);
    const [rows] = await db.query('SELECT * FROM tst_pull_quotes WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pull-quotes/:id', verifyToken, async (req, res) => {
  const { program, avatar, text, author, role, sort_order } = req.body;
  try {
    await db.query('UPDATE tst_pull_quotes SET program=?,avatar=?,text=?,author=?,role=?,sort_order=? WHERE id=?',
      [program || '', avatar || '', text, author, role || '', sort_order, req.params.id]);
    const [rows] = await db.query('SELECT * FROM tst_pull_quotes WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/pull-quotes/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tst_pull_quotes WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
