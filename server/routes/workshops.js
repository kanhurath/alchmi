const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback; }
  catch { return fallback; }
}

function parseCard(row) {
  return { ...row, featured: !!row.featured, specs: safeJson(row.specs_json, []) };
}

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM wks_hero LIMIT 1'),
      db.query('SELECT * FROM wks_intro LIMIT 1'),
      db.query('SELECT * FROM wks_filters ORDER BY sort_order'),
      db.query('SELECT * FROM wks_cards ORDER BY sort_order, id'),
      db.query('SELECT * FROM wks_retreats ORDER BY sort_order, id'),
      db.query('SELECT * FROM wks_testimonials ORDER BY sort_order, id'),
    ]);

    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];

    res.json({
      hero:         rows(0)[0] || {},
      intro:        rows(1)[0] || {},
      filters:      rows(2),
      cards:        rows(3).map(parseCard),
      retreats:     rows(4),
      testimonials: rows(5),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM wks_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE wks_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO wks_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM wks_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── INTRO ─────────────────────────────────────────────────────────────────────
router.get('/intro', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_intro LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/intro', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, description, btn_label } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM wks_intro LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE wks_intro SET eyebrow=?,title=?,title_em=?,description=?,btn_label=? WHERE id=?',
        [eyebrow, title, title_em, description, btn_label, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO wks_intro (eyebrow,title,title_em,description,btn_label) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, description, btn_label]
      );
    }
    const [rows] = await db.query('SELECT * FROM wks_intro LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── FILTERS ───────────────────────────────────────────────────────────────────
router.get('/filters', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_filters ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/filters', verifyToken, async (req, res) => {
  const { key, label, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO wks_filters (key_name,label,sort_order) VALUES (?,?,?)',
      [key, label, sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM wks_filters WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/filters/:id', verifyToken, async (req, res) => {
  const { key, label, sort_order } = req.body;
  try {
    await db.query('UPDATE wks_filters SET key_name=?,label=?,sort_order=? WHERE id=?',
      [key, label, sort_order, req.params.id]);
    const [rows] = await db.query('SELECT * FROM wks_filters WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/filters/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wks_filters WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── WORKSHOP CARDS ────────────────────────────────────────────────────────────
router.get('/cards', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_cards ORDER BY sort_order, id');
    res.json(rows.map(parseCard));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cards', verifyToken, async (req, res) => {
  const { featured, cat_keys, glyph, format, tag, title,
          description, specs, audience, cta_label, url, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO wks_cards
       (featured,cat_keys,glyph,format,tag,title,description,specs_json,audience,cta_label,url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [featured ? 1 : 0, cat_keys || '', glyph || '', format || '', tag || '',
       title, description || '', JSON.stringify(specs || []),
       audience || '', cta_label || 'Enquire', url || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM wks_cards WHERE id=?', [r.insertId]);
    res.status(201).json(parseCard(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cards/:id', verifyToken, async (req, res) => {
  const { featured, cat_keys, glyph, format, tag, title,
          description, specs, audience, cta_label, url, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE wks_cards SET featured=?,cat_keys=?,glyph=?,format=?,tag=?,title=?,description=?,
       specs_json=?,audience=?,cta_label=?,url=?,sort_order=? WHERE id=?`,
      [featured ? 1 : 0, cat_keys || '', glyph || '', format || '', tag || '',
       title, description || '', JSON.stringify(specs || []),
       audience || '', cta_label || 'Enquire', url || '',
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM wks_cards WHERE id=?', [req.params.id]);
    res.json(parseCard(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/cards/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wks_cards WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── RETREATS ──────────────────────────────────────────────────────────────────
router.get('/retreats', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_retreats ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/retreats', verifyToken, async (req, res) => {
  const { numeral, title, sub, description, footer, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO wks_retreats (numeral,title,sub,description,footer,sort_order) VALUES (?,?,?,?,?,?)',
      [numeral || '', title, sub || '', description || '', footer || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM wks_retreats WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/retreats/:id', verifyToken, async (req, res) => {
  const { numeral, title, sub, description, footer, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE wks_retreats SET numeral=?,title=?,sub=?,description=?,footer=?,sort_order=? WHERE id=?',
      [numeral || '', title, sub || '', description || '', footer || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM wks_retreats WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/retreats/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wks_retreats WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
router.get('/testimonials', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wks_testimonials ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/testimonials', verifyToken, async (req, res) => {
  const { quote, name, role, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO wks_testimonials (quote,name,role,sort_order) VALUES (?,?,?,?)',
      [quote, name, role || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM wks_testimonials WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/testimonials/:id', verifyToken, async (req, res) => {
  const { quote, name, role, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE wks_testimonials SET quote=?,name=?,role=?,sort_order=? WHERE id=?',
      [quote, name, role || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM wks_testimonials WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/testimonials/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wks_testimonials WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
