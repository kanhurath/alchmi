-- ============================================================
--  Testimonials Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_testimonials.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
-- ============================================================

SET NAMES utf8mb4;

DELETE FROM tst_hero;
DELETE FROM tst_filters;
DELETE FROM tst_featured;
DELETE FROM tst_cards;
DELETE FROM tst_stats;
DELETE FROM tst_pull_quotes;

ALTER TABLE tst_hero        AUTO_INCREMENT = 1;
ALTER TABLE tst_filters     AUTO_INCREMENT = 1;
ALTER TABLE tst_featured    AUTO_INCREMENT = 1;
ALTER TABLE tst_cards       AUTO_INCREMENT = 1;
ALTER TABLE tst_stats       AUTO_INCREMENT = 1;
ALTER TABLE tst_pull_quotes AUTO_INCREMENT = 1;


-- ── HERO ──────────────────────────────────────────────────────────────────────
INSERT INTO tst_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Community',
  'Words of',
  'Gratitude',
  'Reflections from students, entrepreneurs, educators, and seekers who have engaged with Vinay Ji''s work across workshops, talks, and coaching.',
  'Testimonials'
);


-- ── FILTER BUTTONS ────────────────────────────────────────────────────────────
INSERT INTO tst_filters (key_name, label, sort_order) VALUES
  ('iks',       'IKS Course', 0),
  ('corporate', 'Corporate',  1),
  ('retreat',   'Retreats',   2),
  ('upadesha',  'Upadesha',   3),
  ('coaching',  'Coaching',   4);


-- ── FEATURED QUOTE ────────────────────────────────────────────────────────────
INSERT INTO tst_featured (quote, author, role, program) VALUES (
  'The IKS Certificate Course completely shifted how I understand my own discipline. Vinay Ji''s ability to translate ancient frameworks into contemporary practice is unlike anything I had encountered in twenty years of academic work.',
  'Dr. Priya Sharma',
  'Associate Professor of Philosophy · Bengaluru',
  'IKS Certificate Course — Cohort 3'
);


-- ── TESTIMONIAL CARDS ─────────────────────────────────────────────────────────
INSERT INTO tst_cards (cat_keys, large, avatar, text, author, role, program, sort_order) VALUES

('corporate', 0, 'C',
 'Vinay is an energetic and dynamic Executive with a high sense of urgency. He is meticulous as he uncovers the issues and moves just as thoroughly in developing an action plan, making sure to collaborate with those involved. He has a high level of integrity and authenticity. As a business partner he is fair and objective and able to grasp complicated subjects quickly. His humor and personal approach work to put his teams at ease for the best results. A quality leader!',
 'Christine Helin', 'Vice-President · Lovitt & Touché, a Marsh & McLennan Agency LLC Company', '', 0),

('corporate', 1, 'J',
 'I had the good fortune of reporting to Vinay in his role as Chief Operating Officer for Horizon Moving Systems. Vinay has led the company through a tumultuous economy which greatly impacted the moving and transportation industry. He set a new direction for the company, differentiating Horizon as one of the most innovative moving companies around with cutting edge technology and truly professional services. In addition to being a brilliant person, Vinay leads selflessly and with unmatched dedication.',
 'James Pedicone', 'Partner and ex-CoS · Design Pickle', 'Corporate Workshop', 1),

('corporate upadesha', 0, 'T',
 'The excellent feedback from Swedish customers referred to Horizon Moving Systems provided a very good reason to meet Mr. Kulkarni, COO, in person in 2011. His valuable perspective and input for improvements to the executive strategy for SACCarizona.org has proven valuable for our continued expansion. His energy and high level performance is impressive.',
 'Tobias Lofstrand', 'Global Envoy Sweden at GPEC, Board Member SACC Arizona, Founder Saleby Lin & Malt, Sweden', 'Upadesha Academy', 2),

('corporate', 0, 'J',
 'I have had the privilege of working with Vinay in our BCA organization in developing relationships with like titled business leaders and through that experience came to know of Vinay''s vast experience in leadership and his uncanny ability to create a bottom-up and collaborative business culture within his own organization.',
 'Jim Perrine', 'CEO/President · Business Clubs America', '', 3),

('retreat', 1, 'P',
 'My experience with Vinay as the Chief Operating Officer for Horizon Moving System was impressive in many ways. He displays strong leadership, creative thinking and is very decisive. His high degree of expertise in managing, operating and marketing has led the company to the right direction in this economically challenging period.',
 'Petcharat Mon', 'Assistant Controller · Suddath Relocation Systems', '', 4),

