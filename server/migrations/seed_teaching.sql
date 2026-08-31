-- ============================================================
--  Teaching Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_teaching.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
-- ============================================================

SET NAMES utf8mb4;

-- ── Clear existing data ───────────────────────────────────
DELETE FROM tch_hero;
DELETE FROM tch_stats;
DELETE FROM tch_history;
DELETE FROM tch_courses;
DELETE FROM tch_feedback;
DELETE FROM tch_themes;

-- Reset auto-increment counters
ALTER TABLE tch_hero     AUTO_INCREMENT = 1;
ALTER TABLE tch_stats    AUTO_INCREMENT = 1;
ALTER TABLE tch_history  AUTO_INCREMENT = 1;
ALTER TABLE tch_courses  AUTO_INCREMENT = 1;
ALTER TABLE tch_feedback AUTO_INCREMENT = 1;
ALTER TABLE tch_themes   AUTO_INCREMENT = 1;


-- ============================================================
--  HERO
-- ============================================================
INSERT INTO tch_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Academic Teaching',
  'Teaching &',
  'Faculty Work',
  'A record of university-level teaching engagements, faculty development programs, and course delivery — spanning Indian Knowledge Systems, leadership pedagogy, and civilizational education.',
  'Teaching'
);


-- ============================================================
--  STATS BAND
-- ============================================================
INSERT INTO tch_stats (num, label, sort_order) VALUES
  ('5+',    'Institutions',     0),
  ('500+',  'Students Reached', 1),
  ('4.6/5', 'Avg. Rating',      2);


-- ============================================================
--  TEACHING HISTORY
-- ============================================================

-- 1. JAIN University — Featured
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'Guest Faculty',
  'Jan 2026',
  'Bengaluru, India',
  'JAIN (Deemed-to-be-University)',
  1,
  '',
  '',
  '[{"val":"162","key":"Participants"},{"val":"4.62<small style=\\"font-size:1rem\\">/5</small>","key":"Avg. Rating"},{"val":"6","key":"Core Topics"}]',
  '[
    "Designed and delivered a multi-session course: <em>\\"Viewing the World Through Indian Knowledge Systems\\"</em> for 162 participants.",
    "Course covered foundational IKS concepts, epistemological frameworks, the Pañcakoṣa model, antaḥkaraṇa, Mokṣic Design, and contemporary relevance.",
    "Feedback highlights: <em>\\"thought-provoking,\\" \\"enriching and deep,\\" \\"innovative in its pedagogy,\\" \\"a wonderful lecture that provoked reflective thinking.\\"</em>"
  ]',
  '["IKS","Epistemology","Pañcakoṣa","Mokṣic Design","162 Participants","Avg. 4.62 / 5"]',
  0
);

-- 2. UGC – Savitri Bai Phule University
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'Guest Faculty',
  'Sep 2025 – Sep 2026',
  'Pune, India',
  'UGC – Savitri Bai Phule University',
  0,
  '',
  '',
  '[]',
  '[
    "Facilitated faculty development programs reaching educators from <strong>20 universities</strong>.",
    "Conducted two 90-minute workshops on Indian Knowledge Systems."
  ]',
  '["Faculty Development","IKS Workshops","20 Universities"]',
  1
);

-- 3. Nucleus of Learning — Accent
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'Guest Faculty',
  '2000',
  'Bengaluru, India',
  'Nucleus of Learning',
  0,
  'accent',
  '',
  '[]',
  '[
    "Developed and taught the session <em>\\"Āchāra Devo Bhava\\"</em> as part of the IKS Certificate Course.",
    "Produced comprehensive blog articles, e-books, and learning materials from session content."
  ]',
  '["IKS Certificate Course","Āchāra Devo Bhava","Content Production"]',
  2
);

