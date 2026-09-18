const express  = require('express');
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const db       = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Startup: ensure bookings table has all expected columns ───────────────────
(async () => {
  const cols = [
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_time VARCHAR(20)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_signature VARCHAR(500)",
  ];
  for (const sql of cols) {
    try { await db.query(sql); } catch (_) { /* column already exists or unsupported syntax */ }
  }
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function bookingRef() {
  return 'BK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
}

async function getPaymentSettings() {
  const [rows] = await db.query('SELECT * FROM booking_payment_settings WHERE id=1 LIMIT 1');
  return rows[0] || {};
}

async function getRazorpayInstance() {
  const ps = await getPaymentSettings();
  if (!ps.is_enabled || !ps.razorpay_key_id || !ps.razorpay_key_secret) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: ps.razorpay_key_id, key_secret: ps.razorpay_key_secret });
}

async function sendBookingEmails(booking, { isUpdate = false } = {}) {
  try {
    const [rows] = await db.query('SELECT * FROM booking_email_settings WHERE id=1 LIMIT 1');
    const es = rows[0];
    if (!es || !es.is_enabled || !es.smtp_host) return;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   es.smtp_host,
      port:   es.smtp_port  || 587,
      secure: (es.smtp_port || 587) === 465,
      auth:   { user: es.smtp_user, pass: es.smtp_pass },
    });

    const fromLine  = `"${es.smtp_from_name || 'Alchmi'}" <${es.smtp_from || es.smtp_user}>`;
    const priceFmt  = new Intl.NumberFormat('en-IN', { style: 'currency', currency: booking.currency || 'INR' }).format(booking.price || 0);
    const statusCap = booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Updated';

    const customerSubject = isUpdate
      ? `Your Discovery Session Has Been Updated — ${booking.booking_ref}`
      : (es.customer_subject || 'Your Discovery Session is Confirmed');
    const customerHeading = isUpdate
      ? `Booking Updated — ${booking.booking_ref}`
      : `Booking Confirmed — ${booking.booking_ref}`;
    const customerIntro = isUpdate
      ? `Your Discovery Session booking has been updated by our team. Here are your current booking details:`
      : `Your Discovery Session has been confirmed. Here are your booking details:`;

    // Customer email
    await transporter.sendMail({
      from:    fromLine,
      to:      booking.customer_email,
      subject: customerSubject,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1208;">
          <h2 style="color:#b8922a;">${customerHeading}</h2>
          <p>Dear ${booking.customer_name},</p>
          <p>${customerIntro}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Session Duration</td><td style="padding:8px;border-bottom:1px solid #e8c96d;">${booking.duration_label}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Date</td><td style="padding:8px;border-bottom:1px solid #e8c96d;">${booking.booking_date || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Time</td><td style="padding:8px;border-bottom:1px solid #e8c96d;">${booking.booking_time || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Booking Status</td><td style="padding:8px;border-bottom:1px solid #e8c96d;">${statusCap}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e8c96d;color:#8a7d6b;">Amount</td><td style="padding:8px;border-bottom:1px solid #e8c96d;">${priceFmt}</td></tr>
            <tr><td style="padding:8px;color:#8a7d6b;">Booking Reference</td><td style="padding:8px;">${booking.booking_ref}</td></tr>
          </table>
          ${booking.session_requirements ? `<p><strong>Your session notes:</strong><br>${booking.session_requirements}</p>` : ''}
          ${isUpdate ? `<p>If you have questions about these changes, please reply to this email.</p>` : `<p>Vinay looks forward to connecting with you. You will receive a calendar invite and further instructions closer to your session date.</p>`}
          <p style="color:#8a7d6b;font-size:0.9em;">Booking Reference: ${booking.booking_ref}</p>
        </div>`,
    });

    // Admin email
    if (es.admin_email) {
      const adminSubject = isUpdate
        ? `Booking Updated — ${booking.booking_ref}`
        : `${es.admin_subject || 'New Discovery Session Booking'} — ${booking.booking_ref}`;
      await transporter.sendMail({
        from:    fromLine,
        to:      es.admin_email,
        subject: adminSubject,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1208;">
            <h2 style="color:#b8922a;">${isUpdate ? 'Booking Updated' : 'New Booking'} — ${booking.booking_ref}</h2>
            ${isUpdate ? `<p style="color:#d4670a;font-weight:bold;">This booking was updated via the admin panel.</p>` : ''}
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.customer_name}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.customer_email}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.customer_phone || '—'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Duration</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.duration_label}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Date</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.booking_date || '—'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Time</td><td style="padding:8px;border-bottom:1px solid #eee;">${booking.booking_time || '—'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Status</td><td style="padding:8px;border-bottom:1px solid #eee;">${statusCap}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;">${priceFmt}</td></tr>
              <tr><td style="padding:8px;color:#666;vertical-align:top;">Requirements</td><td style="padding:8px;">${booking.session_requirements || '—'}</td></tr>
            </table>
          </div>`,
      });
    }
  } catch (err) {
    console.error('[booking-email]', err.message);
  }
}

