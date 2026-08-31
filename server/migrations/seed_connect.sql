-- ============================================================
--  Connect Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_connect.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
-- ============================================================

SET NAMES utf8mb4;

DELETE FROM con_hero;
DELETE FROM con_section;
DELETE FROM con_links;

ALTER TABLE con_hero    AUTO_INCREMENT = 1;
ALTER TABLE con_section AUTO_INCREMENT = 1;
ALTER TABLE con_links   AUTO_INCREMENT = 1;


-- ── HERO ──────────────────────────────────────────────────────────────────────
INSERT INTO con_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Connect',
  'Begin a',
  'Conversation',
  'Whether you seek to collaborate, explore ideas, or embark on a learning journey — Vinay welcomes thoughtful dialogue.',
  'Connect'
);


-- ── SECTION DESCRIPTION ───────────────────────────────────────────────────────
INSERT INTO con_section (description) VALUES (
  'Whether you seek to collaborate, explore ideas, or embark on a learning journey — Vinay welcomes thoughtful dialogue rooted in genuine inquiry.'
);


-- ── LINKS ─────────────────────────────────────────────────────────────────────
INSERT INTO con_links (icon, label, href, sort_order) VALUES
  ('in', 'LinkedIn',                 'https://www.linkedin.com/in/vinkulkarni/', 0),
  ('𝕏',  '@aatmavalokana',           'https://x.com/aatmavalokana',             1),
  ('✉',  'Subscribe to Newsletter',  'https://zcmp.in/xO0w',                    2);
