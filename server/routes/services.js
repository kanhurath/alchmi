const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

// ── Upload setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'services');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, `icon-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// ── Table setup ───────────────────────────────────────────────────────────────

async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS services_hero (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eyebrow    VARCHAR(200) DEFAULT 'Services',
      title      VARCHAR(300) DEFAULT 'What We',
      title_em   VARCHAR(300) DEFAULT 'Offer',
      subtitle   TEXT,
      breadcrumb VARCHAR(200) DEFAULT 'Services'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services_cards (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(300) NOT NULL,
      description  TEXT,
      discuss_link VARCHAR(500) DEFAULT '#',
      icon_type    ENUM('none','image','svg') DEFAULT 'none',
      icon_url     VARCHAR(1000) DEFAULT '',
      icon_svg     LONGTEXT,
      sort_order   INT DEFAULT 0,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services_content (
      section  VARCHAR(50) PRIMARY KEY,
      data     LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const CARD_DEFAULTS = [
  { title: 'Leadership Development',      description: 'Develop leaders who think in systems, communicate with clarity, and act with self-awareness. Programs for individuals, teams, and whole leadership benches.',                                                                                                                          discuss_link: '/connect', sort_order: 1 },
  { title: 'Coaching',                    description: 'One-on-one coaching for founders and executives — navigating growth, transition, and the harder questions of leadership in a confidential space.',                                                                                                                                   discuss_link: '/connect', sort_order: 2 },
  { title: 'Market Research',             description: 'Decisions grounded in evidence, not assumption. We map your market, customers, and competitors — sizing the opportunity, testing real demand, and surfacing the insight that shows you where to play and how to win.',                                                               discuss_link: '/connect', sort_order: 3 },
  { title: 'Dharmic Innovation',          description: 'Generate and develop ideas, products, and ventures that create genuine value and social good, using our Dharmic Innovation framework.',                                                                                                                                              discuss_link: '/connect', sort_order: 4 },
  { title: 'Dharmic Design',              description: 'Design thinking grounded in Indian Knowledge Systems, applied to products, services, organizations, and experiences.',                                                                                                                                                              discuss_link: '/connect', sort_order: 5 },
  { title: 'Growth Programs for Founders',description: 'Structured programs that take founders from where they are to where they want to go — strategy, focus, and the habits that sustain growth.',                                                                                                                                        discuss_link: '/connect', sort_order: 6 },
  { title: 'Organizational Design',       description: 'Structures, roles, and decision rights that fit your strategy and your people, so the organization can carry the growth you are aiming for.',                                                                                                                                       discuss_link: '/connect', sort_order: 7 },
  { title: 'Culture Design & Transformation', description: 'Shape a culture that lives your values and supports performance — designed deliberately, then embedded through real practice.',                                                                                                                                                  discuss_link: '/connect', sort_order: 8 },
  { title: 'Event Design',                description: 'Conferences, retreats, workshops, and roundtable discussions, designed end to end for genuine impact rather than spectacle.',                                                                                                                                                       discuss_link: '/connect', sort_order: 9 },
];

async function seedCards() {
  const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM services_cards');
  if (rows[0].cnt > 0) return;
  for (const c of CARD_DEFAULTS) {
    await db.query(
      'INSERT INTO services_cards (title,description,discuss_link,sort_order) VALUES (?,?,?,?)',
      [c.title, c.description, c.discuss_link, c.sort_order]
    );
  }
}

async function addCardColumnIfMissing(column, definition) {
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services_cards' AND COLUMN_NAME = ?`,
    [column]
  );
  if (!rows.length) await db.execute(`ALTER TABLE services_cards ADD COLUMN ${column} ${definition}`);
}

ensureTables()
  .then(() => Promise.all([
    addCardColumnIfMissing('icon_type', "ENUM('none','image','svg') DEFAULT 'none'"),
    addCardColumnIfMissing('icon_url',  "VARCHAR(1000) DEFAULT ''"),
    addCardColumnIfMissing('icon_svg',  'LONGTEXT'),
  ]))
  .then(() => seedCards())
  .catch(e => console.error('[services] init failed:', e.message));

const HERO_DEFAULTS = {
  eyebrow:    'Services',
  title:      'What We',
  title_em:   'Offer',
  subtitle:   'We are limited only by your imagination, and we can certainly help tune your imagination to higher frequencies that bring more growth.',
  breadcrumb: 'Services',
};

const SECTION_DEFAULTS = {
  facilitation: {
    eyebrow:     'Facilitation',
    title:       'Conversations that actually move things forward.',
    description: 'We facilitate the moments that matter, so the room reaches real decisions and shared commitment — not just discussion.',
    pills:       'Corporate Meetings\nStrategic Planning Sessions\nRoundtable Discussions\nTown Halls\nPanel Discussions\nCompany Annual Events\nTeam Building Events',
  },
  workshops: {
    eyebrow:     'Workshops',
    title:       'Hands-on workshops, built for outcomes.',
    description: 'Run as a standalone session or a series. Pick a theme below, or tell us the problem and we will design a workshop around it.',
    pills:       'Creativity\nLeadership\nInnovation\nNew Product Development\nCulture Building\nLeadership Communication\nClarity of Thought\nStrategic Planning\nStrategy Development\nCreative Design\nDharmic Leadership\nDharmic Innovation\nTech Innovation\nGenerating New Ideas\nCustom Workshops for your specific problems',
  },
  retreats: {
    eyebrow:     'Retreats',
    title:       'Immersive retreats for people and organizations.',
    description: 'Deeper, experiential journeys for self-discovery, transformation, and direction — for individuals, leadership teams, and whole organizations.',
    pills:       'Self-Awareness\nSelf-Discovery\nSwabhava & Swadharma\nPersonal Transformation\nOrganizational Transformation\nRoadmap Development\nDharmic Innovation\nDharmic Design\nLife Balancing\nLife and Work Design\nLeadership Transition\nCustom Retreats for your specific needs',
  },
  industries: {
    eyebrow:     'Industries',
    title:       'Industries we serve.',
    description: 'Two and a half decades of experience across sectors in India, the USA, and Europe.',
    pills:       'Manufacturing\nHospitality\nEducation\nProfessional Services\nHealthcare\nBeauty\nWellness\nSpirituality\nPublic Figures\nGovernment\nOthers',
  },
  longform: {
    eyebrow:      'Services',
    h1:           'services',
    lead_quote:   '"We are limited only by your imagination, and we can certainly help tune your imagination to higher frequencies that bring more growth!"',
    h2:           'how can we help you?',
    body1:        'We work primarily with Founders/Owners/Presidents/CEOs of start-up/small and medium-sized companies and their executive teams to develop and implement business growth strategies.',
    body2:        'Perhaps one of the most important aspects of this work is the process of immersing ourselves in the vision, mission, culture and aspirations of an organization and its founders and seeing the world through their eyes and then using the insights gained from such a process to help tell their story to the world or their target audience in a language that seems familiar and easy to digest for them.',
    pull_out:     'Visionaries are often light years ahead of their audience and the society in which they are born. It needs a special immersion in their vision and work to translate it to the rest of the world.',
    body3:        'We develop leaders who think in systems, speak with clarity, and act from self-awareness — whether the work is one individual leader, a team, or an entire leadership bench. The aim is capacity that holds under pressure rather than techniques that fade once the workshop ends. Alongside that, we offer one-to-one coaching for founders and executives, held in genuine confidence, working through growth, transition, and the questions that rarely get said aloud — the ones that shape who you lead before strategy does.',
    body4:        'For founders, our structured growth programmes move you from where you are to where you intend to be, with the strategy, focus, and daily habits that make growth sustainable rather than a sprint that quietly burns you out.',
    closing_line: 'We also provide 1-on-1 Leadership / Executive Coaching and Advisory.',
  },
  cgrowth: {
    eyebrow:           'Our framework',
    heading:           'C-GROWTH: Customer, Goals, Results, Offerings, Workforce, Technology, Harmony',
    desc:              'Seven elements, one system — the lens we use to diagnose where your growth is leaking and where it\'s ready to compound.',
    def_items:         'C :: Customers :: Prioritizing customer insights and satisfaction.\nG :: Goals (Leadership) :: Defining and driving company objectives.\nR :: Results :: Measuring outcomes and leadership effectiveness.\nO :: Offerings :: Evaluating the quality and market fit of products/services.\nW :: Workforce (Team) :: Optimizing team performance and collaboration.\nT :: Technology :: Leveraging technology for innovation and efficiency.\nH :: Harmony :: Aligning all elements — team, customers, offerings, and processes — for sustainable growth.',
    cta_text:          'Curious where your organization stands across these seven elements?',
    cta_btn:           'Request the C-Growth Analysis™',
    cta_link:          '/connect',
    gluttons_eyebrow:  'Gluttons for problem solving',
    gluttons_title:    'It is not a service. It is an experience. We love chewing on your problems!',
    gluttons_tagline:  'Bring us your growth problems, we are hungry!',
    gluttons_btn:      'Start the conversation',
    gluttons_btn_link: '/connect',
  },
  cta: {
    eyebrow:   'Not sure where to start?',
    heading:   'Tell us the problem. We will design the engagement.',
    btn1_text: 'Book a Discovery Session',
    btn1_link: '/connect',
    btn2_text: 'Sign up for a 3C Analysis',
    btn2_link: '/connect',
  },
};

// ── HERO ──────────────────────────────────────────────────────────────────────

router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services_hero LIMIT 1');
    res.json(rows[0] ? { ...HERO_DEFAULTS, ...rows[0] } : HERO_DEFAULTS);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const eyebrow    = req.body.eyebrow    ?? null;
  const title      = req.body.title      ?? null;
  const title_em   = req.body.title_em   ?? null;
  const subtitle   = req.body.subtitle   ?? null;
  const breadcrumb = req.body.breadcrumb ?? null;
  try {
    const [existing] = await db.query('SELECT id FROM services_hero LIMIT 1');
    if (existing.length) {
      await db.query(
        'UPDATE services_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO services_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM services_hero LIMIT 1');
    res.json({ ...HERO_DEFAULTS, ...rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SERVICE CARDS ─────────────────────────────────────────────────────────────

router.get('/cards', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services_cards ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/cards', verifyToken, async (req, res) => {
  const { title, description, discuss_link, icon_type, icon_url, icon_svg, sort_order } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO services_cards (title,description,discuss_link,icon_type,icon_url,icon_svg,sort_order) VALUES (?,?,?,?,?,?,?)',
      [title ?? '', description ?? '', discuss_link ?? '#', icon_type ?? 'none', icon_url ?? '', icon_svg ?? '', sort_order ?? 0]
    );
    const [[row]] = await db.query('SELECT * FROM services_cards WHERE id=?', [result.insertId]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/cards/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;
  try {
    await Promise.all(items.map(({ id, sort_order }) =>
      db.query('UPDATE services_cards SET sort_order=? WHERE id=?', [sort_order, id])
    ));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/cards/:id', verifyToken, async (req, res) => {
  const { title, description, discuss_link, icon_type, icon_url, icon_svg, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE services_cards SET title=?,description=?,discuss_link=?,icon_type=?,icon_url=?,icon_svg=?,sort_order=? WHERE id=?',
      [title ?? '', description ?? '', discuss_link ?? '#', icon_type ?? 'none', icon_url ?? '', icon_svg ?? '', sort_order ?? 0, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM services_cards WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Card icon image upload ─────────────────────────────────────────────────────
router.post('/cards/:id/icon', verifyToken, (req, res) => {
  upload.single('icon')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const iconUrl = `/uploads/services/${req.file.filename}`;
    try {
      // Delete old icon file if it was a local upload
      const [[card]] = await db.query('SELECT icon_url FROM services_cards WHERE id=?', [req.params.id]);
      if (card?.icon_url?.startsWith('/uploads/services/')) {
        fs.unlink(path.join(uploadDir, path.basename(card.icon_url)), () => {});
      }
      await db.query('UPDATE services_cards SET icon_type=?,icon_url=?,icon_svg=? WHERE id=?',
        ['image', iconUrl, '', req.params.id]);
      res.json({ url: iconUrl });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

router.delete('/cards/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM services_cards WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CONTENT SECTIONS ──────────────────────────────────────────────────────────

const VALID_SECTIONS = ['facilitation', 'workshops', 'retreats', 'industries', 'longform', 'cgrowth', 'cta'];
const GRAPHIC_SECTIONS = ['facilitation', 'cgrowth'];

router.get('/section/:key', async (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) return res.status(400).json({ error: 'Unknown section' });
  try {
    const [[row]] = await db.query('SELECT data FROM services_content WHERE section=?', [key]);
    const saved = row ? JSON.parse(row.data) : {};
    res.json({ ...(SECTION_DEFAULTS[key] || {}), ...saved });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload graphic image for a section (facilitation / cgrowth)
router.post('/section/:key/graphic', verifyToken, (req, res) => {
  const { key } = req.params;
  if (!GRAPHIC_SECTIONS.includes(key)) return res.status(400).json({ error: 'Graphic upload not supported for this section' });
  upload.single('graphic')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/services/${req.file.filename}`;
    // Delete old graphic file if it was a local upload
    try {
      const [[row]] = await db.query('SELECT data FROM services_content WHERE section=?', [key]);
      if (row) {
        const old = JSON.parse(row.data || '{}');
        if (old.graphic_url?.startsWith('/uploads/services/')) {
          fs.unlink(path.join(uploadDir, path.basename(old.graphic_url)), () => {});
        }
      }
    } catch (_) {}
    res.json({ url });
  });
});

router.put('/section/:key', verifyToken, async (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) return res.status(400).json({ error: 'Unknown section' });
  try {
    await db.query(
      `INSERT INTO services_content (section, data) VALUES (?,?)
       ON DUPLICATE KEY UPDATE data=VALUES(data)`,
      [key, JSON.stringify(req.body)]
    );
    res.json({ ...(SECTION_DEFAULTS[key] || {}), ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: all page data in one request ──────────────────────────────────────

router.get('/all', async (_req, res) => {
  try {
    const [[heroRow]] = await db.query('SELECT * FROM services_hero LIMIT 1');
    const [cards]     = await db.query('SELECT * FROM services_cards ORDER BY sort_order ASC, id ASC');
    const [sections]  = await db.query('SELECT section, data FROM services_content');

    const content = {};
    VALID_SECTIONS.forEach(k => { content[k] = { ...(SECTION_DEFAULTS[k] || {}) }; });
    sections.forEach(r => {
      try { content[r.section] = { ...(SECTION_DEFAULTS[r.section] || {}), ...JSON.parse(r.data) }; }
      catch (_) {}
    });

    res.json({
      hero:    heroRow ? { ...HERO_DEFAULTS, ...heroRow } : HERO_DEFAULTS,
      cards,
      content,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
