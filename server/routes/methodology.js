const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

// ── Upload setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'methodology');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, `graphic-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// ── Table setup ───────────────────────────────────────────────────────────────

async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS methodology_hero (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eyebrow    VARCHAR(200) DEFAULT 'Methodology',
      title      VARCHAR(300) DEFAULT 'Our',
      title_em   VARCHAR(300) DEFAULT 'Frameworks',
      subtitle   TEXT,
      breadcrumb VARCHAR(200) DEFAULT 'Methodology'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS methodology_frameworks (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      label        VARCHAR(100) DEFAULT '',
      title        VARCHAR(300) NOT NULL,
      body         TEXT,
      checklist    LONGTEXT,
      image_key    VARCHAR(100) DEFAULT 'dharmic_enterprise',
      bg           ENUM('white','gray','dark') DEFAULT 'white',
      layout_reverse TINYINT(1) DEFAULT 0,
      sort_order   INT DEFAULT 0,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS methodology_content (
      section    VARCHAR(50) PRIMARY KEY,
      data       LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function addFrameworkColumnIfMissing(column, definition) {
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'methodology_frameworks' AND COLUMN_NAME = ?`,
    [column]
  );
  if (!rows.length) await db.execute(`ALTER TABLE methodology_frameworks ADD COLUMN ${column} ${definition}`);
}

ensureTables()
  .then(() => Promise.all([
    addFrameworkColumnIfMissing('graphic_type', "VARCHAR(20) DEFAULT 'svg_preset'"),
    addFrameworkColumnIfMissing('graphic_url',  "VARCHAR(1000) DEFAULT ''"),
    addFrameworkColumnIfMissing('graphic_svg',  'LONGTEXT'),
    addFrameworkColumnIfMissing('graphic_html', 'LONGTEXT'),
  ]))
  .catch(e => console.error('[methodology] init failed:', e.message));

// ── Defaults ──────────────────────────────────────────────────────────────────

const HERO_DEFAULTS = {
  eyebrow:    'Methodology',
  title:      'Our',
  title_em:   'Frameworks',
  subtitle:   'A set of proprietary frameworks built on Indian Knowledge Systems, systems thinking, and decades of practical experience.',
  breadcrumb: 'Methodology',
};

const FRAMEWORK_DEFAULTS = [
  {
    label: 'Framework 01', title: 'The Dharmic Enterprise Framework',
    body: 'A complete model for envisioning, constructing, and running an organization that aligns profit with purpose. It gives you both the theory and the practical design and implementation methods to evolve into a Dharmic enterprise — one that is inherently sustainable because doing good is built into what it makes and how it works.',
    checklist: JSON.stringify([
      { title: 'Profit with purpose', desc: 'A core purpose beyond profit, expressed through the product or service itself.' },
      { title: 'Inherently sustainable', desc: 'Sustainability designed in, not bolted on.' },
    ]),
    image_key: 'dharmic_enterprise', bg: 'white', layout_reverse: 0, sort_order: 1,
    graphic_type: 'svg_preset', graphic_url: '', graphic_svg: '', graphic_html: '',
  },
  {
    label: 'Framework 02', title: 'Dharmic Innovation Framework',
    body: 'A structured approach to generating and developing ideas, products, and ventures that create real value and social good. It pairs systems thinking and design thinking with the wisdom of Indian Knowledge Systems, so innovation serves people and purpose, not novelty for its own sake.',
    checklist: JSON.stringify([]),
    image_key: 'dharmic_innovation', bg: 'gray', layout_reverse: 1, sort_order: 2,
    graphic_type: 'svg_preset', graphic_url: '', graphic_svg: '', graphic_html: '',
  },
  {
    label: 'Framework 03', title: 'Dharmic Design',
    body: 'Design thinking grounded in Indian Knowledge Systems. We apply it to products, services, organizations, spaces, and experiences — beginning with a deep understanding of the people involved, their svabhava and their needs, and ending in solutions that are both beautiful and right.',
    checklist: JSON.stringify([]),
    image_key: 'dharmic_design', bg: 'white', layout_reverse: 0, sort_order: 3,
    graphic_type: 'svg_preset', graphic_url: '', graphic_svg: '', graphic_html: '',
  },
  {
    label: 'Framework 04', title: 'Dharmic Leadership',
    body: 'A Dharmic leader is a systems thinker and a self-aware, conscious individual — the steady witness who sees the whole picture before acting. We help leaders cultivate that awareness and apply it to real decisions, so leadership becomes a practice rather than a performance.',
    checklist: JSON.stringify([
      { title: 'Systems thinking', desc: 'Seeing the whole, not just the parts.' },
      { title: 'Self-awareness', desc: 'The conscious leader who acts from clarity.' },
    ]),
    image_key: 'dharmic_leadership', bg: 'dark', layout_reverse: 1, sort_order: 4,
    graphic_type: 'svg_preset', graphic_url: '', graphic_svg: '', graphic_html: '',
  },
];

const CONTENT_DEFAULTS = {
  explainer: {
    h1:              'MeTHODOLOGY — what in the world is that?',
    lede:            'Our methodology is based on our practical, "in-the-trenches" business experience of more than 10 years and our strong educational background.',
    h2:              'method? what method?',
    tagline:         'we have as many methods as there are problems in the universe. we do not have a method. we have sharp eyes, curious minds, clever ideas and warm hearts. will that work?',
    bullets:         'We utilize discovery and diagnosis methods that are simple, practical, effective and powerful\nWe immerse ourselves in the customer\'s business environment and extract key insights\nWe understand the nuances of our customer\'s business and derive insights from our understanding\nWe work through a collaborative problem solving partnership with the business owners and executives\nWe listen intently to what the business owners and executives say and help them tap into their inner source to solve problems\nOur ultimate focus is to help our customers identify massive growth opportunities in adjacent segments',
    image_url:       'https://images.unsplash.com/photo-1547347298-4074fc3436a4?w=900&q=80',
    h3_confession:   'Confession time:',
    body_confession: 'our methods are known to be a little crazy, a little zany, and quite a bit out of the box orthodox. But don\'t worry, there is a method to our madness. We are mad. We are mad about finding creative solutions to your problems. We are mad about getting it right down to the tiniest detail. Work with us and you will go mad too! But mad in a good way. What is life without a bit of madness? We are serious about being mad about your business. Do not take us lightly!',
    h3_quote:        'Favorite quote:',
    quote:           '"To a man with a hammer, everything looks like a nail!"',
    body_quote:      'After 20 years in business, most ordinary people are like "used solutions salesmen" who are roaming around trying to find buyers for old and worn-out solutions to dead and gone problems. Like Peter Drucker said, most businesspeople are trying to solve yesterday\'s problems. We operate at the cutting edge of here and now. And hereafter. Even the unknown, unseen tomorrow. We are not burdened by our past work. Our past work only helped to build our problem-solving muscles. Come, let us have a coffee and you can check out our muscles! What say?!',
  },
  cta: {
    heading:   'Learn to be a Dharmic leader.',
    desc:      'Bring these frameworks into your organization through coaching, programs, workshops, and retreats.',
    btn1_text: 'Book a Discovery Session',
    btn1_link: '/connect',
    btn2_text: 'See the Services',
    btn2_link: '/services',
  },
};

// ── HERO ──────────────────────────────────────────────────────────────────────

router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM methodology_hero LIMIT 1');
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
    const [existing] = await db.query('SELECT id FROM methodology_hero LIMIT 1');
    if (existing.length) {
      await db.query(
        'UPDATE methodology_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO methodology_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM methodology_hero LIMIT 1');
    res.json({ ...HERO_DEFAULTS, ...rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FRAMEWORKS ────────────────────────────────────────────────────────────────

router.get('/frameworks', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM methodology_frameworks ORDER BY sort_order ASC, id ASC');
    if (rows.length) return res.json(rows);
    // Auto-seed defaults into DB so every framework gets a real ID
    for (const fw of FRAMEWORK_DEFAULTS) {
      await db.query(
        `INSERT INTO methodology_frameworks
         (label,title,body,checklist,image_key,bg,layout_reverse,sort_order,graphic_type,graphic_url,graphic_svg,graphic_html)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [fw.label, fw.title, fw.body, fw.checklist,
         fw.image_key, fw.bg, fw.layout_reverse, fw.sort_order,
         fw.graphic_type, fw.graphic_url, fw.graphic_svg, fw.graphic_html]
      );
    }
    const [seeded] = await db.query('SELECT * FROM methodology_frameworks ORDER BY sort_order ASC, id ASC');
    res.json(seeded);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/frameworks', verifyToken, async (req, res) => {
  const { label, title, body, checklist, image_key, bg, layout_reverse, sort_order,
          graphic_type, graphic_url, graphic_svg, graphic_html } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO methodology_frameworks
       (label,title,body,checklist,image_key,bg,layout_reverse,sort_order,graphic_type,graphic_url,graphic_svg,graphic_html)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [label ?? '', title ?? '', body ?? '', checklist ?? '[]',
       image_key ?? 'dharmic_enterprise', bg ?? 'white', layout_reverse ?? 0, sort_order ?? 0,
       graphic_type ?? 'svg_preset', graphic_url ?? '', graphic_svg ?? '', graphic_html ?? '']
    );
    const [[row]] = await db.query('SELECT * FROM methodology_frameworks WHERE id=?', [result.insertId]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload graphic image for a framework (must be before PUT /frameworks/:id)
router.post('/frameworks/:id/graphic', verifyToken, (req, res) => {
  upload.single('graphic')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/methodology/${req.file.filename}`;
    try {
      const [[fw]] = await db.query('SELECT graphic_url FROM methodology_frameworks WHERE id=?', [req.params.id]);
      if (fw?.graphic_url?.startsWith('/uploads/methodology/')) {
        fs.unlink(path.join(uploadDir, path.basename(fw.graphic_url)), () => {});
      }
      await db.query('UPDATE methodology_frameworks SET graphic_type=?,graphic_url=?,graphic_svg=?,graphic_html=? WHERE id=?',
        ['image', url, '', '', req.params.id]);
      res.json({ url });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

router.put('/frameworks/:id', verifyToken, async (req, res) => {
  const { label, title, body, checklist, image_key, bg, layout_reverse, sort_order,
          graphic_type, graphic_url, graphic_svg, graphic_html } = req.body;
  try {
    await db.query(
      `UPDATE methodology_frameworks
       SET label=?,title=?,body=?,checklist=?,image_key=?,bg=?,layout_reverse=?,sort_order=?,
           graphic_type=?,graphic_url=?,graphic_svg=?,graphic_html=?
       WHERE id=?`,
      [label ?? '', title ?? '', body ?? '', checklist ?? '[]',
       image_key ?? 'dharmic_enterprise', bg ?? 'white', layout_reverse ?? 0, sort_order ?? 0,
       graphic_type ?? 'svg_preset', graphic_url ?? '', graphic_svg ?? '', graphic_html ?? '',
       req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM methodology_frameworks WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/frameworks/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM methodology_frameworks WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CONTENT SECTIONS ──────────────────────────────────────────────────────────

const VALID_SECTIONS = ['explainer', 'cta'];
const IMAGE_SECTIONS = ['explainer'];

// Upload image for a content section (explainer)
router.post('/section/:key/image', verifyToken, (req, res) => {
  const { key } = req.params;
  if (!IMAGE_SECTIONS.includes(key)) return res.status(400).json({ error: 'Image upload not supported for this section' });
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/methodology/${req.file.filename}`;
    // Delete old uploaded graphic if present
    try {
      const [[row]] = await db.query('SELECT data FROM methodology_content WHERE section=?', [key]);
      if (row) {
        const old = JSON.parse(row.data || '{}');
        if (old.graphic_url?.startsWith('/uploads/methodology/')) {
          fs.unlink(path.join(uploadDir, path.basename(old.graphic_url)), () => {});
        }
      }
    } catch (_) {}
    res.json({ url });
  });
});

