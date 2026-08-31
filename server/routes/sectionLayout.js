const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

const VALID_SLUGS = new Set(['home','biography','teaching','videos','events','workshops','connect','gallery','services','methodology']);

// ── GET /:slug — return ordered layout ───────────────────────────────────────
router.get('/:slug', async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  try {
    const [rows] = await db.query(
      'SELECT section_key, sort_order, enabled FROM page_section_layout WHERE page_slug=? ORDER BY sort_order',
      [req.params.slug]
    );
    res.json(rows.map(r => ({ section_key: r.section_key, sort_order: r.sort_order, enabled: !!r.enabled })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:slug — upsert full layout ──────────────────────────────────────────
router.put('/:slug', verifyToken, async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  const { items } = req.body; // [{ section_key, sort_order, enabled }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
  const slug = req.params.slug;
  try {
    // Upsert all items
    if (items.length > 0) {
      await Promise.all(items.map(({ section_key, sort_order, enabled }) =>
        db.query(
          `INSERT INTO page_section_layout (page_slug, section_key, sort_order, enabled)
           VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order), enabled=VALUES(enabled)`,
          [slug, section_key, sort_order, enabled ? 1 : 0]
        )
      ));
    }
    // Delete any keys no longer in the list
    const keys = items.map(i => i.section_key);
    if (keys.length > 0) {
      const placeholders = keys.map(() => '?').join(',');
      await db.query(
        `DELETE FROM page_section_layout WHERE page_slug=? AND section_key NOT IN (${placeholders})`,
        [slug, ...keys]
      );
    } else {
      await db.query('DELETE FROM page_section_layout WHERE page_slug=?', [slug]);
    }
    const [rows] = await db.query(
      'SELECT section_key, sort_order, enabled FROM page_section_layout WHERE page_slug=? ORDER BY sort_order',
      [slug]
    );
    res.json(rows.map(r => ({ section_key: r.section_key, sort_order: r.sort_order, enabled: !!r.enabled })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /:slug — reset to default (clear all layout rows) ─────────────────
router.delete('/:slug', verifyToken, async (req, res) => {
  if (!VALID_SLUGS.has(req.params.slug)) return res.status(400).json({ error: 'Unknown page slug' });
  try {
    await db.query('DELETE FROM page_section_layout WHERE page_slug=?', [req.params.slug]);
    res.json({ reset: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
