const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Multer setup for image uploads ──────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'biography');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── HERO ─────────────────────────────────────────────────────────────────────

router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bio_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM bio_hero LIMIT 1');
    if (existing.length) {
      await db.query(
        'UPDATE bio_hero SET eyebrow=?, title=?, title_em=?, subtitle=?, breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO bio_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM bio_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PROFILE ──────────────────────────────────────────────────────────────────

router.get('/profile', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bio_profile LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  const { name, tagline, quote, para1, para2, linkedin_url, twitter_handle, twitter_url } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM bio_profile LIMIT 1');
    if (existing.length) {
      await db.query(
        `UPDATE bio_profile SET name=?, tagline=?, quote=?, para1=?, para2=?,
         linkedin_url=?, twitter_handle=?, twitter_url=? WHERE id=?`,
        [name, tagline, quote, para1, para2, linkedin_url, twitter_handle, twitter_url, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO bio_profile (name, tagline, quote, para1, para2, linkedin_url, twitter_handle, twitter_url)
         VALUES (?,?,?,?,?,?,?,?)`,
        [name, tagline, quote, para1, para2, linkedin_url, twitter_handle, twitter_url]
      );
    }
    const [rows] = await db.query('SELECT * FROM bio_profile LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile/photo', verifyToken, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const photoUrl = `/uploads/biography/${req.file.filename}`;
  try {
    const [existing] = await db.query('SELECT id FROM bio_profile LIMIT 1');
    if (existing.length) {
      await db.query('UPDATE bio_profile SET photo_url=? WHERE id=?', [photoUrl, existing[0].id]);
    }
    res.json({ photo_url: photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENGAGE (intro + cards + venues) ──────────────────────────────────────────

router.get('/engage', async (_req, res) => {
  try {
    const [intro] = await db.query('SELECT * FROM bio_engage_intro LIMIT 1');
    const [cards] = await db.query('SELECT * FROM bio_engage_cards ORDER BY sort_order');
    const [venues] = await db.query('SELECT * FROM bio_engage_venues ORDER BY sort_order');

    const cardsWithVenues = cards.map(card => ({
      ...card,
      venues: venues
        .filter(v => v.card_id === card.id)
        .map(v => ({ id: v.id, venue_text: v.venue_text, venue_url: v.venue_url || '', venue_new_tab: !!v.venue_new_tab, sort_order: v.sort_order })),
    }));

    res.json({ intro: intro[0] || {}, cards: cardsWithVenues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/engage/intro', verifyToken, async (req, res) => {
  const { section_label, title, title_em, description } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM bio_engage_intro LIMIT 1');
    if (existing.length) {
      await db.query(
        'UPDATE bio_engage_intro SET section_label=?, title=?, title_em=?, description=? WHERE id=?',
        [section_label, title, title_em, description, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO bio_engage_intro (section_label, title, title_em, description) VALUES (?,?,?,?)',
        [section_label, title, title_em, description]
      );
    }
    const [rows] = await db.query('SELECT * FROM bio_engage_intro LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cards CRUD
router.post('/engage/cards', verifyToken, async (req, res) => {
  const { sort_order, num_label, category, title, slug, content_label, count_number, count_label } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO bio_engage_cards (sort_order, num_label, category, title, slug, content_label, count_number, count_label)
       VALUES (?,?,?,?,?,?,?,?)`,
      [sort_order || 0, num_label, category, title, slug, content_label, count_number, count_label]
    );
    const [rows] = await db.query('SELECT * FROM bio_engage_cards WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/engage/cards/:id', verifyToken, async (req, res) => {
  const { sort_order, num_label, category, title, slug, content_label, count_number, count_label } = req.body;
  try {
    await db.query(
      `UPDATE bio_engage_cards SET sort_order=?, num_label=?, category=?, title=?, slug=?,
       content_label=?, count_number=?, count_label=? WHERE id=?`,
      [sort_order, num_label, category, title, slug, content_label, count_number, count_label, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM bio_engage_cards WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/engage/cards/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM bio_engage_cards WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Venues CRUD
router.post('/engage/cards/:cardId/venues', verifyToken, async (req, res) => {
  const { venue_text, venue_url, venue_new_tab, sort_order } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO bio_engage_venues (card_id, venue_text, venue_url, venue_new_tab, sort_order) VALUES (?,?,?,?,?)',
      [req.params.cardId, venue_text, venue_url || '', venue_new_tab ? 1 : 0, sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM bio_engage_venues WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/engage/venues/:id', verifyToken, async (req, res) => {
  const { venue_text, venue_url, venue_new_tab, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE bio_engage_venues SET venue_text=?, venue_url=?, venue_new_tab=?, sort_order=? WHERE id=?',
      [venue_text, venue_url || '', venue_new_tab ? 1 : 0, sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM bio_engage_venues WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/engage/venues/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM bio_engage_venues WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── VENTURES ─────────────────────────────────────────────────────────────────

router.get('/ventures', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bio_ventures ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ventures', verifyToken, async (req, res) => {
  const { sort_order, designation, name, type, description, link_url, link_label } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO bio_ventures (sort_order, designation, name, type, description, link_url, link_label)
       VALUES (?,?,?,?,?,?,?)`,
      [sort_order || 0, designation, name, type, description, link_url, link_label]
    );
    const [rows] = await db.query('SELECT * FROM bio_ventures WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/ventures/:id', verifyToken, async (req, res) => {
  const { sort_order, designation, name, type, description, link_url, link_label } = req.body;
  try {
    await db.query(
      `UPDATE bio_ventures SET sort_order=?, designation=?, name=?, type=?,
       description=?, link_url=?, link_label=? WHERE id=?`,
      [sort_order, designation, name, type, description, link_url, link_label, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM bio_ventures WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/ventures/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM bio_ventures WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ventures/:id/logo', verifyToken, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/biography/${req.file.filename}`;
  try {
    await db.query('UPDATE bio_ventures SET logo_url=? WHERE id=?', [logoUrl, req.params.id]);
    res.json({ logo_url: logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
