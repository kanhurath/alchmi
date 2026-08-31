-- ============================================================
--  Videos / Talks Page CMS — Schema
--  Database: vkulkarni-react
--  Run this file first, then seed_videos.sql
-- ============================================================

-- ── Hero (single row) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS vid_hero (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  eyebrow     VARCHAR(200)     NOT NULL DEFAULT '',
  title       VARCHAR(200)     NOT NULL DEFAULT '',
  title_em    VARCHAR(200)     NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(200)     NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Videos list ───────────────────────────────────────────
--   tags_json   → JSON array of strings
--   thumb_url   → uploaded server path (/uploads/videos/…)
--                 OR full external URL (YouTube thumbnail, etc.)
--                 Empty string → frontend falls back to bundled static image
--   video_url   → YouTube / external video URL
--   watch_label → 'Watch' | 'Listen'
CREATE TABLE IF NOT EXISTS vid_videos (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  type         VARCHAR(100)     NOT NULL DEFAULT '',
  title        VARCHAR(500)     NOT NULL DEFAULT '',
  description  TEXT,
  date_text    VARCHAR(100)     NOT NULL DEFAULT '',
  host         VARCHAR(300)     NOT NULL DEFAULT '',
  watch_label  VARCHAR(50)      NOT NULL DEFAULT 'Watch',
  thumb_url    VARCHAR(500)     NOT NULL DEFAULT '',
  video_url    VARCHAR(500)     NOT NULL DEFAULT '',
  tags_json    TEXT,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sidebar content (single row) ──────────────────────────
CREATE TABLE IF NOT EXISTS vid_sidebar (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quote_text       TEXT,
  quote_attr       VARCHAR(300)  NOT NULL DEFAULT '',
  invite_title     VARCHAR(200)  NOT NULL DEFAULT '',
  invite_text      TEXT,
  invite_btn_label VARCHAR(100)  NOT NULL DEFAULT 'Book a Session',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
