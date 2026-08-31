-- ============================================================
--  Teaching Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_teaching.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tch_hero (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)    NOT NULL DEFAULT '',
  title       VARCHAR(200)    NOT NULL DEFAULT '',
  title_em    VARCHAR(200)    NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)    NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Stats band ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tch_stats (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  num         VARCHAR(20)     NOT NULL DEFAULT '',
  label       VARCHAR(100)    NOT NULL DEFAULT '',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Teaching history cards ────────────────────────────────
--   stats_json   → JSON array of {val, key}
--   bullets_json → JSON array of HTML strings
--   tags_json    → JSON array of strings
--   variant      → '' | 'accent' | 'gold'
CREATE TABLE IF NOT EXISTS tch_history (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  role          VARCHAR(200)    NOT NULL DEFAULT '',
  period        VARCHAR(200)    NOT NULL DEFAULT '',
  location      VARCHAR(200)    NOT NULL DEFAULT '',
  org           VARCHAR(300)    NOT NULL DEFAULT '',
  featured      TINYINT(1)      NOT NULL DEFAULT 0,
  variant       VARCHAR(20)     NOT NULL DEFAULT '',
  plain         TEXT,
  stats_json    TEXT,
  bullets_json  TEXT,
  tags_json     TEXT,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Course reports ────────────────────────────────────────
--   specs_json      → JSON array of {val, key}  (empty = hide specs grid)
--   paragraphs_json → JSON array of {text, highlight}
CREATE TABLE IF NOT EXISTS tch_courses (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  tag             VARCHAR(300)    NOT NULL DEFAULT '',
  title           VARCHAR(300)    NOT NULL DEFAULT '',
  subtitle        VARCHAR(300)    NOT NULL DEFAULT '',
  date_text       VARCHAR(200)    NOT NULL DEFAULT '',
  location_text   VARCHAR(200)    NOT NULL DEFAULT '',
  rating          VARCHAR(20)     NOT NULL DEFAULT '',
  rating_label    VARCHAR(100)    NOT NULL DEFAULT '',
  pull_quote      TEXT,
  pq_attr         VARCHAR(300)    NOT NULL DEFAULT '',
  specs_json      TEXT,
  paragraphs_json TEXT,
  sort_order      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Student feedback cards ────────────────────────────────
--   av_class → 'av-a' | 'av-b' | 'av-c' | 'av-d'
CREATE TABLE IF NOT EXISTS tch_feedback (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  stars       TINYINT UNSIGNED NOT NULL DEFAULT 5,
  text        TEXT            NOT NULL,
  name        VARCHAR(200)    NOT NULL DEFAULT '',
  institution TEXT,
  av_class    VARCHAR(20)     NOT NULL DEFAULT 'av-a',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Core teaching themes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS tch_themes (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  glyph       VARCHAR(20)     NOT NULL DEFAULT '',
  title       VARCHAR(300)    NOT NULL DEFAULT '',
  description TEXT,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
