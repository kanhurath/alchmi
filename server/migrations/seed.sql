-- ============================================================
-- Seed data — Biography page (mirrors current static content)
-- Run AFTER schema.sql:  mysql -u root vkulkarni-react < seed.sql
-- ============================================================

/*!40101 SET NAMES utf8mb4 */;

USE `vkulkarni-react`;

-- ── Hero ─────────────────────────────────────────────────────────────────────
TRUNCATE TABLE bio_hero;
INSERT INTO bio_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES
(
  'Biography',
  'Vinay P.',
  'Kulkarni',
  'Entrepreneur · Dharmic Innovator · Advocate for Indian Knowledge Systems',
  'Biography'
);

-- ── Profile ──────────────────────────────────────────────────────────────────
TRUNCATE TABLE bio_profile;
INSERT INTO bio_profile (name, tagline, quote, para1, para2, linkedin_url, twitter_handle, twitter_url) VALUES
(
  'Vinay P. Kulkarni',
  'Entrepreneur · Dharmic Innovator · E-commerce Strategist · IKS Advocate',
  'Education is not merely the transfer of knowledge or acquisition of skills; it is a transformative process that strives to create individuals whose minds and bodies are nourished, nurtured, and elevated by the greatest wisdom known to humanity. True education aligns with one''s Svabhava (innate nature) and Svadharma (individual duty) and equips the individual to pursue the highest goals of human life as envisioned by his or her civilization!',
  'Vinay Kulkarni, Founder & CEO of ALCHMI (Management Consulting) and e-Com Elephant (E-commerce Tech), is a seasoned management consultant and CXO with over 25 years of global experience in strategy, marketing, and e-commerce. With a BE in Mechanical Engineering from the University of Mysore, an MS in Systems & Industrial Engineering and an MBA in Strategy & Marketing — both from the University of Arizona — Vinay combines deep technical expertise with rare strategic acumen.',
  'A "business alchemist," he leads transformative programs that foster clarity, growth, and innovation. His expertise spans business strategy, curriculum design, organizational transformation, and meditative self-discovery, using immersive learning methods. Deeply passionate about research and applications of Indian Knowledge Systems (IKS), Vinay is pioneering innovative pedagogies for IKS-based education and developing Dharmic Management Frameworks. Based in Bengaluru, he bridges tradition and modernity, empowering leaders to design impactful futures.',
  'https://www.linkedin.com/in/vinkulkarni/',
  '@aatmavalokana',
  'https://x.com/aatmavalokana'
);

-- ── Engage Intro ─────────────────────────────────────────────────────────────
TRUNCATE TABLE bio_engage_intro;
INSERT INTO bio_engage_intro (section_label, title, title_em, description) VALUES
(
  'Speaking & Facilitation',
  'How Vinay',
  'Engages',
  'From keynote stages to intimate retreat settings — Vinay brings depth, precision, and Dharmic grounding to every engagement.'
);

-- ── Engage Cards ─────────────────────────────────────────────────────────────
-- Venues are children; must truncate in correct order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bio_engage_venues;
TRUNCATE TABLE bio_engage_cards;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO bio_engage_cards (sort_order, num_label, category, title, slug, content_label, count_number, count_label) VALUES
(1, '01', 'Speaking',          'Talks & Keynotes',        '/speaking/talks',              'Featured Venues & Events',   '10+', 'Talks & Keynotes'),
(2, '02', 'Facilitation',      'Workshops & Retreats',    '/speaking/workshops-retreats', 'Featured Venues & Programs', '7+',  'Workshops & Retreats'),
(3, '03', 'Panels & Honour',   'Panels & Chief Guest',    '/speaking/panels',             'Featured Appearances',       '5+',  'Panels & Chief Guest');

