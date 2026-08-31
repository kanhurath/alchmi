const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');
const router  = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTree(rows) {
  const top      = rows.filter(r => !r.parent_id);
  const childMap = {};
  rows.filter(r => r.parent_id).forEach(r => {
    (childMap[r.parent_id] = childMap[r.parent_id] || []).push(r);
  });
  return top.map(item => ({
    ...item,
    children: (childMap[item.id] || []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

// ── GET /api/navigation — full header + footer tree ───────────────────────────
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM nav_items ORDER BY sort_order');
    res.json({
      header: buildTree(rows.filter(r => r.menu === 'header')),
      footer: buildTree(rows.filter(r => r.menu === 'footer')),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/navigation — create item ───────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { menu, label, url, is_external, parent_id, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO nav_items (menu, label, url, is_external, parent_id, sort_order) VALUES (?,?,?,?,?,?)',
      [menu || 'header', label || '', url || '', is_external ? 1 : 0, parent_id || null, sort_order || 0]
    );
    const [[row]] = await db.query('SELECT * FROM nav_items WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/navigation/reorder — bulk sort_order update ─────────────────────
router.put('/reorder', verifyToken, async (req, res) => {
  const { items } = req.body; // [{ id, sort_order }, ...]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  try {
    await Promise.all(items.map(({ id, sort_order }) =>
      db.query('UPDATE nav_items SET sort_order=? WHERE id=?', [sort_order, id])
    ));
    res.json({ updated: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/navigation/:id — update item ────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const { label, url, is_external, parent_id, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE nav_items SET label=?, url=?, is_external=?, parent_id=?, sort_order=? WHERE id=?',
      [label || '', url || '', is_external ? 1 : 0, parent_id || null, sort_order ?? 0, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM nav_items WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/navigation/:id ────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM nav_items WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
