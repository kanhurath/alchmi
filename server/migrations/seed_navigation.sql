-- ============================================================
-- Seed: Navigation — mirrors current static header + footer exactly
-- Run AFTER schema_navigation.sql
-- ============================================================

USE `vk_portal_db`;

TRUNCATE TABLE nav_items;

-- ── Header nav (top-level) ────────────────────────────────────────────────────
INSERT INTO nav_items (menu, label, url, is_external, parent_id, sort_order) VALUES
  ('header', 'Biography', '/biography', 0, NULL, 1),
  ('header', 'Articles',  '/articles',  0, NULL, 2),
  ('header', 'Teaching',  '/teaching',  0, NULL, 3),
  ('header', 'Videos',    '/videos',    0, NULL, 4),
  ('header', 'Events',    '/events',    0, NULL, 5),
  ('header', 'Connect',   '/connect',   0, NULL, 6),
  ('header', 'Gallery',   '/gallery',   0, NULL, 7);

-- ── Header submenu under Events (parent_id = id of Events row) ───────────────
-- Events was inserted as row 5; get its id then insert child
SET @events_id = (SELECT id FROM nav_items WHERE menu='header' AND label='Events' LIMIT 1);
INSERT INTO nav_items (menu, label, url, is_external, parent_id, sort_order) VALUES
  ('header', 'Workshops & Retreats', '/workshops', 0, @events_id, 1);

-- ── Footer nav ───────────────────────────────────────────────────────────────
INSERT INTO nav_items (menu, label, url, is_external, parent_id, sort_order) VALUES
  ('footer', 'Biography',            '/biography',      0, NULL, 1),
  ('footer', 'Articles',             '/articles',       0, NULL, 2),
  ('footer', 'Teaching',             '/teaching',       0, NULL, 3),
  ('footer', 'Videos',               '/videos',         0, NULL, 4),
  ('footer', 'Events',               '/events',         0, NULL, 5),
  ('footer', 'Workshops & Retreats', '/workshops',      0, NULL, 6),
  ('footer', 'Connect',              '/connect',        0, NULL, 7),
  ('footer', 'Gallery',              '/gallery',        0, NULL, 8),
  ('footer', 'Newsletter',           'https://zcmp.in/xO0w', 1, NULL, 9);
