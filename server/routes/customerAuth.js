const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../db');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const router = express.Router();

// ── Startup: ensure customers table and all columns exist ─────────────────────
(async () => {
  try {
    // Create table (without hero_banner for backward compat — added below)
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        email           VARCHAR(255) NOT NULL UNIQUE,
        phone           VARCHAR(50)  UNIQUE,
        password_hash   VARCHAR(255) NOT NULL,
        full_name       VARCHAR(255) NOT NULL,
        profile_photo   VARCHAR(500),
        company_name    VARCHAR(255),
        gst_number      VARCHAR(50),
        organization_type VARCHAR(100),
        office_number   VARCHAR(50),
        address         TEXT,
        num_employees   INT,
        is_active       TINYINT(1) NOT NULL DEFAULT 1,
        created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (err) {
    console.error('[customers-init] CREATE TABLE failed:', err.message);
  }

  // Add hero_banner safely — "IF NOT EXISTS" is MySQL 8+ / MariaDB 10.0.2+ only.
  // Use information_schema so this works on MySQL 5.7 as well.
  try {
    const [cols] = await db.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'customers'
         AND COLUMN_NAME  = 'hero_banner'
       LIMIT 1`
    );
    if (!cols.length) {
      await db.query(`ALTER TABLE customers ADD COLUMN hero_banner VARCHAR(500)`);
      console.log('[customers-init] hero_banner column added');
    }
  } catch (err) {
    console.error('[customers-init] hero_banner migration failed:', err.message);
  }
})();

// ── Photo / banner upload setup ───────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'customers');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error('[customers-upload] could not create upload dir:', uploadDir, err.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `cust_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'alchmi_customer_secret_change_me';

function makeToken(customer) {
  return jwt.sign({ id: customer.id, email: customer.email, type: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyCustomerToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.type !== 'customer') return res.status(401).json({ error: 'Unauthorized' });
    req.customerId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function safeCustomer(c) {
  const { password_hash, ...rest } = c;
  return rest;
}

// ── POST /api/customer-auth/login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ error: 'Login ID and password are required' });

    const id = login_id.trim();
    const [rows] = await db.query(
      'SELECT * FROM customers WHERE (email=? OR phone=?) LIMIT 1',
      [id, id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const customer = rows[0];

    if (!customer.is_active) return res.status(403).json({ error: 'Account is deactivated. Please contact support.' });

    const ok = await bcrypt.compare(password, customer.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = makeToken(customer);
    res.json({ token, customer: safeCustomer(customer) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/customer-auth/verify ─────────────────────────────────────────────
router.get('/verify', verifyCustomerToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id=? LIMIT 1', [req.customerId]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    const customer = rows[0];
    if (!customer.is_active) return res.status(403).json({ error: 'Account deactivated' });
    res.json({ customer: safeCustomer(customer) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/customer-auth/profile ────────────────────────────────────────────
router.get('/profile', verifyCustomerToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id=? LIMIT 1', [req.customerId]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ customer: safeCustomer(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/customer-auth/profile ────────────────────────────────────────────
router.put('/profile', verifyCustomerToken, async (req, res) => {
  try {
    const { full_name, phone, company_name, gst_number, organization_type,
            office_number, address, num_employees } = req.body;

    if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required' });

    // Check phone uniqueness if provided
    if (phone) {
      const [dup] = await db.query('SELECT id FROM customers WHERE phone=? AND id!=?', [phone, req.customerId]);
      if (dup.length) return res.status(400).json({ error: 'Phone number already registered' });
    }

    await db.query(
      `UPDATE customers SET full_name=?, phone=?, company_name=?, gst_number=?,
       organization_type=?, office_number=?, address=?, num_employees=? WHERE id=?`,
      [full_name.trim(), phone || null, company_name || null, gst_number || null,
       organization_type || null, office_number || null, address || null,
       num_employees || null, req.customerId]
    );

    const [rows] = await db.query('SELECT * FROM customers WHERE id=?', [req.customerId]);
    res.json({ customer: safeCustomer(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Multer error wrapper — converts multer throws to JSON 400 responses ───────
function withUpload(multerMiddleware, handler) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large (max 5 MB)'
          : (err.message || 'Upload error');
        return res.status(400).json({ error: msg });
      }
      handler(req, res, next);
    });
  };
}

// ── POST /api/customer-auth/photo ─────────────────────────────────────────────
router.post('/photo', verifyCustomerToken, withUpload(upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const url = `/uploads/customers/${req.file.filename}`;
    await db.query('UPDATE customers SET profile_photo=? WHERE id=?', [url, req.customerId]);
    res.json({ photo_url: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

// ── POST /api/customer-auth/banner ────────────────────────────────────────────
router.post('/banner', verifyCustomerToken, withUpload(upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // Ensure the upload directory exists (guards against dir being missing at runtime)
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    } catch (mkdirErr) {
      console.error('[banner-upload] mkdir failed:', mkdirErr.message);
      return res.status(500).json({ error: 'Upload directory unavailable' });
    }

    const url = `/uploads/customers/${req.file.filename}`;
    await db.query('UPDATE customers SET hero_banner=? WHERE id=?', [url, req.customerId]);
    res.json({ banner_url: url });
  } catch (err) {
    console.error('[banner-upload] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// ── PUT /api/customer-auth/change-password ────────────────────────────────────
router.put('/change-password', verifyCustomerToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const [rows] = await db.query('SELECT password_hash FROM customers WHERE id=?', [req.customerId]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE customers SET password_hash=? WHERE id=?', [hash, req.customerId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/customer-auth/bookings ───────────────────────────────────────────
router.get('/bookings', verifyCustomerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id,booking_ref,duration_label,booking_date,booking_time,price,currency,
              status,payment_status,payment_id,session_requirements,created_at
       FROM bookings WHERE customer_email=(SELECT email FROM customers WHERE id=?)
       ORDER BY created_at DESC`,
      [req.customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, verifyCustomerToken };