-- Venues for Card 1 — Talks & Keynotes (sort_order matches insertion order in BiographyPage.jsx)
INSERT INTO bio_engage_venues (card_id, venue_text, sort_order)
SELECT id, v, idx FROM bio_engage_cards c
JOIN (
  SELECT 1 AS idx, 'IIT Kanpur — ''Code, Consciousness and Responsibility''' AS v UNION ALL
  SELECT 2, 'NIE ICST 2025 Keynote' UNION ALL
  SELECT 3, 'Indus Business Academy' UNION ALL
  SELECT 4, 'ReTHINK INDIA Integral Education Keynote' UNION ALL
  SELECT 5, 'Cultural Integration Fellowship, San Francisco' UNION ALL
  SELECT 6, 'CESS Talk Series' UNION ALL
  SELECT 7, 'Global Chamber Globinar' UNION ALL
  SELECT 8, 'TMU Moradabad' UNION ALL
  SELECT 9, 'Upadesha Keynote — ''The Sacred Symphony''' UNION ALL
  SELECT 10, 'RV College — Swami Vivekananda'
) venues ON 1=1
WHERE c.num_label = '01';

-- Venues for Card 2 — Workshops & Retreats
INSERT INTO bio_engage_venues (card_id, venue_text, sort_order)
SELECT id, v, idx FROM bio_engage_cards c
JOIN (
  SELECT 1 AS idx, 'INDICA Yoga — ''Ritambhara'' Retreat' AS v UNION ALL
  SELECT 2, 'Cosmic Medicine / Meditation — Jayadeva Institute' UNION ALL
  SELECT 3, 'Narayana Hrudayalaya' UNION ALL
  SELECT 4, 'Apollo Hospitals' UNION ALL
  SELECT 5, 'BBMP — 100 Doctors Workshop' UNION ALL
  SELECT 6, 'US Advanced Medical Research' UNION ALL
  SELECT 7, 'Hylunia Wellness MD Spa'
) venues ON 1=1
WHERE c.num_label = '02';

-- Venues for Card 3 — Panels & Chief Guest
INSERT INTO bio_engage_venues (card_id, venue_text, sort_order)
SELECT id, v, idx FROM bio_engage_cards c
JOIN (
  SELECT 1 AS idx, 'PARAM Foundation Panel' AS v UNION ALL
  SELECT 2, 'Zista 3E4I Panel' UNION ALL
  SELECT 3, 'New Horizon College Panel' UNION ALL
  SELECT 4, 'MES Institute — Chief Guest' UNION ALL
  SELECT 5, 'RV College — Chief Guest'
) venues ON 1=1
WHERE c.num_label = '03';

-- ── Ventures ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE bio_ventures;
INSERT INTO bio_ventures (sort_order, designation, name, type, description, link_url, link_label) VALUES
(1, 'Founder & CEO',      'ALCHMI',               'Strategy / Management Consulting',
 'A management consulting firm specialising in business strategy, brand development, and transformative leadership programs that blend modern methodology with Dharmic principles.',
 'https://www.alchmi.com', 'Visit alchmi.com'),

(2, 'Founder & CEO',      'e-Com Elephant',        'E-commerce · Web Design · Tech Services',
 'E-commerce business creation and management, web design and development, and technology services for brands seeking digital transformation.',
 'https://www.ecomelephant.com', 'Visit ecomelephant.com'),

(3, 'Founder & CEO',      'Sanathani',             'Indic Merchandise · Online Store',
 'An online Indic merchandise store curating products rooted in Bhāratīya culture, tradition, and artisanship.',
 'https://sanathani.com', 'Visit sanathani.com'),

(4, 'Founder',            'Sanskritishaala',       'Cultural Education · Workshops',
 'Cultural education for kids, parents, and adults through workshops that bring alive the richness of Bhāratīya civilisation and the Sanskrit language.',
 'https://www.sanskritishaala.com', 'Visit sanskritishaala.com'),

(5, 'Founder & Director', 'Upadesha Academy',      'Immersive Workshops · Team Retreats',
 'Hosts immersive, experiential workshops led by top intellectuals in fields like Business, Spirituality, Sanskrit, Wellness, Yoga, Psychology, and more.',
 NULL, NULL),

(6, 'Founder & Director', 'Shastra Research Labs', 'Research · Indian Knowledge Systems',
 'A research initiative conducting innovative experiments to explore and validate concepts from the Vedas, Upanishads, Puranas, and Arthashastra.',
 NULL, NULL);
