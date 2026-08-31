-- ============================================================
-- Seed: Home page — mirrors current static content exactly
-- Run AFTER schema_home.sql:
--   mysql -u root vkulkarni-react < seed_home.sql
-- ============================================================

/*!40101 SET NAMES utf8mb4 */;

USE `vkulkarni-react`;

-- ── Hero ─────────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_hero;
INSERT INTO home_hero
  (mantra, eyebrow, title_line1, title_em, title_line3, subtitle, cta1_text, cta1_link, cta2_text, cta2_link)
VALUES (
  'Om saha naavavatu . saha nau bhunaktu . saha veeryam karavaavahai .\nTejasvee naavadheetamastu maa vidvishaavahai .',
  'Entrepreneur . Thinker . Educator',
  'The Eternal',
  'Classroom',
  'of Life',
  'Weaving Dharma, Indian Knowledge Systems, and the ancient wisdom of Bharata into the living fabric of modern life.',
  'Explore Articles',
  '#articles',
  'About Vinay',
  '#about'
);

-- ── Marquee ──────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_marquee_items;
INSERT INTO home_marquee_items (item_text, sort_order) VALUES
  ('Dharma',                   1),
  ('Education',                2),
  ('Indian Knowledge Systems', 3),
  ('Vedanta',                  4),
  ('Entrepreneurship',         5),
  ('Psychology',               6),
  ('Samskrita',                7),
  ('Nation Building',          8);

-- ── About ────────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_about;
INSERT INTO home_about (heading1, heading_em, heading2, bio, quote, media_url, journey_btn_text, journey_pdf_url) VALUES (
  'Thinker.',
  'Teacher.',
  'Entrepreneur.',
  'Vinay Kulkarni brings over 25 years of global experience in business management and wellness as an entrepreneur, advisor, educator, and marketer. His focus spans business transformation and the meaningful integration of Dharmic principles into organizational practice. He created the Dharmic Enterprise Framework, a model that helps organizations align profit with purpose and evolve as Dharmic enterprises. In Bengaluru, he established a cultural center housing The Upadesha Academy (IKS based workshops & retreats), Darshana Books & Gifts (Indic), and Samvada Bistro where he explores his passion for fusion cuisine blending traditional Indian and international flavors alongside ventures including ALCHMI, Sanskritishaala (cultural workshops for children & youth), and Sanathani.com (Indic merchandise). Through this ecosystem, he works to embed Dharmic principles across business, education, and governance.',
  'Education is not merely the transfer of knowledge or acquisition of skills; it is a transformative process that aligns with one''s Svabhava and Svadharma.',
  '',
  'Explore Vinay''s Journey',
  ''
);

TRUNCATE TABLE home_about_tags;
INSERT INTO home_about_tags (tag_text, sort_order) VALUES
  ('Dharmic Innovation', 1),
  ('IKS',               2),
  ('Vedanta',           3),
  ('E-commerce Strategy', 4),
  ('Meditation',        5),
  ('Philosophy',        6),
  ('Nation Building',   7),
  ('Psychology',        8);

-- ── Articles ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_articles;
INSERT INTO home_articles (featured, category, title, excerpt, pub_date, url, image_url, sort_order) VALUES
(
  1,
  'Samskrita . Nation Building',
  'Repositioning Sanskrit for India''s Next Civilizational Chapter',
  'Samskrta is not merely a language - it is the very grammar of consciousness, the scaffolding of a civilization that never separated knowing from being.',
  'May 23, 2026',
  'http://localhost:3001/blog/2026/05/23/sa%e1%b9%83sk%e1%b9%9bta-is-not-merely-a-language/',
  NULL,
  1
),
(
  0,
  'Education . Vedanta',
  'Vedanta in Education - Or Is Vedanta Itself Education?',
  'Reflecting on a panel discussion that became a churning of minds around what it truly means to educate a human being.',
  'May 17, 2026',
  'http://localhost:3001/blog/2026/05/17/vedanta-in-education-or-is-vedanta-itself-education/',
  NULL,
  2
),
(
  0,
  'Dharma . Education',
  'The Eight-Second Mind',
  'The average human attention span has collapsed from twelve seconds to eight - and what five quiet days of Bharatiya cultural education might give back.',
  'May 2, 2026',
  'http://localhost:3001/blog/2026/05/02/the-eight-second-mind/',
  NULL,
  3
),
(
  0,
  'Dharmic Innovation',
  'The Great Inversion',
  'Why sustainable lifestyles must come before sustainable products - a case for Dharmic Innovation.',
  'May 1, 2026',
  'http://localhost:3001/blog/2026/05/01/the-great-inversion/',
  NULL,
  4
),
(
  0,
  'Dharma . Spirituality',
  'Jala-Brahma: The Sacred Intelligence of Water',
  'A contemplation on the seven streams within, beginning where the Rgveda begins - in the primordial waters before creation.',
  'April 23, 2026',
  'http://localhost:3001/blog/2026/04/23/jala-brahma-the-sacred-intelligence-of-water/',
  NULL,
  5
);

