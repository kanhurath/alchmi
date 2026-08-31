-- ============================================================
--  Home → About Section: add media_url column
--  Database: vkulkarni-react
--  Run once. Safe to skip if column already exists.
-- ============================================================

ALTER TABLE home_about
  ADD COLUMN IF NOT EXISTS media_url VARCHAR(500) NOT NULL DEFAULT '';
