-- ============================================================
--  Events Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_events.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS evt_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Upcoming events ────────────────────────────────────────
--   meta_json      → JSON array of {icon, text} objects
--   spots_percent  → NULL = hide bar; 0–100 = % of seats filled
CREATE TABLE IF NOT EXISTS evt_upcoming (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  featured       TINYINT(1)       NOT NULL DEFAULT 0,
  day            VARCHAR(10)      NOT NULL DEFAULT '',
  month          VARCHAR(20)      NOT NULL DEFAULT '',
  year           VARCHAR(10)      NOT NULL DEFAULT '',
  type           VARCHAR(300)     NOT NULL DEFAULT '',
  title          VARCHAR(500)     NOT NULL DEFAULT '',
  description    TEXT,
  meta_json      TEXT,
  register_label VARCHAR(50)      NOT NULL DEFAULT 'Register',
  spots_percent  TINYINT UNSIGNED     NULL DEFAULT NULL,
  spots_label    VARCHAR(200)     NOT NULL DEFAULT '',
  url            VARCHAR(500)     NOT NULL DEFAULT '',
  sort_order     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Completed / past events ────────────────────────────────
--   meta_json → JSON array of plain strings (venue, platform, notes…)
CREATE TABLE IF NOT EXISTS evt_completed (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  day        VARCHAR(10)       NOT NULL DEFAULT '',
  month      VARCHAR(30)       NOT NULL DEFAULT '',
  type       VARCHAR(300)      NOT NULL DEFAULT '',
  title      VARCHAR(500)      NOT NULL DEFAULT '',
  meta_json  TEXT,
  url        VARCHAR(500)      NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
