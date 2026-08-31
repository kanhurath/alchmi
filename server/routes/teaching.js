const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

/*
  Required MySQL tables — run once:

  CREATE TABLE tch_hero (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    eyebrow VARCHAR(200), title VARCHAR(200), title_em VARCHAR(200),
    subtitle TEXT, breadcrumb VARCHAR(200)
  );

  CREATE TABLE tch_stats (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    num VARCHAR(20), label VARCHAR(100),
    sort_order TINYINT UNSIGNED DEFAULT 0
  );

  CREATE TABLE tch_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(200), period VARCHAR(200), location VARCHAR(200),
    org VARCHAR(300), featured TINYINT(1) DEFAULT 0,
    variant VARCHAR(20) DEFAULT '',
    plain TEXT,
    stats_json TEXT, bullets_json TEXT, tags_json TEXT,
    sort_order TINYINT UNSIGNED DEFAULT 0
  );

  CREATE TABLE tch_courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(300), title VARCHAR(300), subtitle VARCHAR(300),
    date_text VARCHAR(200), location_text VARCHAR(200),
    rating VARCHAR(20), rating_label VARCHAR(100),
    pull_quote TEXT, pq_attr VARCHAR(300),
    specs_json TEXT, paragraphs_json TEXT,
    sort_order TINYINT UNSIGNED DEFAULT 0
  );

  CREATE TABLE tch_feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stars TINYINT UNSIGNED DEFAULT 5,
    text TEXT, name VARCHAR(200), institution TEXT,
    av_class VARCHAR(20) DEFAULT 'av-a',
    sort_order TINYINT UNSIGNED DEFAULT 0
  );

  CREATE TABLE tch_themes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    glyph VARCHAR(20), title VARCHAR(300), description TEXT,
    sort_order TINYINT UNSIGNED DEFAULT 0
  );
*/

function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback; }
  catch { return fallback; }
}

function parseHistory(row) {
  return {
    ...row,
    featured: !!row.featured,
    stats:   safeJson(row.stats_json,   []),
    bullets: safeJson(row.bullets_json, []),
    tags:    safeJson(row.tags_json,    []),
  };
}

function parseCourse(row) {
  return {
    ...row,
    specs:      safeJson(row.specs_json,      []),
    paragraphs: safeJson(row.paragraphs_json, []),
  };
}

