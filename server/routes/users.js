const express  = require('express');
const bcrypt   = require('bcryptjs');
const db       = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// All user-management routes require authentication + super_admin role
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

const MODULES = [
  'home', 'biography', 'teaching', 'videos', 'events',
  'workshops', 'testimonials', 'connect', 'gallery',
  'navigation', 'site-blocks', 'seo', 'custom-pages', 'users',
];

// Default permission sets by role
function defaultPerms(role) {
  if (role === 'super_admin') {
    return MODULES.map(m => ({ module: m, can_view: 1, can_create: 1, can_edit: 1, can_delete: 1 }));
  }
  if (role === 'editor') {
    return MODULES.map(m => ({ module: m, can_view: 1, can_create: 1, can_edit: 1, can_delete: 0 }));
  }
  if (role === 'viewer') {
    return MODULES.map(m => ({ module: m, can_view: 1, can_create: 0, can_edit: 0, can_delete: 0 }));
  }
  // custom — start with view-only
  return MODULES.map(m => ({ module: m, can_view: 1, can_create: 0, can_edit: 0, can_delete: 0 }));
}

async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_users (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username     VARCHAR(50)  NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100) DEFAULT '',
      email        VARCHAR(150) DEFAULT '',
      role         ENUM('super_admin','editor','viewer','custom') NOT NULL DEFAULT 'editor',
      is_active    TINYINT(1)   NOT NULL DEFAULT 1,
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_permissions (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      module      VARCHAR(60)  NOT NULL,
      can_view    TINYINT(1)   NOT NULL DEFAULT 0,
      can_create  TINYINT(1)   NOT NULL DEFAULT 0,
      can_edit    TINYINT(1)   NOT NULL DEFAULT 0,
      can_delete  TINYINT(1)   NOT NULL DEFAULT 0,
      UNIQUE KEY uq_user_module (user_id, module),
      FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
    )
  `);

  // Seed the env admin into cms_users so it appears in User Management.
  // INSERT IGNORE means this is a no-op if the username already exists.
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (adminUser && adminPass) {
    const [[existing]] = await db.execute(
      'SELECT id FROM cms_users WHERE username=?', [adminUser]
    );
    if (!existing) {
      const hash = await bcrypt.hash(adminPass, 12);
      const [result] = await db.execute(
        `INSERT INTO cms_users (username, password_hash, display_name, role)
         VALUES (?, ?, 'Super Admin', 'super_admin')`,
        [adminUser, hash]
      );
      // Seed full permissions for this super_admin
      const perms = defaultPerms('super_admin');
      for (const p of perms) {
        await db.execute(
          `INSERT IGNORE INTO cms_permissions
             (user_id, module, can_view, can_create, can_edit, can_delete)
           VALUES (?,?,?,?,?,?)`,
          [result.insertId, p.module, p.can_view, p.can_create, p.can_edit, p.can_delete]
        );
      }
      console.log(`[cms] Seeded env admin "${adminUser}" into cms_users`);
    }
  }
}

ensureTables().catch(e => console.error('cms_users table init failed:', e.message));

// ── List all users ─────────────────────────────────────────────────────────────
router.get('/', verifyToken, requireSuperAdmin, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, display_name, email, role, is_active, created_at FROM cms_users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Create user ────────────────────────────────────────────────────────────────
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  const { username, password, display_name = '', email = '', role = 'editor' } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO cms_users (username, password_hash, display_name, email, role) VALUES (?,?,?,?,?)',
      [username.trim(), hash, display_name.trim(), email.trim(), role]
    );
    const userId = result.insertId;

    // Seed default permissions
    const perms = defaultPerms(role);
    for (const p of perms) {
      await db.execute(
        `INSERT INTO cms_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
         VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
         can_view=VALUES(can_view), can_create=VALUES(can_create),
         can_edit=VALUES(can_edit), can_delete=VALUES(can_delete)`,
        [userId, p.module, p.can_view, p.can_create, p.can_edit, p.can_delete]
      );
    }

    res.status(201).json({ id: userId, username: username.trim(), role });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── Get single user with permissions ──────────────────────────────────────────
router.get('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [[user]] = await db.execute(
      'SELECT id, username, display_name, email, role, is_active, created_at FROM cms_users WHERE id=?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [perms] = await db.execute(
      'SELECT module, can_view, can_create, can_edit, can_delete FROM cms_permissions WHERE user_id=?',
      [user.id]
    );
    res.json({ ...user, permissions: perms });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Update user ────────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  const { display_name, email, role, is_active } = req.body;
  try {
    const [[existing]] = await db.execute('SELECT id, role FROM cms_users WHERE id=?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    // Prevent demoting the last super_admin
    if (existing.role === 'super_admin' && role && role !== 'super_admin') {
      const [[{ cnt }]] = await db.execute(
        "SELECT COUNT(*) AS cnt FROM cms_users WHERE role='super_admin' AND is_active=1"
      );
      if (cnt <= 1) return res.status(409).json({ error: 'Cannot demote the last active super admin' });
    }

    const fields = [];
    const vals   = [];
    if (display_name !== undefined) { fields.push('display_name=?'); vals.push(display_name); }
    if (email        !== undefined) { fields.push('email=?');        vals.push(email); }
    if (role         !== undefined) { fields.push('role=?');         vals.push(role); }
    if (is_active    !== undefined) { fields.push('is_active=?');    vals.push(is_active ? 1 : 0); }

    if (fields.length) {
      vals.push(req.params.id);
      await db.execute(`UPDATE cms_users SET ${fields.join(',')} WHERE id=?`, vals);
    }

    // If role changed, reseed default permissions
    if (role && role !== existing.role) {
      const perms = defaultPerms(role);
      for (const p of perms) {
        await db.execute(
          `INSERT INTO cms_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
           VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
           can_view=VALUES(can_view), can_create=VALUES(can_create),
           can_edit=VALUES(can_edit), can_delete=VALUES(can_delete)`,
          [req.params.id, p.module, p.can_view, p.can_create, p.can_edit, p.can_delete]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Change password ────────────────────────────────────────────────────────────
router.put('/:id/password', verifyToken, requireSuperAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    await db.execute('UPDATE cms_users SET password_hash=? WHERE id=?', [hash, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Delete user ────────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [[user]] = await db.execute('SELECT id, role FROM cms_users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting self (compare by username as fallback for old id=0 tokens)
    const isSelf = (req.user.id && String(req.user.id) === String(req.params.id))
      || (req.user.username && req.user.username === user.username);
    if (isSelf) {
      return res.status(409).json({ error: 'You cannot delete your own account' });
    }

    // Prevent deleting last super_admin
    if (user.role === 'super_admin') {
      const [[{ cnt }]] = await db.execute(
        "SELECT COUNT(*) AS cnt FROM cms_users WHERE role='super_admin'"
      );
      if (cnt <= 1) return res.status(409).json({ error: 'Cannot delete the last super admin' });
    }

    await db.execute('DELETE FROM cms_users WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get permissions ────────────────────────────────────────────────────────────
router.get('/:id/permissions', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT module, can_view, can_create, can_edit, can_delete FROM cms_permissions WHERE user_id=? ORDER BY module',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Replace all permissions for a user ────────────────────────────────────────
router.put('/:id/permissions', verifyToken, requireSuperAdmin, async (req, res) => {
  const { permissions } = req.body; // array of { module, can_view, can_create, can_edit, can_delete }
  if (!Array.isArray(permissions)) return res.status(400).json({ error: 'permissions must be an array' });

  try {
    // Delete existing, then insert new
    await db.execute('DELETE FROM cms_permissions WHERE user_id=?', [req.params.id]);
    for (const p of permissions) {
      if (!MODULES.includes(p.module)) continue;
      await db.execute(
        'INSERT INTO cms_permissions (user_id, module, can_view, can_create, can_edit, can_delete) VALUES (?,?,?,?,?,?)',
        [req.params.id, p.module, p.can_view ? 1 : 0, p.can_create ? 1 : 0, p.can_edit ? 1 : 0, p.can_delete ? 1 : 0]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