('coaching', 0, 'L',
 'Vinay is a transformational leader who brings tremendous energy, passion and enthusiasm to any position. He successfully accomplishes what he sets out to do by utilizing a ''systems approach'' to business. He clearly understands that the purpose of a business is to create a customer and he deeply cares about customers. I highly recommend Vinay to anyone looking to work with a consummate professional.',
 'Larry Aldrich', 'Entrepreneur, Philosopher (Amateur) · Mentor Aldrich Capital Company', '', 5),

('iks', 0, 'D',
 'Vinay is a thoughtful, strategic and hands-on executive who rolls up his sleeves and gets the job done. He thinks in terms of process and measurements, and how to continually improve results. Vinay is particularly recommended for roles that require business strategy, planning and execution.',
 'Doug Bruhnke', 'CEO/Founder at Global Chamber® · Global Chamber', '', 6),

('iks corporate', 0, 'B',
 'Vinay is a highly motivated individual who has shouldered and mastered many business challenges during his time with our company. He has contributed substantial value during his tenure and has always acted with integrity and a focus on results that are in the best interests of Horizon and its employees.',
 'Bruce Dusenberry', 'President & CEO · Horizon Moving Systems, LLC', '', 7),

('retreat corporate', 0, 'J',
 'Vinay is a visionary leader with strong organizational skills. He is well-networked, intelligent and professional. I have enjoyed working with Vinay and hope to do so again.',
 'John Ficorilli', 'Metals Recycling', '', 8),

('upadesha', 0, 'E',
 'Vinay is an experienced and capable business consultant. Vinay not only helped us decide on a particular vendor but added considerable value by leading us through a process to better understand the particular needs for such a system in our organization. He was thorough, professional, accessible and I will not hesitate to utilize him in the future.',
 'E. LaBrent Chrite', 'President at Bentley University · Bentley University', '', 9),

('coaching', 0, 'S',
 'Vinay is a solutions-oriented professional. He has the ability to see situations from a holistic approach, both as a visionary and strategist. He is very bright and always full of ideas and thoughtful perspective that brings possibility to any situation.',
 'Suzanne McFarlina', 'Strategic | Maximizer | Positivity · Executive Leadership Coach', '', 10),

('iks', 0, 'L',
 'Vinay''s intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor. If you have a need for your company to grow, then Vinay can help you take your company to a higher level.',
 'Leamon Crooms', 'Founder | SEO Strategist · Strategic Growth Advisors, LLC', '', 11);


-- ── STATS ─────────────────────────────────────────────────────────────────────
INSERT INTO tst_stats (number, suffix, label, description, sort_order) VALUES
  ('500', '+', 'Participants Trained',    'Across all programs',             0),
  ('4',   '',  'IKS Certificate Cohorts', 'Since 2025',                      1),
  ('15',  '+', 'Organisations Served',    'Universities, corporates & NGOs', 2),
  ('5',   '★', 'Average Rating',          'Across all programs',             3);


-- ── PULL QUOTES ───────────────────────────────────────────────────────────────
INSERT INTO tst_pull_quotes (program, avatar, text, author, role, sort_order) VALUES

('IKS Course', 'P',
 '"One of the best sessions till date. The dimensions it opened up. The mindset shift that happened today which made me take the road of going deeper into what sort of research are we doing. Today''s session made me question and also, to dig deeper into becoming someone who asks the right kind of questions. Thank you to the organizing team. Gratitude."',
 'Research Scholar', 'Central University of Gujarat · Gujarat', 0),

('Leadership Retreat', 'H',
 '"The case studies provided by Kulkarni sir gave an in-depth understanding of the need to preserve. I request Avnish sir if possible to conduct such lecture by Kulkarni sir once again. His insights are truly knowledgeable."',
 'Hardi', 'Master Research Scholar · University of Mumbai · Mumbai', 1),

('Upadesha Workshop', 'K',
 '"Vinay Kulkarni Ji''s lecture was highly practical. He explained very simply why and how digital documentation should be done in the context of IKS."',
 'Karuna Kumari Ram', 'Research Scholar · Sido Kanhu Murmu University', 2),

('Coaching', 'L',
 '"Vinay''s intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor. If you have a need for your company to grow, then Vinay can help you take your company to a higher level."',
 'Leamon Crooms', 'Founder | SEO Strategist · Strategic Growth Advisors, LLC', 3);