// ── ALL (single fetch for the frontend page) ──────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    // Promise.allSettled lets each table query succeed or fail independently.
    // A missing table in one section won't break the other five sections.
    const results = await Promise.allSettled([
      db.query('SELECT * FROM tch_hero LIMIT 1'),
      db.query('SELECT * FROM tch_stats ORDER BY sort_order'),
      db.query('SELECT * FROM tch_history ORDER BY sort_order'),
      db.query('SELECT * FROM tch_courses ORDER BY sort_order'),
      db.query('SELECT * FROM tch_feedback ORDER BY sort_order'),
      db.query('SELECT * FROM tch_themes ORDER BY sort_order'),
    ]);

    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];

    const heroRows   = rows(0);
    const statsRows  = rows(1);
    const histRows   = rows(2);
    const courseRows = rows(3);
    const fbRows     = rows(4);
    const themeRows  = rows(5);

    res.json({
      hero:     heroRows[0] || {},
      stats:    statsRows,
      history:  histRows.map(parseHistory),
      courses:  courseRows.map(parseCourse),
      feedback: fbRows,
      themes:   themeRows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────

router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM tch_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE tch_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO tch_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM tch_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STATS ─────────────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_stats ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/stats', verifyToken, async (req, res) => {
  const { num, label, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO tch_stats (num,label,sort_order) VALUES (?,?,?)',
      [num, label, sort_order || 0]);
    const [rows] = await db.query('SELECT * FROM tch_stats WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/stats/:id', verifyToken, async (req, res) => {
  const { num, label, sort_order } = req.body;
  try {
    await db.query('UPDATE tch_stats SET num=?,label=?,sort_order=? WHERE id=?',
      [num, label, sort_order, req.params.id]);
    const [rows] = await db.query('SELECT * FROM tch_stats WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/stats/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tch_stats WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TEACHING HISTORY ──────────────────────────────────────────────────────────

router.get('/history', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_history ORDER BY sort_order');
    res.json(rows.map(parseHistory));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/history', verifyToken, async (req, res) => {
  const { role, period, location, org, featured, variant, plain, stats, bullets, tags, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO tch_history
       (role,period,location,org,featured,variant,plain,stats_json,bullets_json,tags_json,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [role, period, location || '', org, featured ? 1 : 0, variant || '', plain || '',
       JSON.stringify(stats || []), JSON.stringify(bullets || []), JSON.stringify(tags || []),
       sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM tch_history WHERE id=?', [r.insertId]);
    res.status(201).json(parseHistory(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/history/:id', verifyToken, async (req, res) => {
  const { role, period, location, org, featured, variant, plain, stats, bullets, tags, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE tch_history SET role=?,period=?,location=?,org=?,featured=?,variant=?,plain=?,
       stats_json=?,bullets_json=?,tags_json=?,sort_order=? WHERE id=?`,
      [role, period, location || '', org, featured ? 1 : 0, variant || '', plain || '',
       JSON.stringify(stats || []), JSON.stringify(bullets || []), JSON.stringify(tags || []),
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM tch_history WHERE id=?', [req.params.id]);
    res.json(parseHistory(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/history/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tch_history WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COURSE REPORTS ────────────────────────────────────────────────────────────

router.get('/courses', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_courses ORDER BY sort_order');
    res.json(rows.map(parseCourse));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/courses', verifyToken, async (req, res) => {
  const { tag, title, subtitle, date_text, location_text, rating, rating_label,
          pull_quote, pq_attr, specs, paragraphs, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO tch_courses
       (tag,title,subtitle,date_text,location_text,rating,rating_label,pull_quote,pq_attr,specs_json,paragraphs_json,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tag, title, subtitle || '', date_text, location_text || '', rating, rating_label || '',
       pull_quote || '', pq_attr || '',
       JSON.stringify(specs || []), JSON.stringify(paragraphs || []), sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM tch_courses WHERE id=?', [r.insertId]);
    res.status(201).json(parseCourse(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/courses/:id', verifyToken, async (req, res) => {
  const { tag, title, subtitle, date_text, location_text, rating, rating_label,
          pull_quote, pq_attr, specs, paragraphs, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE tch_courses SET tag=?,title=?,subtitle=?,date_text=?,location_text=?,rating=?,rating_label=?,
       pull_quote=?,pq_attr=?,specs_json=?,paragraphs_json=?,sort_order=? WHERE id=?`,
      [tag, title, subtitle || '', date_text, location_text || '', rating, rating_label || '',
       pull_quote || '', pq_attr || '',
       JSON.stringify(specs || []), JSON.stringify(paragraphs || []),
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM tch_courses WHERE id=?', [req.params.id]);
    res.json(parseCourse(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/courses/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tch_courses WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STUDENT FEEDBACK ──────────────────────────────────────────────────────────

router.get('/feedback', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_feedback ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/feedback', verifyToken, async (req, res) => {
  const { stars, text, name, institution, av_class, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO tch_feedback (stars,text,name,institution,av_class,sort_order) VALUES (?,?,?,?,?,?)',
      [stars || 5, text, name, institution || '', av_class || 'av-a', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM tch_feedback WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/feedback/:id', verifyToken, async (req, res) => {
  const { stars, text, name, institution, av_class, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE tch_feedback SET stars=?,text=?,name=?,institution=?,av_class=?,sort_order=? WHERE id=?',
      [stars || 5, text, name, institution || '', av_class || 'av-a', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM tch_feedback WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/feedback/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tch_feedback WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CORE THEMES ───────────────────────────────────────────────────────────────

router.get('/themes', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tch_themes ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/themes', verifyToken, async (req, res) => {
  const { glyph, title, description, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO tch_themes (glyph,title,description,sort_order) VALUES (?,?,?,?)',
      [glyph || '', title, description || '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM tch_themes WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/themes/:id', verifyToken, async (req, res) => {
  const { glyph, title, description, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE tch_themes SET glyph=?,title=?,description=?,sort_order=? WHERE id=?',
      [glyph || '', title, description || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM tch_themes WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/themes/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tch_themes WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
