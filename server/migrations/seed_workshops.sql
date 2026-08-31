-- ============================================================
--  Workshops & Retreats Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_workshops.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
-- ============================================================

SET NAMES utf8mb4;

-- ── Clear existing data ───────────────────────────────────
DELETE FROM wks_hero;
DELETE FROM wks_intro;
DELETE FROM wks_filters;
DELETE FROM wks_cards;
DELETE FROM wks_retreats;
DELETE FROM wks_testimonials;

ALTER TABLE wks_hero         AUTO_INCREMENT = 1;
ALTER TABLE wks_intro        AUTO_INCREMENT = 1;
ALTER TABLE wks_filters      AUTO_INCREMENT = 1;
ALTER TABLE wks_cards        AUTO_INCREMENT = 1;
ALTER TABLE wks_retreats     AUTO_INCREMENT = 1;
ALTER TABLE wks_testimonials AUTO_INCREMENT = 1;


-- ============================================================
--  HERO
-- ============================================================
INSERT INTO wks_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Workshops & Retreats',
  'Immersive Learning &',
  'Dharmic Retreats',
  'Deep-dive workshops and residential retreats in Indian Knowledge Systems, Vedānta, and contemplative practice — designed for transformation, not just information.',
  'Workshops & Retreats'
);


-- ============================================================
--  INTRO BAND
-- ============================================================
INSERT INTO wks_intro (eyebrow, title, title_em, description, btn_label) VALUES (
  'Learning by Doing',
  'Workshops &',
  'Retreats',
  'Immersive, experiential learning programs that bring ancient wisdom into living practice — from one-day corporate workshops to five-day residential retreats. Every program is built on the principle of Anubhava — direct experience as the only true teacher.',
  'Book a Session'
);


-- ============================================================
--  FILTER BUTTONS
--  The "All Programs" button is always shown first by the frontend.
--  These are the remaining category filter buttons.
-- ============================================================
INSERT INTO wks_filters (key_name, label, sort_order) VALUES
  ('corporate',  'Corporate',      0),
  ('iks',        'IKS Education',  1),
  ('wellness',   'Wellness',       2),
  ('leadership', 'Leadership',     3),
  ('open',       'Open Enrolment', 4);


-- ============================================================
--  PROGRAM CARDS
-- ============================================================

-- Card 1 — Featured: IKS Certificate Course
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  1,
  'iks open',
  'ज्ञान',
  'Certificate Course',
  'IKS Education · Open Enrolment',
  '36-Hour Certificate Course on Indian Knowledge Systems',
  'A structured, faculty-led journey through the foundational frameworks of Indian Knowledge Systems — covering Vedānta, Yoga, Nyāya, Mīmāṃsā, Āyurveda, and Arthaśāstra. Designed for educators, professionals, and learners seeking substantive engagement with India''s intellectual heritage.',
  '[{"icon":"◎","text":"Online · Zoom"},{"icon":"◈","text":"36 Hours · 12 Sessions"},{"icon":"✦","text":"Cohort-based"},{"icon":"△","text":"Certificate on Completion"}]',
  'For Educators · Professionals · Researchers',
  'Register Now',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  0
);

-- Card 2 — Dharmic Creative Leadership
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  0,
  'corporate leadership',
  'धर्म',
  'Corporate',
  'Leadership · Strategy',
  'Dharmic Creative Leadership Framework',
  'A one-day intensive for senior leaders exploring Dharmic principles of creativity, decision-making, and organizational design. Using an elephant gun to shoot a sparrow is not just wasteful — it is a failure of Dharma.',
  '[{"icon":"◎","text":"On-site"},{"icon":"◈","text":"1 Day"},{"icon":"✦","text":"Max 25 Participants"}]',
  'For CXOs · Senior Leadership',
  'Enquire',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  1
);

-- Card 3 — Culture Redesign
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  0,
  'corporate leadership',
  'मन',
  'Workshop',
  'Strategy · Culture',
  'Organizational Culture Redesign Workshop',
  'Redesigning organizational culture and HR systems through mental model evaluation, alignment workshops, and learning system design — for lasting, values-driven transformation.',
  '[{"icon":"◎","text":"On-site · Bengaluru"},{"icon":"◈","text":"2–3 Days"},{"icon":"✦","text":"Custom-designed"}]',
  'For Leadership Teams · HR',
  'Enquire',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  2
);