async function createOrUpdateCustomer(name, email, phone) {
  try {
    const [existing] = await db.query('SELECT id FROM customers WHERE email=? LIMIT 1', [email]);
    if (existing.length) {
      // Update phone if provided and not already set
      if (phone) {
        await db.query('UPDATE customers SET phone=COALESCE(phone,?) WHERE id=?', [phone, existing[0].id]);
      }
      return;
    }
    // Generate a secure random password
    const chars  = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let plain = '';
    for (let i = 0; i < 12; i++) plain += chars[crypto.randomInt(chars.length)];
    const hash = await bcrypt.hash(plain, 12);
    await db.query(
      'INSERT INTO customers (email,phone,full_name,password_hash) VALUES (?,?,?,?)',
      [email, phone || null, name, hash]
    );
    // Get the newly created customer to send credentials
    const [rows] = await db.query('SELECT * FROM customers WHERE email=? LIMIT 1', [email]);
    if (rows.length) {
      // Lazy-load to avoid circular deps
      const { sendCredentialsEmail } = require('./customers');
      await sendCredentialsEmail(rows[0], plain);
    }
  } catch (err) {
    console.error('[create-customer]', err.message);
  }
}

// ── Public endpoints ──────────────────────────────────────────────────────────

// Full availability snapshot: active time slots + open days + blocked dates
router.get('/availability', async (_req, res) => {
  try {
    const [slots]   = await db.query('SELECT id,label,sort_order FROM booking_time_slots WHERE is_active=1 ORDER BY sort_order,id');
    const [days]    = await db.query('SELECT day_of_week,is_available FROM booking_day_availability ORDER BY day_of_week');
    const [blocked] = await db.query('SELECT blocked_date FROM booking_blocked_dates');
    res.json({
      time_slots:     slots,
      available_days: days.filter(d => d.is_available).map(d => d.day_of_week),
      blocked_dates:  blocked.map(b => b.blocked_date.toISOString().split('T')[0]),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Page settings (public — no auth required)
router.get('/settings', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_settings WHERE id=1 LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Active session durations (public)
router.get('/durations', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id,label,duration_minutes,price,currency,description FROM booking_durations WHERE is_active=1 ORDER BY sort_order,id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Payment gateway public key (public — key_id only, never secret)
router.get('/payment-public', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT is_enabled, razorpay_key_id, currency FROM booking_payment_settings WHERE id=1 LIMIT 1');
    const ps = rows[0] || {};
    res.json({ is_enabled: !!ps.is_enabled, key_id: ps.razorpay_key_id || null, currency: ps.currency || 'INR' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { duration_id, customer_name, customer_email, customer_phone, session_requirements, booking_date, booking_time } = req.body;
    if (!duration_id || !customer_name || !customer_email || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [durationRows] = await db.query('SELECT * FROM booking_durations WHERE id=? AND is_active=1', [duration_id]);
    if (!durationRows.length) return res.status(404).json({ error: 'Invalid session duration' });
    const dur = durationRows[0];

    const rzp = await getRazorpayInstance();
    if (!rzp) return res.status(503).json({ error: 'Payment gateway not configured' });

    const amountPaise = Math.round(dur.price * 100);
    const order = await rzp.orders.create({
      amount:   amountPaise,
      currency: dur.currency || 'INR',
      receipt:  bookingRef(),
      notes: { customer_name, customer_email, duration_label: dur.label },
    });

    // Store pending booking
    const ref = bookingRef();
    await db.query(
      `INSERT INTO bookings (booking_ref,customer_name,customer_email,customer_phone,session_requirements,
        duration_id,duration_label,duration_minutes,price,currency,booking_date,booking_time,
        status,payment_status,payment_order_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending','pending',?)`,
      [ref, customer_name, customer_email, customer_phone || null, session_requirements || null,
       dur.id, dur.label, dur.duration_minutes, dur.price, dur.currency || 'INR',
       booking_date, booking_time, order.id]
    );

    res.json({ order_id: order.id, amount: amountPaise, currency: dur.currency || 'INR', booking_ref: ref });
  } catch (err) {
    console.error('[create-order]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment and confirm booking
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const ps = await getPaymentSettings();
    if (!ps.razorpay_key_secret) return res.status(503).json({ error: 'Payment gateway not configured' });

    const expected = crypto
      .createHmac('sha256', ps.razorpay_key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await db.query('UPDATE bookings SET payment_status=? WHERE payment_order_id=?', ['failed', razorpay_order_id]);
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    await db.query(
      'UPDATE bookings SET payment_status=?,payment_id=?,payment_signature=?,status=? WHERE payment_order_id=?',
      ['paid', razorpay_payment_id, razorpay_signature, 'confirmed', razorpay_order_id]
    );

    const [rows] = await db.query('SELECT * FROM bookings WHERE payment_order_id=? LIMIT 1', [razorpay_order_id]);
    const booking = rows[0];
    if (booking) {
      await sendBookingEmails(booking);
      await createOrUpdateCustomer(booking.customer_name, booking.customer_email, booking.customer_phone);
    }

    res.json({ success: true, booking_ref: booking?.booking_ref });
  } catch (err) {
    console.error('[verify-payment]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Combined date availability: correct slots (custom or default) + already-booked slots
router.get('/date-availability', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date param required (YYYY-MM-DD)' });
  try {
    // Check for a custom schedule for this date
    const [schedRows] = await db.query(
      'SELECT id FROM booking_date_schedules WHERE schedule_date=? LIMIT 1', [date]
    );
    let slots, is_custom;
    if (schedRows.length) {
      const [slotRows] = await db.query(
        'SELECT slot_label AS label, sort_order FROM booking_date_schedule_slots WHERE schedule_id=? ORDER BY sort_order, id',
        [schedRows[0].id]
      );
      slots     = slotRows;
      is_custom = true;
    } else {
      const [globalSlots] = await db.query(
        'SELECT label, sort_order FROM booking_time_slots WHERE is_active=1 ORDER BY sort_order, id'
      );
      slots     = globalSlots;
      is_custom = false;
    }
    // Already-booked slots for this date (non-cancelled)
    const [bookedRows] = await db.query(
      "SELECT booking_time FROM bookings WHERE booking_date=? AND status NOT IN ('cancelled') AND booking_time IS NOT NULL",
      [date]
    );
    res.json({ slots, booked: bookedRows.map(r => r.booking_time), is_custom });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Booked time slots for a given date (public — used by frontend to disable taken slots)
router.get('/booked-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
  try {
    const [rows] = await db.query(
      `SELECT booking_time FROM bookings
       WHERE booking_date = ? AND status NOT IN ('cancelled') AND booking_time IS NOT NULL`,
      [date]
    );
    res.json(rows.map(r => r.booking_time));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manual booking (no payment — cash/offline)
router.post('/manual', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, session_requirements,
      duration_id, booking_date, booking_time, payment_status, notes } = req.body;

    if (!duration_id || !customer_name || !customer_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [dRows] = await db.query('SELECT * FROM booking_durations WHERE id=?', [duration_id]);
    if (!dRows.length) return res.status(404).json({ error: 'Invalid duration' });
    const dur = dRows[0];
    const ref = bookingRef();

    await db.query(
      `INSERT INTO bookings (booking_ref,customer_name,customer_email,customer_phone,session_requirements,
        duration_id,duration_label,duration_minutes,price,currency,booking_date,booking_time,
        status,payment_status,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'confirmed',?,?)`,
      [ref, customer_name, customer_email, customer_phone || null, session_requirements || null,
       dur.id, dur.label, dur.duration_minutes, dur.price, dur.currency || 'INR',
       booking_date || null, booking_time || null, payment_status || 'paid', notes || null]
    );

    const [rows] = await db.query('SELECT * FROM bookings WHERE booking_ref=? LIMIT 1', [ref]);
    await createOrUpdateCustomer(customer_name, customer_email, customer_phone);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin endpoints (require auth) ────────────────────────────────────────────

router.get('/admin/settings', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_settings WHERE id=1 LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/settings', verifyToken, async (req, res) => {
  const { page_title, page_subtitle, page_description, hero_eyebrow, hero_title, hero_title_em,
    hero_description, form_enabled, form_title, form_description,
    confirmation_title, confirmation_message } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM booking_settings WHERE id=1 LIMIT 1');
    if (ex.length) {
      await db.query(
        `UPDATE booking_settings SET page_title=?,page_subtitle=?,page_description=?,
          hero_eyebrow=?,hero_title=?,hero_title_em=?,hero_description=?,form_enabled=?,
          form_title=?,form_description=?,confirmation_title=?,confirmation_message=? WHERE id=1`,
        [page_title, page_subtitle, page_description, hero_eyebrow, hero_title, hero_title_em,
         hero_description, form_enabled ? 1 : 0, form_title, form_description,
         confirmation_title, confirmation_message]
      );
    } else {
      await db.query(
        `INSERT INTO booking_settings (id,page_title,page_subtitle,page_description,hero_eyebrow,hero_title,hero_title_em,
          hero_description,form_enabled,form_title,form_description,confirmation_title,confirmation_message)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [page_title, page_subtitle, page_description, hero_eyebrow, hero_title, hero_title_em,
         hero_description, form_enabled ? 1 : 0, form_title, form_description,
         confirmation_title, confirmation_message]
      );
    }
    const [rows] = await db.query('SELECT * FROM booking_settings WHERE id=1 LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Payment settings (admin)
router.get('/admin/payment', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_payment_settings WHERE id=1 LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/payment', verifyToken, async (req, res) => {
  const { is_enabled, razorpay_key_id, razorpay_key_secret, currency, payment_description } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM booking_payment_settings WHERE id=1 LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE booking_payment_settings SET is_enabled=?,razorpay_key_id=?,razorpay_key_secret=?,currency=?,payment_description=? WHERE id=1',
        [is_enabled ? 1 : 0, razorpay_key_id || null, razorpay_key_secret || null, currency || 'INR', payment_description || null]
      );
    } else {
      await db.query(
        'INSERT INTO booking_payment_settings (id,is_enabled,razorpay_key_id,razorpay_key_secret,currency,payment_description) VALUES (1,?,?,?,?,?)',
        [is_enabled ? 1 : 0, razorpay_key_id || null, razorpay_key_secret || null, currency || 'INR', payment_description || null]
      );
    }
    const [rows] = await db.query('SELECT * FROM booking_payment_settings WHERE id=1 LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Email settings (admin)
router.get('/admin/email', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_email_settings WHERE id=1 LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/email', verifyToken, async (req, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name,
    admin_email, customer_subject, admin_subject, is_enabled } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM booking_email_settings WHERE id=1 LIMIT 1');
    if (ex.length) {
      await db.query(
        `UPDATE booking_email_settings SET smtp_host=?,smtp_port=?,smtp_user=?,smtp_pass=?,
          smtp_from=?,smtp_from_name=?,admin_email=?,customer_subject=?,admin_subject=?,is_enabled=? WHERE id=1`,
        [smtp_host || null, smtp_port || 587, smtp_user || null, smtp_pass || null,
         smtp_from || null, smtp_from_name || 'Alchmi', admin_email || null,
         customer_subject || null, admin_subject || null, is_enabled ? 1 : 0]
      );
    } else {
      await db.query(
        `INSERT INTO booking_email_settings (id,smtp_host,smtp_port,smtp_user,smtp_pass,smtp_from,smtp_from_name,admin_email,customer_subject,admin_subject,is_enabled)
         VALUES (1,?,?,?,?,?,?,?,?,?,?)`,
        [smtp_host || null, smtp_port || 587, smtp_user || null, smtp_pass || null,
         smtp_from || null, smtp_from_name || 'Alchmi', admin_email || null,
         customer_subject || null, admin_subject || null, is_enabled ? 1 : 0]
      );
    }
    const [rows] = await db.query('SELECT * FROM booking_email_settings WHERE id=1 LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Session durations admin CRUD
router.get('/admin/durations', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_durations ORDER BY sort_order,id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/durations', verifyToken, async (req, res) => {
  const { label, duration_minutes, price, currency, description, is_active, sort_order } = req.body;
  if (!label || !duration_minutes || price == null) return res.status(400).json({ error: 'label, duration_minutes and price are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO booking_durations (label,duration_minutes,price,currency,description,is_active,sort_order) VALUES (?,?,?,?,?,?,?)',
      [label, duration_minutes, price, currency || 'INR', description || null, is_active ? 1 : 0, sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM booking_durations WHERE id=?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/durations/:id', verifyToken, async (req, res) => {
  const { label, duration_minutes, price, currency, description, is_active, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE booking_durations SET label=?,duration_minutes=?,price=?,currency=?,description=?,is_active=?,sort_order=? WHERE id=?',
      [label, duration_minutes, price, currency || 'INR', description || null, is_active ? 1 : 0, sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM booking_durations WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/admin/durations/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM booking_durations WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bookings management (admin)
router.get('/admin/bookings', verifyToken, async (req, res) => {
  try {
    const { status, payment_status, page = 1, limit = 20 } = req.query;
    const where = [];
    const params = [];
    if (status)         { where.push('status=?');         params.push(status); }
    if (payment_status) { where.push('payment_status=?'); params.push(payment_status); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows]  = await db.query(`SELECT * FROM bookings ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) AS total FROM bookings ${whereClause}`, params);
    res.json({ bookings: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/bookings/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/bookings/:id', verifyToken, async (req, res) => {
  const { status, payment_status, notes, booking_date, booking_time, send_notification } = req.body;
  try {
    await db.query(
      'UPDATE bookings SET status=?,payment_status=?,notes=?,booking_date=?,booking_time=? WHERE id=?',
      [status, payment_status, notes || null, booking_date || null, booking_time || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    const updated = rows[0];
    if (send_notification && updated) {
      await sendBookingEmails(updated, { isUpdate: true });
    }
    res.json({ ...updated, email_sent: !!(send_notification && updated) });
  } catch (err) {
    console.error('[PUT /admin/bookings/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/bookings/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM bookings WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Availability admin ────────────────────────────────────────────────────────

// Time slots CRUD
router.get('/admin/time-slots', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_time_slots ORDER BY sort_order,id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/time-slots', verifyToken, async (req, res) => {
  const { label, sort_order, is_active } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  try {
    const [r] = await db.query(
      'INSERT INTO booking_time_slots (label,sort_order,is_active) VALUES (?,?,?)',
      [label.trim(), sort_order || 0, is_active ? 1 : 0]
    );
    const [rows] = await db.query('SELECT * FROM booking_time_slots WHERE id=?', [r.insertId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/time-slots/:id', verifyToken, async (req, res) => {
  const { label, sort_order, is_active } = req.body;
  try {
    await db.query(
      'UPDATE booking_time_slots SET label=?,sort_order=?,is_active=? WHERE id=?',
      [label.trim(), sort_order || 0, is_active ? 1 : 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM booking_time_slots WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/admin/time-slots/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM booking_time_slots WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Day-of-week availability
router.get('/admin/day-availability', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_day_availability ORDER BY day_of_week');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/day-availability', verifyToken, async (req, res) => {
  // body: [{ day_of_week: 0, is_available: false }, ...]
  const days = req.body;
  if (!Array.isArray(days)) return res.status(400).json({ error: 'expected array' });
  try {
    for (const d of days) {
      await db.query(
        'INSERT INTO booking_day_availability (day_of_week,label,is_available) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_available=?',
        [d.day_of_week, d.label || '', d.is_available ? 1 : 0, d.is_available ? 1 : 0]
      );
    }
    const [rows] = await db.query('SELECT * FROM booking_day_availability ORDER BY day_of_week');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Blocked dates CRUD
router.get('/admin/blocked-dates', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_blocked_dates ORDER BY blocked_date');
    res.json(rows.map(r => ({ ...r, blocked_date: r.blocked_date.toISOString().split('T')[0] })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/blocked-dates', verifyToken, async (req, res) => {
  const { blocked_date, reason } = req.body;
  if (!blocked_date) return res.status(400).json({ error: 'blocked_date required (YYYY-MM-DD)' });
  try {
    const [r] = await db.query(
      'INSERT INTO booking_blocked_dates (blocked_date,reason) VALUES (?,?)',
      [blocked_date, reason || null]
    );
    res.json({ id: r.insertId, blocked_date, reason: reason || null });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This date is already blocked.' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/blocked-dates/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM booking_blocked_dates WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Date-specific schedules admin ─────────────────────────────────────────────

// List all custom date schedules with their slots
router.get('/admin/date-schedules', verifyToken, async (_req, res) => {
  try {
    const [schedules] = await db.query(
      'SELECT * FROM booking_date_schedules ORDER BY schedule_date'
    );
    if (!schedules.length) return res.json([]);
    const ids = schedules.map(s => s.id);
    const [slots] = await db.query(
      `SELECT * FROM booking_date_schedule_slots WHERE schedule_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort_order, id`,
      ids
    );
    const result = schedules.map(s => ({
      ...s,
      schedule_date: s.schedule_date.toISOString().split('T')[0],
      slots: slots.filter(sl => sl.schedule_id === s.id).map(sl => sl.slot_label),
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a custom date schedule
router.post('/admin/date-schedules', verifyToken, async (req, res) => {
  const { schedule_date, note, slots } = req.body;
  if (!schedule_date)          return res.status(400).json({ error: 'schedule_date required' });
  if (!Array.isArray(slots) || !slots.length) return res.status(400).json({ error: 'slots array required' });
  try {
    const [r] = await db.query(
      'INSERT INTO booking_date_schedules (schedule_date, note) VALUES (?, ?)',
      [schedule_date, note || null]
    );
    const schedId = r.insertId;
    for (let i = 0; i < slots.length; i++) {
      await db.query(
        'INSERT INTO booking_date_schedule_slots (schedule_id, slot_label, sort_order) VALUES (?,?,?)',
        [schedId, slots[i], i]
      );
    }
    res.json({ id: schedId, schedule_date, note: note || null, slots });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A custom schedule already exists for this date.' });
    res.status(500).json({ error: err.message });
  }
});

// Update an existing date schedule
router.put('/admin/date-schedules/:id', verifyToken, async (req, res) => {
  const { note, slots } = req.body;
  if (!Array.isArray(slots) || !slots.length) return res.status(400).json({ error: 'slots array required' });
  try {
    await db.query('UPDATE booking_date_schedules SET note=? WHERE id=?', [note || null, req.params.id]);
    await db.query('DELETE FROM booking_date_schedule_slots WHERE schedule_id=?', [req.params.id]);
    for (let i = 0; i < slots.length; i++) {
      await db.query(
        'INSERT INTO booking_date_schedule_slots (schedule_id, slot_label, sort_order) VALUES (?,?,?)',
        [req.params.id, slots[i], i]
      );
    }
    const [rows] = await db.query('SELECT * FROM booking_date_schedules WHERE id=?', [req.params.id]);
    res.json({ ...rows[0], schedule_date: rows[0].schedule_date.toISOString().split('T')[0], slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a date schedule (reverts that date to global defaults)
router.delete('/admin/date-schedules/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM booking_date_schedules WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stats for admin dashboard
router.get('/admin/stats', verifyToken, async (_req, res) => {
  try {
    const [[{ total }]]     = await db.query('SELECT COUNT(*) AS total FROM bookings');
    const [[{ confirmed }]] = await db.query("SELECT COUNT(*) AS confirmed FROM bookings WHERE status='confirmed'");
    const [[{ revenue }]]   = await db.query("SELECT COALESCE(SUM(price),0) AS revenue FROM bookings WHERE payment_status='paid'");
    const [[{ pending }]]   = await db.query("SELECT COUNT(*) AS pending FROM bookings WHERE status='pending'");
    res.json({ total, confirmed, revenue, pending });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
