-- ─────────────────────────────────────────────────────────────────────────────
-- Discovery Session Booking System
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_settings (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  page_title           VARCHAR(255) DEFAULT 'Book a Discovery Session',
  page_subtitle        TEXT,
  page_description     TEXT,
  hero_eyebrow         VARCHAR(255) DEFAULT 'One-on-One Session',
  hero_title           VARCHAR(255) DEFAULT 'Book a Discovery Session',
  hero_title_em        VARCHAR(255) DEFAULT 'Discovery Session',
  hero_description     TEXT,
  form_enabled         TINYINT(1)  DEFAULT 1,
  form_title           VARCHAR(255) DEFAULT 'Schedule Your Session',
  form_description     TEXT,
  confirmation_title   VARCHAR(255) DEFAULT 'Booking Confirmed',
  confirmation_message TEXT,
  updated_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_durations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  label            VARCHAR(100)    NOT NULL,
  duration_minutes INT             NOT NULL,
  price            DECIMAL(10, 2)  NOT NULL,
  currency         VARCHAR(10)     DEFAULT 'INR',
  description      TEXT,
  is_active        TINYINT(1)      DEFAULT 1,
  sort_order       INT             DEFAULT 0,
  created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_payment_settings (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  gateway               VARCHAR(50)  DEFAULT 'razorpay',
  is_enabled            TINYINT(1)   DEFAULT 0,
  razorpay_key_id       VARCHAR(255),
  razorpay_key_secret   VARCHAR(255),
  currency              VARCHAR(10)  DEFAULT 'INR',
  payment_description   VARCHAR(255) DEFAULT 'Discovery Session Booking',
  updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_email_settings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  smtp_host      VARCHAR(255),
  smtp_port      INT          DEFAULT 587,
  smtp_user      VARCHAR(255),
  smtp_pass      VARCHAR(255),
  smtp_from      VARCHAR(255),
  smtp_from_name VARCHAR(255) DEFAULT 'Alchmi',
  admin_email    VARCHAR(255),
  customer_subject VARCHAR(255) DEFAULT 'Your Discovery Session is Confirmed',
  admin_subject    VARCHAR(255) DEFAULT 'New Discovery Session Booking',
  is_enabled     TINYINT(1)   DEFAULT 0,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref       VARCHAR(50)  UNIQUE NOT NULL,
  customer_name     VARCHAR(255) NOT NULL,
  customer_email    VARCHAR(255) NOT NULL,
  customer_phone    VARCHAR(50),
  session_requirements TEXT,
  duration_id       INT,
  duration_label    VARCHAR(100),
  duration_minutes  INT,
  price             DECIMAL(10, 2),
  currency          VARCHAR(10)  DEFAULT 'INR',
  booking_date      DATE,
  booking_time      VARCHAR(20),
  status            ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  payment_status    ENUM('pending','paid','failed','refunded')          DEFAULT 'pending',
  payment_id        VARCHAR(255),
  payment_order_id  VARCHAR(255),
  payment_signature VARCHAR(500),
  notes             TEXT,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Seed defaults ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO booking_settings (id, page_title, page_subtitle, page_description,
  hero_eyebrow, hero_title, hero_title_em, hero_description,
  form_title, form_description, confirmation_title, confirmation_message)
VALUES (1,
  'Book a Discovery Session',
  'Begin your transformative journey with a personalised one-on-one session.',
  'A discovery session is a focused, high-impact conversation with Vinay Kulkarni designed to bring clarity, direction, and transformation to your leadership, business, or personal journey.',
  'One-on-One Session',
  'Book a Discovery Session',
  'Discovery Session',
  'Connect directly with Vinay in a private, confidential session tailored entirely to your needs. Whether you are navigating a pivotal decision, seeking strategic clarity, or beginning a deeper inquiry — this session is your starting point.',
  'Schedule Your Discovery Session',
  'Choose your preferred session length, select a date and time, and complete your booking securely online. You will receive a confirmation email immediately after payment.',
  'Booking Confirmed',
  'Thank you for booking your Discovery Session. A confirmation email has been sent to you with all details. Vinay looks forward to connecting with you.'
);

INSERT IGNORE INTO booking_payment_settings (id) VALUES (1);
INSERT IGNORE INTO booking_email_settings   (id) VALUES (1);

INSERT IGNORE INTO booking_durations (label, duration_minutes, price, currency, description, sort_order) VALUES
  ('30 Minutes',  30,  25000.00, 'INR', 'A focused introductory session to explore your needs and clarify key questions.',  1),
  ('1 Hour',      60,  50000.00, 'INR', 'A comprehensive deep-dive covering strategy, challenges, and a clear path forward.', 2),
  ('2 Hours',    120,  90000.00, 'INR', 'An immersive extended session for complex challenges and detailed transformation planning.', 3);
