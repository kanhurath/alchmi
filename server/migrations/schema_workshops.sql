-- ============================================================
--  Workshops & Retreats Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_workshops.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS wks_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Intro band (single row) ────────────────────────────────
CREATE TABLE IF NOT EXISTS wks_intro (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  description TEXT,
  btn_label   VARCHAR(100)     NOT NULL DEFAULT 'Book a Session',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Filter buttons (excluding the always-present "All") ────
--   key_name must match the space-separated cat_keys on cards
CREATE TABLE IF NOT EXISTS wks_filters (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  key_name   VARCHAR(50)       NOT NULL DEFAULT '',
  label      VARCHAR(100)      NOT NULL DEFAULT '',
  sort_order TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Workshop program cards ─────────────────────────────────
--   cat_keys  → space-separated filter key_names, e.g. "iks open"
--   specs_json → JSON array of {icon, text}
CREATE TABLE IF NOT EXISTS wks_cards (
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  featured    TINYINT(1)        NOT NULL DEFAULT 0,
  cat_keys    VARCHAR(200)      NOT NULL DEFAULT '',
  glyph       VARCHAR(20)       NOT NULL DEFAULT '',
  format      VARCHAR(100)      NOT NULL DEFAULT '',
  tag         VARCHAR(200)      NOT NULL DEFAULT '',
  title       VARCHAR(300)      NOT NULL DEFAULT '',
  description TEXT,
  specs_json  TEXT,
  audience    VARCHAR(200)      NOT NULL DEFAULT '',
  cta_label   VARCHAR(50)       NOT NULL DEFAULT 'Enquire',
  url         VARCHAR(500)      NOT NULL DEFAULT '',
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Residential retreats ────────────────────────────────────
CREATE TABLE IF NOT EXISTS wks_retreats (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  numeral     VARCHAR(10)      NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  sub         VARCHAR(200)     NOT NULL DEFAULT '',
  description TEXT,
  footer      VARCHAR(200)     NOT NULL DEFAULT '',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Testimonials ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wks_testimonials (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  quote      TEXT             NOT NULL,
  name       VARCHAR(200)     NOT NULL DEFAULT '',
  role       VARCHAR(300)     NOT NULL DEFAULT '',
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
