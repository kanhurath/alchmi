// Admin-only customer management
const express  = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const db       = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars[crypto.randomInt(chars.length)];
  }
  return pw;
}

async function sendCredentialsEmail(customer, plainPassword) {
  try {
    const [rows] = await db.query('SELECT * FROM booking_email_settings WHERE id=1 LIMIT 1');
    const es = rows[0];
    if (!es?.is_enabled || !es.smtp_host) return;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: es.smtp_host, port: es.smtp_port || 587,
      secure: (es.smtp_port || 587) === 465,
      auth: { user: es.smtp_user, pass: es.smtp_pass },
    });
    const fromLine = `"${es.smtp_from_name || 'Alchmi'}" <${es.smtp_from || es.smtp_user}>`;

    await transporter.sendMail({
      from: fromLine,
      to:   customer.email,
      subject: 'Your Alchmi Customer Account — Login Credentials',
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1208;">
          <h2 style="color:#b8922a;">Welcome to Alchmi, ${customer.full_name}!</h2>
          <p>Your Discovery Session booking has been received and a customer account has been created for you.</p>
          <p>You can now log in to your profile to view booking details, invoices, and manage your information.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;width:140px;">Login URL</td>
                <td style="padding:8px;border-bottom:1px solid #e8c96d;"><a href="${process.env.SITE_URL || 'https://www.alchmi.com'}" style="color:#b8922a;">${process.env.SITE_URL || 'https://www.alchmi.com'}</a></td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Email / Login ID</td>
                <td style="padding:8px;border-bottom:1px solid #e8c96d;">${customer.email}</td></tr>
            <tr><td style="padding:8px;color:#8a7d6b;">Password</td>
                <td style="padding:8px;font-family:monospace;font-size:1.1em;letter-spacing:0.05em;">${plainPassword}</td></tr>
          </table>
          <p style="color:#d4670a;font-size:0.9em;">For security, please change your password after your first login.</p>
          <p>If you have any questions, please reply to this email.</p>
        </div>`,
    });
  } catch (err) {
    console.error('[credentials-email]', err.message);
  }
}

// ── GET /api/customers — list all customers (admin) ───────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `SELECT id,email,phone,full_name,company_name,gst_number,organization_type,
                      office_number,address,num_employees,profile_photo,is_active,created_at
               FROM customers WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (status === 'active')   { sql += ' AND is_active=1'; }
    if (status === 'inactive') { sql += ' AND is_active=0'; }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/customers/:id — single customer (admin) ─────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id,email,phone,full_name,company_name,gst_number,organization_type,
              office_number,address,num_employees,profile_photo,is_active,created_at,updated_at
       FROM customers WHERE id=? LIMIT 1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const [bookings] = await db.query(
      `SELECT id,booking_ref,duration_label,booking_date,booking_time,price,currency,
              status,payment_status,payment_id,session_requirements,created_at
       FROM bookings WHERE customer_email=? ORDER BY created_at DESC`,
      [rows[0].email]
    );
    res.json({ customer: rows[0], bookings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/customers — create customer manually (admin) ────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { email, phone, full_name, company_name, gst_number, organization_type,
            office_number, address, num_employees, send_credentials } = req.body;

    if (!email || !full_name) return res.status(400).json({ error: 'Email and full name are required' });

    const [dup] = await db.query('SELECT id FROM customers WHERE email=?', [email]);
    if (dup.length) return res.status(400).json({ error: 'A customer with this email already exists' });

    const plain = generatePassword();
    const hash  = await bcrypt.hash(plain, 12);

    const [result] = await db.query(
      `INSERT INTO customers (email,phone,full_name,password_hash,company_name,gst_number,
       organization_type,office_number,address,num_employees)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [email, phone || null, full_name, hash, company_name || null, gst_number || null,
       organization_type || null, office_number || null, address || null, num_employees || null]
    );

    const [rows] = await db.query(
      'SELECT id,email,phone,full_name,company_name,is_active,created_at FROM customers WHERE id=?',
      [result.insertId]
    );

    if (send_credentials !== false) {
      await sendCredentialsEmail(rows[0], plain);
    }

    res.json({ customer: rows[0], plain_password: plain });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/customers/:id — update customer (admin) ─────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { full_name, phone, company_name, gst_number, organization_type,
            office_number, address, num_employees } = req.body;

    if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required' });

    if (phone) {
      const [dup] = await db.query('SELECT id FROM customers WHERE phone=? AND id!=?', [phone, req.params.id]);
      if (dup.length) return res.status(400).json({ error: 'Phone already registered' });
    }

    await db.query(
      `UPDATE customers SET full_name=?,phone=?,company_name=?,gst_number=?,
       organization_type=?,office_number=?,address=?,num_employees=? WHERE id=?`,
      [full_name.trim(), phone || null, company_name || null, gst_number || null,
       organization_type || null, office_number || null, address || null,
       num_employees || null, req.params.id]
    );

    const [rows] = await db.query(
      `SELECT id,email,phone,full_name,company_name,gst_number,organization_type,
              office_number,address,num_employees,profile_photo,is_active,created_at
       FROM customers WHERE id=?`, [req.params.id]
    );
    res.json({ customer: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/customers/:id/status — activate / deactivate (admin) ─────────────
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.query('UPDATE customers SET is_active=? WHERE id=?', [is_active ? 1 : 0, req.params.id]);
    res.json({ success: true, is_active: !!is_active });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/customers/:id/reset-password — reset & resend (admin) ───────────
router.post('/:id/reset-password', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id=? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const plain = generatePassword();
    const hash  = await bcrypt.hash(plain, 12);
    await db.query('UPDATE customers SET password_hash=? WHERE id=?', [hash, req.params.id]);
    await sendCredentialsEmail(rows[0], plain);

    res.json({ success: true, message: 'New credentials sent to customer' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/customers/:id — delete (admin) ────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, sendCredentialsEmail, generatePassword };
