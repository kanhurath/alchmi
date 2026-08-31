-- ============================================================
--  Testimonials Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_testimonials.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS tst_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Filter buttons (excluding the always-present "All")
CREATE TABLE IF NOT EXISTS tst_filters (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  key_name   VARCHAR(50)      NOT NULL DEFAULT '',
  label      VARCHAR(100)     NOT NULL DEFAULT '',
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Featured pull quote (single row)
CREATE TABLE IF NOT EXISTS tst_featured (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote   TEXT,
  author  VARCHAR(200) NOT NULL DEFAULT '',
  role    VARCHAR(300) NOT NULL DEFAULT '',
  program VARCHAR(200) NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonial cards
--   cat_keys → space-separated filter key_names, e.g. "iks corporate"
--   large    → 1 = taller featured card in the masonry grid
--   avatar   → 1–2 initial characters displayed in the avatar circle
CREATE TABLE IF NOT EXISTS tst_cards (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  cat_keys   VARCHAR(200)      NOT NULL DEFAULT '',
  large      TINYINT(1)        NOT NULL DEFAULT 0,
  avatar     VARCHAR(10)       NOT NULL DEFAULT '',
  text       TEXT              NOT NULL,
  author     VARCHAR(200)      NOT NULL DEFAULT '',
  role       VARCHAR(300)      NOT NULL DEFAULT '',
  program    VARCHAR(200)      NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stats band
CREATE TABLE IF NOT EXISTS tst_stats (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  number      VARCHAR(20)      NOT NULL DEFAULT '',
  suffix      VARCHAR(10)      NOT NULL DEFAULT '',
  label       VARCHAR(100)     NOT NULL DEFAULT '',
  description VARCHAR(200)     NOT NULL DEFAULT '',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pull quotes (Selected Reflections section)
CREATE TABLE IF NOT EXISTS tst_pull_quotes (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  program    VARCHAR(200)      NOT NULL DEFAULT '',
  avatar     VARCHAR(10)       NOT NULL DEFAULT '',
  text       TEXT              NOT NULL,
  author     VARCHAR(200)      NOT NULL DEFAULT '',
  role       VARCHAR(300)      NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
