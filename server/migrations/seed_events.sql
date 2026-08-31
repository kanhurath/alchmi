-- ============================================================
--  Events Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_events.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
-- ============================================================

SET NAMES utf8mb4;

-- ── Clear existing data ───────────────────────────────────
DELETE FROM evt_hero;
DELETE FROM evt_upcoming;
DELETE FROM evt_completed;

ALTER TABLE evt_hero      AUTO_INCREMENT = 1;
ALTER TABLE evt_upcoming  AUTO_INCREMENT = 1;
ALTER TABLE evt_completed AUTO_INCREMENT = 1;


-- ============================================================
--  HERO
-- ============================================================
INSERT INTO evt_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Events',
  'Upcoming &',
  'Past Events',
  'Certificate courses, corporate retreats, public lectures, and academic convenings — rooted in Indian Knowledge Systems and Dharmic leadership.',
  'Events'
);


-- ============================================================
--  UPCOMING EVENTS
-- ============================================================

-- Event 1 — Featured: IKS Certificate Course Cohort 4
INSERT INTO evt_upcoming
  (featured, day, month, year, type, title, description, meta_json,
   register_label, spots_percent, spots_label, url, sort_order)
VALUES (
  1,
  '18', 'Jul', '2026',
  'Certificate Course · Open Enrolment',
  '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 4',
  'A structured, faculty-led journey through the foundational frameworks of Indian Knowledge Systems — for educators, professionals, and learners seeking a substantive engagement with the field. Drawing on Vedānta, Yoga, Nyāya, Arthaśāstra, and Āyurveda.',
  '[{"icon":"◎","text":"Online · Zoom"},{"icon":"◈","text":"36 Hours over 12 Sessions"},{"icon":"✦","text":"Vinay Kulkarni"}]',
  'Register',
  65,
  'Limited seats · 35% remaining',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  0
);

-- Event 2 — Corporate Workshop
INSERT INTO evt_upcoming
  (featured, day, month, year, type, title, description, meta_json,
   register_label, spots_percent, spots_label, url, sort_order)
VALUES (
  0,
  '05', 'Aug', '2026',
  'Corporate Workshop',
  'Dharmic Leadership Retreat — Leadership Team Immersive',
  'A two-day immersive for senior leadership teams blending strategy, mental-model evaluation, and dharmic enterprise principles. Custom-designed for boards and founders.',
  '[{"icon":"◎","text":"Bengaluru"},{"icon":"◈","text":"2 Days"}]',
  'Enquire',
  NULL,
  '',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  1
);

-- Event 3 — Public Lecture
INSERT INTO evt_upcoming
  (featured, day, month, year, type, title, description, meta_json,
   register_label, spots_percent, spots_label, url, sort_order)
VALUES (
  0,
  '20', 'Sep', '2026',
  'Public Lecture · Upadesha Academy',
  'The Pañcakoṣa Model and the Architecture of Human Flourishing',
  'An open public lecture on what the Taittirīya Upaniṣad tells us about consciousness, education, and the design of a fully human life. For general audiences — no prior background required.',
  '[{"icon":"◎","text":"Online · Free Entry"},{"icon":"◈","text":"2 Hours"}]',
  'Register',
  NULL,
  '',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  2
);


-- ============================================================
--  COMPLETED EVENTS
-- ============================================================
INSERT INTO evt_completed (day, month, type, title, meta_json, url, sort_order) VALUES

('31', 'Jan 2026',
 'Panel Discussion',
 'Vedanta in Education — Param · Unified Vision Panel',
 '["Chanakya University · Bengaluru","Tripura Vasini, Palace Grounds"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 0),

('20', 'Apr 2026',
 'Academic Conclave',
 'IKS APEX Meet 2026 — An Experiment in Saṃvāda',
 '["IKS APEX 2026","Panel of 15 scholar-practitioners"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 1),

('08', 'Mar 2026',
 'Lecture — IKS Certificate Course',
 'Acharya Devo Bhava — Session 3, IKS Certificate Course',
 '["Śrī Guru Teg Bahadur Khalsa College · Punjab","NLD Platform"]',
 'http://localhost:3001/blog/2026/03/08/acharya-devo-bhava/',
 2),

('05', 'Mar 2026',
 'Certificate Course — Cohort 3',
 '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 3',
 '["Online","36 Hours · 12 Sessions"]',
 'http://localhost:3001/blog/2026/03/05/3378/',
 3),

('15', 'Dec 2025',
 'Corporate Workshop',
 'Dharmic Creative Leadership Framework — Leadership Immersive',
 '["Bengaluru","ALCHMI · Corporate Program"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 4),

('10', 'Sep 2025',
 'Public Lecture · Upadesha Academy',
 'Viewing the World Through Indian Knowledge Systems',
 '["Online","Upadesha Academy Open Lecture"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 5),

('20', 'Jun 2025',
 'Certificate Course — Cohort 2',
 '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 2',
 '["Online","36 Hours · 12 Sessions"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 6),

('14', 'Jan 2025',
 'Certificate Course — Cohort 1',
 '36-Hour Certificate Course on Indian Knowledge Systems — Cohort 1',
 '["Online","Inaugural Cohort"]',
 'http://localhost:3001/blog/talks-interviews-podcasts/',
 7);
