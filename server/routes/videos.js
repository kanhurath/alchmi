const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Multer — thumbnail uploads ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'videos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req,  file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback; }
  catch { return fallback; }
}

function parseVideo(row) {
  return { ...row, tags: safeJson(row.tags_json, []) };
}

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM vid_hero LIMIT 1'),
      db.query('SELECT * FROM vid_videos ORDER BY sort_order, id'),
      db.query('SELECT * FROM vid_sidebar LIMIT 1'),
    ]);

    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];

    const heroRows    = rows(0);
    const videoRows   = rows(1);
    const sidebarRows = rows(2);

    res.json({
      hero:    heroRows[0]    || {},
      videos:  videoRows.map(parseVideo),
      sidebar: sidebarRows[0] || {},
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vid_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM vid_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE vid_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO vid_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM vid_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── VIDEOS ────────────────────────────────────────────────────────────────────
router.get('/videos', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vid_videos ORDER BY sort_order, id');
    res.json(rows.map(parseVideo));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/videos', verifyToken, async (req, res) => {
  const { type, title, description, date_text, host, watch_label, thumb_url, video_url, tags, sort_order } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO vid_videos
       (type,title,description,date_text,host,watch_label,thumb_url,video_url,tags_json,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [type, title, description || '', date_text || '', host || '', watch_label || 'Watch',
       thumb_url || '', video_url || '', JSON.stringify(tags || []), sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM vid_videos WHERE id=?', [r.insertId]);
    res.status(201).json(parseVideo(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/videos/:id', verifyToken, async (req, res) => {
  const { type, title, description, date_text, host, watch_label, thumb_url, video_url, tags, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE vid_videos SET type=?,title=?,description=?,date_text=?,host=?,watch_label=?,
       thumb_url=?,video_url=?,tags_json=?,sort_order=? WHERE id=?`,
      [type, title, description || '', date_text || '', host || '', watch_label || 'Watch',
       thumb_url || '', video_url || '', JSON.stringify(tags || []),
       sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM vid_videos WHERE id=?', [req.params.id]);
    res.json(parseVideo(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/videos/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM vid_videos WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/videos/:id/thumb', verifyToken, upload.single('thumb'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const thumbUrl = `/uploads/videos/${req.file.filename}`;
  try {
    await db.query('UPDATE vid_videos SET thumb_url=? WHERE id=?', [thumbUrl, req.params.id]);
    res.json({ thumb_url: thumbUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
router.get('/sidebar', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vid_sidebar LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sidebar', verifyToken, async (req, res) => {
  const { quote_text, quote_attr, invite_title, invite_text, invite_btn_label } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM vid_sidebar LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE vid_sidebar SET quote_text=?,quote_attr=?,invite_title=?,invite_text=?,invite_btn_label=? WHERE id=?',
        [quote_text, quote_attr, invite_title, invite_text, invite_btn_label, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO vid_sidebar (quote_text,quote_attr,invite_title,invite_text,invite_btn_label) VALUES (?,?,?,?,?)',
        [quote_text, quote_attr, invite_title, invite_text, invite_btn_label]
      );
    }
    const [rows] = await db.query('SELECT * FROM vid_sidebar LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
