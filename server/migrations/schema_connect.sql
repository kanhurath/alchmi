-- ============================================================
--  Connect Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_connect.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS con_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Section content (single row — description text) ───────
CREATE TABLE IF NOT EXISTS con_section (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  description TEXT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Social / external links ────────────────────────────────
CREATE TABLE IF NOT EXISTS con_links (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  icon       VARCHAR(20)       NOT NULL DEFAULT '',
  label      VARCHAR(200)      NOT NULL DEFAULT '',
  href       VARCHAR(500)      NOT NULL DEFAULT '',
  sort_order TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
