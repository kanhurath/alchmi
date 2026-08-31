-- ============================================================
--  Gallery Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_gallery.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS gal_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Gallery images ─────────────────────────────────────────
--   cat       → category key: iks | talks | workshops | portraits
--   image_url → uploaded server path (/uploads/gallery/…)
--               Empty = the static bundled image is used as fallback on the frontend
CREATE TABLE IF NOT EXISTS gal_images (
  id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  cat        VARCHAR(50)       NOT NULL DEFAULT 'iks',
  caption    VARCHAR(300)      NOT NULL DEFAULT '',
  image_url  VARCHAR(500)      NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