-- ── Themes ───────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_themes;
INSERT INTO home_themes (theme_key, devanagari, name, description, count, sort_order) VALUES
(
  'dharma',
  'Dharma',
  'Dharma',
  'Exploring the foundational principle that sustains cosmos, society, and the individual - across innovation, economics, and daily life.',
  12, 1
),
(
  'iks',
  'Jnana',
  'Indian Knowledge Systems',
  'Mainstreaming the depth of Bharatiya intellectual heritage - from Vedanta and Yoga to Nyaya and Samkhya - into modern education and research.',
  18, 2
),
(
  'education',
  'Shiksha',
  'Education',
  'What does it mean to truly educate a human being? Examining pedagogy, Svadharma, and the purpose of learning in a civilization rediscovering itself.',
  15, 3
),
(
  'psychology',
  'Mana',
  'Psychology & Self',
  'The inner journey of self-discovery through the lenses of ancient wisdom, modern neuroscience, meditation, and the science of the mind.',
  10, 4
);

-- ── Quote ─────────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_quote;
INSERT INTO home_quote (quote_text, quote_attr, quote_mark_url, ornament_url) VALUES (
  'Om, may the teacher and student move together in learning, relish the process, perform with vigor and focus, attain brilliance in understanding without hostility, and be surrounded by peace, peace, peace.',
  'Taittiriya Upanisad - Shanti Patha',
  'http://localhost:3001/wp-content/uploads/2026/06/Taittiriya-Upani%E1%B9%A3ad-Quote-Top-01_VK-2.png',
  'http://localhost:3001/wp-content/uploads/2026/06/Taittiriya-Upani%E1%B9%A3ad-Divider-Bottom-01_VK-2.png'
);

-- ── Talks ─────────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_talks;
INSERT INTO home_talks (label, title, youtube_id, thumb_url, sort_order) VALUES
(
  'Panel Discussion',
  'Code, Consciousness and Responsibility: Mind, AI & Dharmic Design | AI & IKS | Shri Vinay Kulkarni',
  'G3rH4FztvYQ',
  NULL,
  1
),
(
  'Lecture',
  'In Search Of The Real India | Vinay Kulkarni',
  'lijINSuDl2Q',
  NULL,
  2
),
(
  'Keynote',
  'Indian Knowledge Systems (IKS) as a Framework for Modern Education and Research',
  'NuKMqG8X4JQ',
  NULL,
  3
);

-- ── Connect ───────────────────────────────────────────────────────────────────
TRUNCATE TABLE home_connect;
INSERT INTO home_connect (description) VALUES (
  'Whether you seek to collaborate, explore ideas, or embark on a learning journey - Vinay welcomes thoughtful dialogue rooted in genuine inquiry.'
);

TRUNCATE TABLE home_connect_links;
INSERT INTO home_connect_links (href, icon, label, sort_order) VALUES
  ('https://www.linkedin.com/in/vinkulkarni/', 'in', 'LinkedIn',                1),
  ('https://x.com/aatmavalokana',              'X',  '@aatmavalokana',          2),
  ('https://zcmp.in/xO0w',                     'e',  'Subscribe to Newsletter', 3);