-- 4. Siddhanta Knowledge Foundation — Gold
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'Researcher / Author',
  'Jan 2024 – Jan 2025',
  'Bengaluru, India',
  'Siddhanta Knowledge Foundation',
  0,
  'gold',
  'Contributed to designing IKS-based BBA and MBA curricula as part of a curriculum design committee — integrating Dharmic frameworks into modern business education programs.',
  '[]',
  '[]',
  '["Curriculum Design","BBA · MBA","IKS Integration"]',
  3
);

-- 5. University of Arizona
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'MS Student · Presenter',
  'Oct 2000 – Aug 2002',
  'Tucson, United States',
  'University of Arizona',
  0,
  '',
  '',
  '[]',
  '[
    "<em>Presented to Faculty Panel, Tucson, AZ (2002).</em>",
    "Title: <em>\\"Systems Thinking, Mental Models, Teaching &amp; Learning.\\"</em>",
    "Explored the intersection of systems engineering methodology with cognitive learning frameworks."
  ]',
  '["Systems Thinking","Mental Models","Faculty Presentation"]',
  4
);

-- 6. Rashtram / Rishihood — Accent
INSERT INTO tch_history
  (role, period, location, org, featured, variant, plain, stats_json, bullets_json, tags_json, sort_order)
VALUES (
  'Workshop Facilitator',
  'Jun 2 – 4, 2022',
  'India',
  'Rashtram School of Public Leadership, Rishihood University',
  0,
  'accent',
  '',
  '[]',
  '[
    "Term III elective workshop — <em>Personal Leadership Framework &amp; Roadmap.</em>",
    "Delivered over 3 days (5 hours each) for a total of <strong>15 contact hours</strong>.",
    "Awarded <strong>1 academic credit</strong> upon completion.",
    "Mode: immersive in-person workshop format."
  ]',
  '["Leadership","Personal Framework","1 Credit","15 Hours","Term III"]',
  5
);


-- ============================================================
--  COURSE REPORTS
-- ============================================================

-- Course 1: Viewing the World Through Indian Knowledge Systems
INSERT INTO tch_courses
  (tag, title, subtitle, date_text, location_text, rating, rating_label, pull_quote, pq_attr, specs_json, paragraphs_json, sort_order)
VALUES (
  'IKS · Guest Faculty · JAIN University',
  'Viewing the World Through Indian Knowledge Systems',
  'From Ancient Wisdom to Living Ways of Seeing, Being, and Healing',
  'January 24, 2026\nBengaluru, India',
  'Bengaluru, India',
  '4.62',
  'Average Participant Rating',
  '"What if everything we thought we knew about success, progress, happiness, and even health was built upon borrowed assumptions — mental constructs we never consciously chose? This is not a philosophical exercise. This is the ground beneath our feet."',
  '— Vinay Kulkarni, Opening of the Course',
  '[
    {"val":"162",  "key":"Participants"},
    {"val":"4.62", "key":"Avg. Rating / 5"},
    {"val":"6",    "key":"Core Topics"},
    {"val":"JAIN", "key":"Institution"}
  ]',
  '[
    {"text":"The Bhāratīya worldview rests upon a sophisticated understanding of reality that cannot be reduced to religious belief or cultural practice. Where modern frameworks separate the secular from the sacred, the material from the spiritual, Dharmic thinking recognizes these as inseparable dimensions of a unified whole.","highlight":false},
    {"text":"Dharma is not religion in the Western sense — it is the cosmic law that governs all existence, from the movement of galaxies to the beating of a human heart. Our current sustainability crisis has a simple diagnosis: the whole world began operating in the Artha-Kāma plane and forgot Dharma — the harmonizing principle — and Mokṣa — the liberating principle.","highlight":false},
    {"text":"The Pañcakoṣa model reveals something breathtaking about our ancestors — every aspect of traditional life, from the food we ate to the temples we built to the cities we designed, was carefully crafted so that even the most ordinary person, going about the most ordinary tasks, was being slowly moved from the Annamaya toward the Ānandamaya koṣa. Day by day. Hour by hour. Task by task.","highlight":true},
    {"text":"The world does not need more solutions generated from the same consciousness that created our current crises. It needs transformed minds — visions clarified, hearts purified. The ancient wisdom awaits. It has always been here.","highlight":false}
  ]',
  0
);

