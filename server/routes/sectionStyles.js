const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

async function addColumnIfMissing(column, definition) {
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'section_styles' AND COLUMN_NAME = ?`,
    [column]
  );
  if (!rows.length) {
    await db.execute(`ALTER TABLE section_styles ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS section_styles (
      section_key        VARCHAR(120) NOT NULL PRIMARY KEY,
      bg_color           VARCHAR(50)  NOT NULL DEFAULT '',
      height_px          VARCHAR(10)  NOT NULL DEFAULT '',
      font_color         VARCHAR(50)  NOT NULL DEFAULT '',
      font_size_px       VARCHAR(10)  NOT NULL DEFAULT '',
      title_font_color   VARCHAR(50)  NOT NULL DEFAULT '',
      title_font_size_px VARCHAR(10)  NOT NULL DEFAULT ''
    )
  `);
  // Migrate existing tables that pre-date these columns
  await addColumnIfMissing('title_font_color',   "VARCHAR(50)  NOT NULL DEFAULT ''");
  await addColumnIfMissing('title_font_size_px', "VARCHAR(10)  NOT NULL DEFAULT ''");
}
ensureTable().catch(e => console.error('[section-styles] table init:', e.message));

// GET all — returns { [section_key]: { bg_color, height_px, font_color, font_size_px, title_font_color, title_font_size_px } }
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM section_styles');
    const result = {};
    rows.forEach(r => { result[r.section_key] = r; });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /:key
router.get('/:key', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      'SELECT * FROM section_styles WHERE section_key=?', [req.params.key]
    );
    res.json(row || { section_key: req.params.key, bg_color: '', height_px: '', font_color: '', font_size_px: '', title_font_color: '', title_font_size_px: '' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /:key — upsert
router.put('/:key', verifyToken, async (req, res) => {
  const key = req.params.key;
  const { bg_color = '', height_px = '', font_color = '', font_size_px = '', title_font_color = '', title_font_size_px = '' } = req.body;
  try {
    const [[existing]] = await db.execute(
      'SELECT section_key FROM section_styles WHERE section_key=?', [key]
    );
    if (existing) {
      await db.execute(
        'UPDATE section_styles SET bg_color=?, height_px=?, font_color=?, font_size_px=?, title_font_color=?, title_font_size_px=? WHERE section_key=?',
        [bg_color, height_px, font_color, font_size_px, title_font_color, title_font_size_px, key]
      );
    } else {
      await db.execute(
        'INSERT INTO section_styles (section_key, bg_color, height_px, font_color, font_size_px, title_font_color, title_font_size_px) VALUES (?,?,?,?,?,?,?)',
        [key, bg_color, height_px, font_color, font_size_px, title_font_color, title_font_size_px]
      );
    }
    const [[row]] = await db.execute('SELECT * FROM section_styles WHERE section_key=?', [key]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
