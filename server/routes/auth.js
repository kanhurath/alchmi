const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!JWT_SECRET || !ADMIN_USER || !ADMIN_PASS) {
  throw new Error('Missing required auth env vars: JWT_SECRET, ADMIN_USER, ADMIN_PASS');
}

const TOKEN_TTL = '24h';

// ── Login ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    // 1. Check cms_users table first
    let rows = [];
    try {
      [rows] = await db.execute(
        'SELECT id, username, password_hash, display_name, email, role, is_active FROM cms_users WHERE username=?',
        [username]
      );
    } catch (_) { /* table may not exist yet — fall through to env admin */ }

    if (rows.length > 0) {
      const u = rows[0];
      if (!u.is_active) return res.status(401).json({ error: 'Account is disabled' });

      const match = await bcrypt.compare(password, u.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid username or password' });

      const payload = { id: u.id, username: u.username, role: u.role };
      const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
      return res.json({
        token,
        user: { id: u.id, username: u.username, display_name: u.display_name, email: u.email, role: u.role },
      });
    }

    // 2. Fall back to env super-admin
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const payload = { id: 0, username: ADMIN_USER, role: 'super_admin' };
      const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
      return res.json({
        token,
        user: { id: 0, username: ADMIN_USER, display_name: 'Super Admin', email: '', role: 'super_admin' },
      });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── Verify token + return user + permissions ───────────────────────────────────
router.get('/verify', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const { id, username, role } = payload;

    // Load permissions for custom-role DB users
    let permissions = [];
    if (id && role === 'custom') {
      try {
        const [rows] = await db.execute(
          'SELECT module, can_view, can_create, can_edit, can_delete FROM cms_permissions WHERE user_id=?',
          [id]
        );
        permissions = rows;
      } catch (_) {}
    }

    res.json({ user: { id, username, role, permissions } });
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
});

module.exports = router;
