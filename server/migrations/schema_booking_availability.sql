-- ── Booking availability tables ──────────────────────────────────────────────

-- Time slots (replaces the hardcoded frontend list)
CREATE TABLE IF NOT EXISTS booking_time_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(20)  NOT NULL,
  sort_order INT          DEFAULT 0,
  is_active  TINYINT(1)   DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Which days of the week are open for booking (0=Sun … 6=Sat)
CREATE TABLE IF NOT EXISTS booking_day_availability (
  day_of_week  TINYINT      NOT NULL PRIMARY KEY,  -- 0-6
  is_available TINYINT(1)   DEFAULT 1,
  label        VARCHAR(20)  NOT NULL
);

-- Specific dates that are fully blocked (holidays, leave, etc.)
CREATE TABLE IF NOT EXISTS booking_blocked_dates (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  blocked_date DATE         NOT NULL UNIQUE,
  reason       VARCHAR(255),
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Seed defaults ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO booking_time_slots (label, sort_order, is_active) VALUES
  ('09:00 AM', 1, 1),
  ('10:00 AM', 2, 1),
  ('11:00 AM', 3, 1),
  ('12:00 PM', 4, 1),
  ('02:00 PM', 5, 1),
  ('03:00 PM', 6, 1),
  ('04:00 PM', 7, 1),
  ('05:00 PM', 8, 1),
  ('06:00 PM', 9, 1);

INSERT IGNORE INTO booking_day_availability (day_of_week, label, is_available) VALUES
  (0, 'Sunday',    0),
  (1, 'Monday',    1),
  (2, 'Tuesday',   1),
  (3, 'Wednesday', 1),
  (4, 'Thursday',  1),
  (5, 'Friday',    1),
  (6, 'Saturday',  0);