-- Course 2: From Documentation to Darśana
INSERT INTO tch_courses
  (tag, title, subtitle, date_text, location_text, rating, rating_label, pull_quote, pq_attr, specs_json, paragraphs_json, sort_order)
VALUES (
  'IKS · Guest Lecture · Faculty Development Program',
  'From Documentation to Darśana',
  'Digital Tools and the Future of Indian Knowledge Systems',
  'May 26, 2026\nOnline / National',
  'Online / National',
  '5',
  'Majority Rating',
  '"Preservation is the easy part. The real task is learning to ask the right questions of our own inheritance."',
  '— Vinay Kulkarni, Session Thesis',
  '[]',
  '[
    {"text":"This lecture — delivered to research scholars and assistant professors from universities across India — addressed the intersection of digital documentation tools and the epistemological frameworks of Indian Knowledge Systems. The session moved beyond archival preservation toward the deeper question of Darśana: how do we not merely store knowledge, but learn to see through it?","highlight":false},
    {"text":"The session drew strong participant endorsements from scholars at Central University of Gujarat, University of Mumbai, CHRIST University, Panjab University Chandigarh, Jain University, and many others — with multiple participants requesting follow-up sessions and resource sharing.","highlight":false}
  ]',
  1
);


-- ============================================================
--  STUDENT FEEDBACK
-- ============================================================
INSERT INTO tch_feedback (stars, text, name, institution, av_class, sort_order) VALUES

