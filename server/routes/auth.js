const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const db      = require('../db');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!JWT_SECRET || !ADMIN_USER || !ADMIN_PASS) {
  throw new Error('Missing required auth env vars: JWT_SECRET, ADMIN_USER, ADMIN_PASS');
}

const TOKEN_TTL        = '24h';
const RESET_TTL_MS     = 60 * 60 * 1000; // 1 hour

// ── Auto-create password resets table ─────────────────────────────────────────
;(async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cms_password_resets (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id    INT UNSIGNED NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME     NOT NULL,
        used_at    DATETIME     DEFAULT NULL,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pwr_token (token_hash)
      )
    `);
  } catch (_) { /* DB not ready yet — harmless */ }
})();

// ── Email transporter: DB booking settings → .env SMTP fallback ───────────────
async function getMailTransporter() {
  const nodemailer = require('nodemailer');

  // Try booking_email_settings table first
  try {
    const [rows] = await db.query('SELECT * FROM booking_email_settings WHERE id=1 LIMIT 1');
    const es = rows[0];
    if (es && es.smtp_host && es.smtp_user && es.smtp_pass) {
      return {
        transporter: nodemailer.createTransport({
          host:   es.smtp_host,
          port:   es.smtp_port  || 587,
          secure: (es.smtp_port || 587) === 465,
          auth:   { user: es.smtp_user, pass: es.smtp_pass },
        }),
        from: `"${es.smtp_from_name || 'Alchmi Admin'}" <${es.smtp_from || es.smtp_user}>`,
      };
    }
  } catch (_) {}

  // Fall back to .env SMTP vars
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      }),
      from: `"${process.env.SMTP_FROM_NAME || 'Alchmi Admin'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    };
  }

  return null; // No transport configured
}

function buildResetEmailHtml({ displayName, resetLink }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e0d8cc;border-radius:12px;overflow:hidden;">
    <div style="background:#1a1208;padding:28px 36px;">
      <span style="color:#d4670a;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Alchmi CMS</span>
      <h1 style="color:#fff;font-size:20px;font-weight:400;margin:8px 0 0;">Admin Password Reset</h1>
    </div>
    <div style="padding:32px 36px;">
      <p style="color:#1a1208;font-size:15px;line-height:1.6;margin:0 0 16px;">Hello ${displayName},</p>
      <p style="color:#4a3e2a;font-size:14px;line-height:1.7;margin:0 0 28px;">
        We received a request to reset the password for your admin account.
        Click the button below to set a new password.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetLink}"
           style="background:#012e5e;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;
                  font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;
                  text-transform:uppercase;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#9a8e78;font-size:13px;line-height:1.6;margin:20px 0 0;">
        This link expires in <strong>1 hour</strong>. If you did not request a password reset,
        ignore this email — your password will not be changed.
      </p>
      <hr style="border:none;border-top:1px solid #e0d8cc;margin:20px 0;">
      <p style="color:#b8a898;font-size:11px;margin:0;word-break:break-all;">
        Or copy this URL:<br>
        <a href="${resetLink}" style="color:#d4670a;">${resetLink}</a>
      </p>
    </div>
  </div>
</body></html>`;
}

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

// ── Forgot password ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email address is required' });

  // Always return the same generic message — never reveal whether the email exists
  const genericOk = {
    message: 'If this email is associated with an admin account, a password reset link has been sent.',
  };

  try {
    let user = null;
    try {
      const [rows] = await db.execute(
        'SELECT id, username, email, display_name FROM cms_users WHERE email=? AND is_active=1 LIMIT 1',
        [email]
      );
      user = rows[0] || null;
    } catch (_) {}

    if (!user) return res.json(genericOk);

    // Invalidate any existing unused tokens for this user
    await db.execute(
      'UPDATE cms_password_resets SET used_at=NOW() WHERE user_id=? AND used_at IS NULL',
      [user.id]
    );

    // Create a new token
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);

    await db.execute(
      'INSERT INTO cms_password_resets (user_id, token_hash, expires_at) VALUES (?,?,?)',
      [user.id, tokenHash, expiresAt]
    );

    const base      = process.env.CLIENT_URL || process.env.SITE_URL || 'http://localhost:5173';
    const resetLink = `${base}/admin/reset-password?token=${rawToken}`;

    const mail = await getMailTransporter();
    if (mail) {
      try {
        await mail.transporter.sendMail({
          from:    mail.from,
          to:      user.email,
          subject: 'Admin Password Reset — Alchmi CMS',
          html:    buildResetEmailHtml({ displayName: user.display_name || user.username, resetLink }),
        });
      } catch (emailErr) {
        console.error('Password reset email error:', emailErr.message);
      }
    } else {
      console.warn('[auth] No email transport configured. Reset link (dev only):', resetLink);
    }

    return res.json(genericOk);
  } catch (e) {
    console.error('Forgot password error:', e.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Validate reset token ───────────────────────────────────────────────────────
router.get('/reset-password/validate', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, error: 'Token is required' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.expires_at, r.used_at, u.username
         FROM cms_password_resets r
         JOIN cms_users u ON u.id = r.user_id
        WHERE r.token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length)            return res.json({ valid: false, error: 'Invalid or expired reset link.' });
    if (rows[0].used_at)         return res.json({ valid: false, error: 'This reset link has already been used.' });
    if (new Date(rows[0].expires_at) < new Date())
                                 return res.json({ valid: false, error: 'This reset link has expired. Please request a new one.' });

    return res.json({ valid: true, username: rows[0].username });
  } catch (e) {
    console.error('Reset validate error:', e.message);
    res.status(500).json({ valid: false, error: 'Server error. Please try again.' });
  }
});

// ── Reset password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.user_id, r.expires_at, r.used_at
         FROM cms_password_resets r
         JOIN cms_users u ON u.id = r.user_id
        WHERE r.token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length)            return res.status(400).json({ error: 'Invalid or expired reset link.' });
    if (rows[0].used_at)         return res.status(400).json({ error: 'This reset link has already been used.' });
    if (new Date(rows[0].expires_at) < new Date())
                                 return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });

    const passwordHash = await bcrypt.hash(password, 12);

    await db.execute('UPDATE cms_users SET password_hash=? WHERE id=?', [passwordHash, rows[0].user_id]);
    await db.execute('UPDATE cms_password_resets SET used_at=NOW() WHERE id=?', [rows[0].id]);

    return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (e) {
    console.error('Reset password error:', e.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