router.get('/section/:key', async (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) return res.status(400).json({ error: 'Unknown section' });
  try {
    const [[row]] = await db.query('SELECT data FROM methodology_content WHERE section=?', [key]);
    const saved = row ? JSON.parse(row.data) : {};
    res.json({ ...(CONTENT_DEFAULTS[key] || {}), ...saved });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/section/:key', verifyToken, async (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) return res.status(400).json({ error: 'Unknown section' });
  try {
    await db.query(
      `INSERT INTO methodology_content (section,data) VALUES (?,?)
       ON DUPLICATE KEY UPDATE data=VALUES(data)`,
      [key, JSON.stringify(req.body)]
    );
    res.json({ ...(CONTENT_DEFAULTS[key] || {}), ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: all page data ─────────────────────────────────────────────────────

router.get('/all', async (_req, res) => {
  try {
    const [[heroRow]]   = await db.query('SELECT * FROM methodology_hero LIMIT 1');
    const [frameworks]  = await db.query('SELECT * FROM methodology_frameworks ORDER BY sort_order ASC, id ASC');
    const [sections]    = await db.query('SELECT section, data FROM methodology_content');

    const content = {};
    VALID_SECTIONS.forEach(k => { content[k] = { ...(CONTENT_DEFAULTS[k] || {}) }; });
    sections.forEach(r => {
      try { content[r.section] = { ...(CONTENT_DEFAULTS[r.section] || {}), ...JSON.parse(r.data) }; }
      catch (_) {}
    });

    res.json({
      hero:       heroRow ? { ...HERO_DEFAULTS, ...heroRow } : HERO_DEFAULTS,
      frameworks: frameworks.length ? frameworks : FRAMEWORK_DEFAULTS,
      content,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