(5,
 'For years, I searched for a worldview that would make my work and my life one continuous act of creation. The inner blockages were real — patterns of withdrawal, unprocessed karmas, a tendency to blame the world rather than look inward. What the Leadership Fundamentals Programme gave me was a pathway through that terrain, step by step, in a language I could actually understand. And what my classmates gave me was something I did not expect to find in a classroom: the raw, transformative power of other people\'s stories. I leave with a support system that feels like family.',
 'Simran',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-a', 0),

(5,
 'As a year-long programme drew to its close, Shri Vinay Kulkarni ji used these three days to take us somewhere we had not been. The buddy exercise, the shared life stories, the Life Review Dhyāna meditation — each one reached somewhere new. But it was the lunch table session that I will carry longest: the moment an entire cohort turned to one another and named what was good in each person. I was in tears. So were they. These were pure tears — of gratitude, of recognition, of the astonishing discovery that people had been quietly moved by things I had done without even knowing. I leave a lighter person.',
 'Dhavan Jahagirdar',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-b', 1),

(5,
 'The sessions began with a question: what is holding you back? My answer was the mismanagement of energy within me. Over three days, Shri Vinay Kulkarni ji gave that answer its full depth. The meditation revealed years of accumulated grief I had not known was there. I wept. And in the clearing that followed, I could see — for the first time — a roadmap for the life I actually want to build. What I also witnessed was a teacher who put his phone away on day one and did not pick it up again. For four full days of teaching, I never saw it in his hand once. That kind of dedication teaches without words.',
 'PrasadRaje Bhopale',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-c', 2),

(5,
 'In three days, Shri Vinay Kulkarni ji asked us one question that opened everything: how will you create an impact within a 1-kilometre radius of where you stand? It is the smallest possible canvas — and the right place to begin. The Life Review Jnāna meditation made me feel lighter in a way I had not experienced in years. And a seed planted long ago — the belief that my memory was poor — was finally uprooted. I had programmed that belief without knowing it. I leave with a new understanding of what is possible when the stories we carry about ourselves are examined honestly.',
 'Padamraj Shetty',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-d', 3),

(5,
 'The Johari Window framework describes four quadrants of the self: what is known to both self and others, what is hidden from others, what others see but the self cannot, and what is unknown to everyone. The three-day immersive experience with Shri Vinay Kulkarni ji was where I watched all four of those quadrants shift. I am, by temperament, deeply reserved — a listener who holds his inner world carefully. In this programme, for the first time, I opened without force. The group held that opening with care. I leave with a clearer sense of what I am working toward: to become an authority in education and jurisprudence, anchored by a daily Dināchāryā of japa, study, and writing.',
 'Anshuman',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-a', 4),

(5,
 'The Turiya meditation was where things became clear. Contemplating the present reality of my life across every dimension — professional, familial, spiritual, financial, physical — and then manifesting it as it ought to be, something crystallized. Three words: Education, Policy, Ecology. One idea beneath them all: Dharma. The childhood traumas that had been quietly holding me back were named, examined, and released over three days. What emerged in their place was not a vague aspiration but a life script — the kind a person writes with full intention and returns to as a compass.',
 'Sushant Chandrashekhar Gangoli',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-b', 5),

(5,
 'I joined Rashtram knowing something was obstructing me, but without a language for what it was. The concept of memory — the way life experiences accumulate and slow a person down, the way unprocessed grief settles into the body and misdirects its energy — had been introduced in earlier sessions. Shri Vinay Kulkarni ji completed that understanding. The Life Reviewdhyāna was one of the most significant experiences of my life. It gave me access to my own life cycle and the clarity to see what I had been missing. I leave with a Dināchāryā built around my goals and the conviction that daily discipline is the only honest answer to the distance between where I am and where I want to be.',
 'Nikhil Shirish More',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-c', 6),

(5,
 'After my second internship, I had drifted. The Dināchāryā that had once grounded my mornings — the early rising, the prayer, the unhurried movement into each day — had quietly come apart. The Leadership Fundamentals Programme was, in the most precise sense, a return. Shri Vinay Kulkarni ji\'s sessions reminded me of my script: a life that moves from creative work in media and film, to the intellectual platform of \'Scholar with Somu,\' to a final chapter of philosophical writing and wandering in the spirit of a Jaṅgama Purohita. That script was always there. What I needed was a guide who would remind me it belonged to me.',
 'Someshwar Gurumath',
 'Leadership Fundamentals Programme  |  Rashtram School of Public Leadership, Rishihood University',
 'av-d', 7);


-- ============================================================
--  CORE TEACHING THEMES
-- ============================================================
INSERT INTO tch_themes (glyph, title, description, sort_order) VALUES

('धर्म',
 'Dharma as Cosmic Framework',
 'Presenting Dharma not as religious doctrine but as the underlying principle of cosmic order — applicable to governance, economics, education, and personal life.',
 0),

('ज्ञान',
 'Indian Epistemology & IKS',
 'The epistemological foundations of Bhāratīya thought — Pramāṇa, Nyāya, the Pañcakoṣa model — and their application in contemporary education and research.',
 1),

('दर्शन',
 'From Documentation to Darśana',
 'Digital tools for IKS preservation, archival methodology, and the transition from mechanical documentation to genuine Darśana — seeing through the tradition.',
 2),

('मन',
 'Systems Thinking & Mental Models',
 'Drawing on both Western systems engineering and Bhāratīya cognitive frameworks to design more integrated, consciousness-aware approaches to learning and leadership.',
 3),

('शिक्षा',
 'Svabhāva-Based Education',
 'Curriculum design rooted in the learner\'s innate nature (Svabhāva) and duty (Svadharma) — a civilizationally grounded alternative to one-size-fits-all pedagogy.',
 4),

('संस्कृति',
 'Civilizational Consciousness',
 'Examining how Bhāratīya civilizational design — from architecture to food to festival — was a continuous system for elevating human consciousness toward Mokṣa.',
 5);
