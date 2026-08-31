-- ============================================================
--  Gallery Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_gallery.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
--
--  NOTE ON IMAGES:
--  Gallery images are currently bundled as Vite build-time
--  assets (src/assets/gallery-images/*) and cannot be copied
--  into the server upload folder automatically.
--
--  Two options:
--  A) Leave gal_images empty → the frontend uses the 26
--     bundled static images as its complete fallback.
--  B) Upload images via Admin → Gallery → Images → Upload Image.
--     Each upload stores the file at server/public/uploads/gallery/
--     and records the path in gal_images.image_url.
--     The CMS images then take over from the static fallback.
--
--  This seed file seeds only the hero row. Images are managed
--  through the admin upload interface.
-- ============================================================

SET NAMES utf8mb4;

DELETE FROM gal_hero;
DELETE FROM gal_images;

ALTER TABLE gal_hero   AUTO_INCREMENT = 1;
ALTER TABLE gal_images AUTO_INCREMENT = 1;


-- ── HERO ──────────────────────────────────────────────────────────────────────
INSERT INTO gal_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Gallery',
  'Photos &',
  'Moments',
  'Images from IKS events, talks, workshops, and academic convenings — a visual record of the work and its community.',
  'Gallery'
);

-- ── IMAGES ────────────────────────────────────────────────────────────────────
-- Seeded with metadata only (image_url = '').
-- Upload the actual image files via Admin → Gallery → Images.
-- The frontend falls back to bundled static images until uploads are made.
INSERT INTO gal_images (cat, caption, image_url, sort_order) VALUES
  ('iks',       'IKS APEX Meet 2026',                   '', 0),
  ('iks',       'IKS APEX Meet 2026',                   '', 1),
  ('iks',       'IKS APEX Meet 2026',                   '', 2),
  ('portraits', 'Vinay Kulkarni',                       '', 3),
  ('iks',       'IKS APEX Meet 2026 · Session',         '', 4),
  ('talks',     'IKS & Bhāratīya Education',            '', 5),
  ('iks',       'IKS APEX Meet 2026',                   '', 6),
  ('iks',       'IKS APEX Meet 2026',                   '', 7),
  ('workshops', 'Workshop · 2025',                      '', 8),
  ('workshops', 'Workshop · 2025',                      '', 9),
  ('workshops', 'Workshop · 2025',                      '', 10),
  ('talks',     'Talk · 2026',                          '', 11),
  ('talks',     'Talk · 2026',                          '', 12),
  ('talks',     'Talk · 2026',                          '', 13),
  ('iks',       'IKS Session · Feb 2026',               '', 14),
  ('workshops', 'Certificate Course · 2025',            '', 15),
  ('workshops', 'Workshop · 2025',                      '', 16),
  ('workshops', 'Workshop · 2025',                      '', 17),
  ('iks',       'IKS Session · Feb 2026',               '', 18),
  ('workshops', 'IKS Certificate Course · Feb 2025',   '', 19),
  ('workshops', 'Certificate Course · Feb 2025',        '', 20),
  ('workshops', 'Certificate Course · Feb 2025',        '', 21),
  ('workshops', 'Workshop · Feb 2025',                  '', 22),
  ('workshops', 'Workshop · Feb 2025',                  '', 23),
  ('portraits', 'Portrait · 2025',                     '', 24),
  ('workshops', 'IKS Course Launch · Feb 2025',        '', 25);
