-- ============================================================
--  Home → Themes: add icon_url column
--  Database: vkulkarni-react
--  Run once. Safe to skip if column already exists.
-- ============================================================

ALTER TABLE home_themes
  ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500) NOT NULL DEFAULT '';
