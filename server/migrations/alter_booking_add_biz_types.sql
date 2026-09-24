-- ─────────────────────────────────────────────────────────────────────────────
-- Business-Type Tabs for Book Discovery – Step 1
-- Adds the booking_biz_types table and links booking_durations to it.
-- Safe to run on an existing database (all statements are idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the business-types lookup table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_biz_types (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(100)  NOT NULL,
  tagline    VARCHAR(255)  NULL DEFAULT NULL,
  sort_order INT           DEFAULT 0,
  is_active  TINYINT(1)    DEFAULT 1
);

-- 1b. Add tagline column if the table already existed without it
-- ─────────────────────────────────────────────────────────────────────────────
SET @tagline_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'booking_biz_types'
    AND COLUMN_NAME  = 'tagline'
);

SET @sql_tagline = IF(
  @tagline_exists = 0,
  'ALTER TABLE booking_biz_types ADD COLUMN tagline VARCHAR(255) NULL DEFAULT NULL AFTER label',
  'SELECT ''tagline column already exists'' AS migration_note'
);

PREPARE stmt_tagline FROM @sql_tagline;
EXECUTE stmt_tagline;
DEALLOCATE PREPARE stmt_tagline;

-- 2. Seed default tabs (skip if rows already exist)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO booking_biz_types (label, tagline, sort_order, is_active)
SELECT 'MSME',      'Ideal for small & medium enterprises',          0, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM booking_biz_types WHERE label = 'MSME');

INSERT INTO booking_biz_types (label, tagline, sort_order, is_active)
SELECT 'Startup',   'For early-stage and growth-phase startups',     1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM booking_biz_types WHERE label = 'Startup');

INSERT INTO booking_biz_types (label, tagline, sort_order, is_active)
SELECT 'Large',     'For established businesses scaling up',         2, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM booking_biz_types WHERE label = 'Large');

INSERT INTO booking_biz_types (label, tagline, sort_order, is_active)
SELECT 'Corporate', 'Tailored sessions for large organisations',     3, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM booking_biz_types WHERE label = 'Corporate');

-- 2b. Back-fill taglines for existing rows that were seeded without them
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE booking_biz_types SET tagline = 'Ideal for small & medium enterprises'    WHERE label = 'MSME'      AND (tagline IS NULL OR tagline = '');
UPDATE booking_biz_types SET tagline = 'For early-stage and growth-phase startups' WHERE label = 'Startup'   AND (tagline IS NULL OR tagline = '');
UPDATE booking_biz_types SET tagline = 'For established businesses scaling up'   WHERE label = 'Large'     AND (tagline IS NULL OR tagline = '');
UPDATE booking_biz_types SET tagline = 'Tailored sessions for large organisations' WHERE label = 'Corporate' AND (tagline IS NULL OR tagline = '');

-- 3. Add biz_type_id foreign key column to booking_durations
--    NULL = duration appears under ALL business-type tabs (universal)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'booking_durations'
    AND COLUMN_NAME  = 'biz_type_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE booking_durations ADD COLUMN biz_type_id INT NULL DEFAULT NULL AFTER sort_order',
  'SELECT ''biz_type_id column already exists – skipping'' AS migration_note'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