-- Card 4 — Faculty Development
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  0,
  'iks open',
  'शिक्षा',
  'Faculty Dev.',
  'IKS · Universities',
  'Faculty Development Program — Integrating IKS in Academia',
  'Intensive workshops for university faculty on integrating IKS frameworks into pedagogy, research methodology, and curriculum design. Custom-designed per institution''s needs and discipline focus.',
  '[{"icon":"◎","text":"On-site or Online"},{"icon":"◈","text":"2–5 Days"},{"icon":"✦","text":"University-specific"}]',
  'For University Faculty · Deans',
  'Enquire',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  3
);

-- Card 5 — Wellness
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  0,
  'wellness open',
  'ॐ',
  'Wellness',
  'Creativity · Wellbeing',
  'Creativity Building & Corporate Wellness Program',
  'Creativity enhancement programs for CXOs and key leadership — grounded in Bhāratīya knowledge traditions — alongside the design and implementation of corporate wellness programs.',
  '[{"icon":"◎","text":"On-site · Customisable"},{"icon":"◈","text":"1–2 Days"},{"icon":"✦","text":"Max 20 Participants"}]',
  'For CXOs · Leadership Teams',
  'Enquire',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  4
);

-- Card 6 — Upadesha
INSERT INTO wks_cards
  (featured, cat_keys, glyph, format, tag, title, description, specs_json, audience, cta_label, url, sort_order)
VALUES (
  0,
  'open iks wellness',
  'संवाद',
  'Upadesha',
  'Open Enrolment · Multi-topic',
  'Upadesha Academy Immersive Workshops',
  'Experiential workshops led by top intellectuals in Business, Spirituality, Sanskrit, Wellness, Yoga, and Psychology — open to all. Each workshop offers deep, unhurried engagement with a specific field or idea.',
  '[{"icon":"◎","text":"Bengaluru · Online"},{"icon":"◈","text":"1–3 Days"},{"icon":"✦","text":"Open to All"}]',
  'Open to All',
  'View Programs',
  'https://vkulkarni-alchmi6.zohobookings.in/#/254745000000053002',
  5
);


-- ============================================================
--  RETREATS
-- ============================================================
INSERT INTO wks_retreats (numeral, title, sub, description, footer, sort_order) VALUES

('i.',
 'Dharmic Leadership Retreat',
 'For CXOs & Boards · 2–5 Days',
 'An immersive residential retreat blending strategy, organizational design, mental-model evaluation, and Dharmic enterprise principles. Held in carefully chosen natural settings — away from the noise of daily operations.',
 '2-to-5-day formats · Custom design per group',
 0),

('ii.',
 'IKS Deep-Dive Retreat',
 'Open Enrolment · 3 Days',
 'A three-day residential immersion into the foundational texts and frameworks of Indian Knowledge Systems — Vedānta, Yoga, and Dharmaśāstra — structured as an uninterrupted sādhanā of inquiry.',
 'Annual offering · Limited to 18 participants',
 1),

('iii.',
 'Team Vision & Strategy Retreat',
 'For Leadership Teams · 2–3 Days',
 'Combining vision alignment, strategy development, and Dharmic organizational design for leadership teams seeking both clarity of direction and depth of purpose. Small groups only — maximum intimacy and impact.',
 'Custom location · Max 12 participants',
 2);


-- ============================================================
--  TESTIMONIALS
-- ============================================================
INSERT INTO wks_testimonials (quote, name, role, sort_order) VALUES

('One of the best sessions till date. The dimensions it opened up. The mindset shift that happened today which made me take the road of going deeper into what sort of research are we doing. Today''s session made me question and also, to dig deeper into becoming someone who asks the right kind of questions. Thank you to the organizing team. Gratitude.',
 'Pragya',
 'Research Scholar, Central University of Gujarat',
 0),

('The case studies provided by Kulkarni sir gave an in-depth understanding of the need to preserve. I request Avnish sir if possible to conduct such lecture by Kulkarni sir once again. His insights are truly knowledgeable.',
 'Hardi',
 'Master Research Scholar, University of Mumbai',
 1),

('Vinay Kulkarni Ji''s lecture was highly practical. He explained very simply why and how digital documentation should be done in the context of IKS.',
 'Karuna Kumari Ram',
 'Research Scholar, Sido Kanhu Murmu University',
 2);
