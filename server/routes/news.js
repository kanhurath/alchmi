const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Image upload setup ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'news');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => cb(null, `article-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Table setup ────────────────────────────────────────────────────────────────
async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news_hero (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eyebrow      VARCHAR(200)  DEFAULT 'Updates & Reflections',
      title        VARCHAR(200)  DEFAULT 'News &',
      title_em     VARCHAR(200)  DEFAULT 'Insights',
      description  TEXT,
      linkedin_url VARCHAR(500)  DEFAULT 'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
      linkedin_label VARCHAR(200) DEFAULT 'Follow on LinkedIn',
      footer_note  VARCHAR(300)  DEFAULT 'Updated regularly · 2026'
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news_filters (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      label      VARCHAR(100) NOT NULL,
      slug       VARCHAR(100) NOT NULL UNIQUE,
      sort_order INT          DEFAULT 0
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      is_featured      TINYINT(1)   DEFAULT 0,
      source_name      VARCHAR(200) DEFAULT 'LinkedIn · Post',
      source_icon      VARCHAR(10)  DEFAULT 'in',
      source_icon_color VARCHAR(20) DEFAULT '#0a66c2',
      pub_date         VARCHAR(100) DEFAULT '',
      tags             VARCHAR(500) DEFAULT '',
      categories       VARCHAR(300) DEFAULT '',
      title            VARCHAR(600) NOT NULL,
      body             TEXT,
      pull_quote       TEXT,
      meta_text        VARCHAR(300) DEFAULT '',
      read_more_label  VARCHAR(100) DEFAULT 'Read Full Post',
      read_more_url    VARCHAR(500) DEFAULT '',
      image_svg        LONGTEXT,
      image_url        VARCHAR(500) DEFAULT '',
      sort_order       INT          DEFAULT 0,
      is_active        TINYINT(1)   DEFAULT 1,
      created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news_sidebar (
      id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      block_key VARCHAR(50)  NOT NULL UNIQUE,
      title     VARCHAR(200) DEFAULT '',
      name_text VARCHAR(200) DEFAULT '',
      role_text VARCHAR(300) DEFAULT '',
      cta_label VARCHAR(200) DEFAULT '',
      cta_url   VARCHAR(500) DEFAULT '',
      body_text TEXT
    )
  `);

  // Seed default hero
  const [[heroRow]] = await db.execute('SELECT id FROM news_hero LIMIT 1');
  if (!heroRow) {
    await db.execute(`
      INSERT INTO news_hero (eyebrow, title, title_em, description, linkedin_url, linkedin_label, footer_note)
      VALUES (?,?,?,?,?,?,?)
    `, [
      'Updates & Reflections',
      'News &',
      'Insights',
      'A running record of talks, panels, and reflections shared on Dharma, Indian Knowledge Systems, and conscious enterprise — drawn from recent activity and writing.',
      'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
      'Follow on LinkedIn',
      'Updated regularly · 2026',
    ]);
  }

  // Seed default filters
  const [[filterRow]] = await db.execute('SELECT id FROM news_filters LIMIT 1');
  if (!filterRow) {
    const filters = [
      ['IKS', 'iks', 1],
      ['Dharma', 'dharma', 2],
      ['Education', 'education', 3],
      ['Events & Panels', 'events', 4],
      ['Dharmic Innovation', 'innovation', 5],
    ];
    for (const [label, slug, sort_order] of filters) {
      await db.execute('INSERT IGNORE INTO news_filters (label, slug, sort_order) VALUES (?,?,?)', [label, slug, sort_order]);
    }
  }

  // Seed default sidebar blocks
  const sidebarDefaults = [
    {
      block_key: 'profile',
      title:     'Follow Along',
      name_text: 'Vinay Kulkarni',
      role_text: 'Founder, ALCHMI · Dharmic Enterprise',
      cta_label: 'View LinkedIn Activity',
      cta_url:   'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
      body_text: '',
    },
    {
      block_key: 'newsletter',
      title:     'Dharmic Ideas & Insights',
      name_text: '',
      role_text: '',
      cta_label: 'Subscribe on LinkedIn',
      cta_url:   'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/',
      body_text: "Vinay's LinkedIn newsletter — reflections on Dharma, IKS, and conscious enterprise, delivered as they're written.",
    },
  ];
  for (const s of sidebarDefaults) {
    await db.execute(`
      INSERT IGNORE INTO news_sidebar (block_key, title, name_text, role_text, cta_label, cta_url, body_text)
      VALUES (?,?,?,?,?,?,?)
    `, [s.block_key, s.title, s.name_text, s.role_text, s.cta_label, s.cta_url, s.body_text]);
  }

  // Seed default articles (from design HTML — seeded once only)
  const [[articleRow]] = await db.execute('SELECT id FROM news_articles LIMIT 1');
  if (!articleRow) {
    const LI_URL = 'https://www.linkedin.com/in/vinkulkarni/recent-activity/all/';
    const articles = [
      {
        is_featured: 1,
        source_name: 'LinkedIn · Post',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: 'April 14, 2026',
        tags: 'Dharma,IKS,Dharmic Innovation,Entrepreneurship',
        categories: 'iks events',
        title: 'An Experiment in Saṃvāda: Notes from the IKS APEX Meet 2026',
        body: '<p>A panel of fifteen scholar-practitioners, a roomful of students, parents, teachers, and administrators — and what happens when representatives of every IKS stakeholder group in India share one structured conversation.</p><p>The IKS APEX Meet 2026, held at Jeppiaar University, Chennai on 10 April, was the second kind. Days later, I am still working through what it surfaced. I had the honor and the distinct privilege of moderating a panel of fifteen scholar-practitioners working across the field.</p>',
        pull_quote: 'Some gatherings inform you. A rare few rearrange the perspectives of how you see the field.',
        meta_text: 'Jeppiaar University, Chennai',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 0,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Post',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: 'April 2026',
        tags: 'Dharma,Mental Model,Psychology',
        categories: 'dharma innovation',
        title: 'On Why Creativity Is Really About Receptivity — Not Transmission',
        body: '<p><em>"Using an elephant gun to shoot a fly!"</em> — this, I have come to see, is the condition of the Buddhi almost everywhere. We mistake force of intellect for depth of insight, and in doing so, miss the quieter discipline that creative work actually demands: the capacity to receive, not just to produce.</p>',
        pull_quote: '',
        meta_text: 'Reflection',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 1,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Article',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: '2026',
        tags: 'Dharma,Dharmic Economics,IKS',
        categories: 'dharma iks',
        title: 'What If Everything We Knew Was Built on Borrowed Assumptions?',
        body: '<p>What if everything we thought we knew about success, progress, happiness, and even health was built upon borrowed assumptions — mental constructs we never consciously chose? This is not a philosophical exercise. This is the ground beneath our feet.</p><p>The Bhāratīya worldview rests upon a sophisticated understanding of reality that cannot be reduced to religious belief or cultural practice. Dharma is not religion in the Western sense — it is the cosmic law that governs all existence, from the movement of galaxies to the beating of a human heart.</p>',
        pull_quote: '',
        meta_text: 'Essay',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 2,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Post',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: '2026',
        tags: 'Dharma,Economics,Education',
        categories: 'dharma iks',
        title: 'The Pañcakoṣa Model and the Sustainability Crisis',
        body: '<p>Our current sustainability crisis has a simple diagnosis: the whole world began operating in the Artha-Kāma plane and forgot Dharma — the harmonizing principle — and Mokṣa — the liberating principle. Unlimited desires. Limited natural resources.</p><p>Every aspect of traditional life — the food we ate, the temples we built, the cities we designed — was crafted so that even the most ordinary person was slowly moved from the Annamaya toward the Ānandamaya koṣa. Day by day. Task by task.</p>',
        pull_quote: 'One planet is not enough to satiate the untenable greed of a humanity operating without inner restraint. Chitta Shuddhi is the need of the hour.',
        meta_text: 'Essay',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 3,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Event',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: 'January 31, 2026',
        tags: 'Education,Mental Model,Spiritual',
        categories: 'events education',
        title: 'Honouring the Past, Innovating for the Future — A Panel on IKS in Modern Education',
        body: '<p>An insightful dialogue on honouring the past and innovating for the future — exploring how Indian Knowledge Systems can shape modern education, research, and innovation. Joined by Prof. Shailaja Sharma (Azim Premji University) and Dr. Prathosh A P (IISc), with Vinayachandra Banavathy of Chanakya University.</p>',
        pull_quote: '',
        meta_text: 'Tripura Vasini Palace Grounds, Bengaluru',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 4,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Course Update',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: '2026',
        tags: 'IKS,Education,Dharmic Innovation',
        categories: 'iks education',
        title: 'The Sacred Role of the Teacher in Rebuilding Bhārat — Session 3',
        body: '<p>Integrating Indian Knowledge Systems in Academia through NEP 2020: A Vision for Civilizational Reclamation. Delivered as part of the 10-Day IKS Certificate Course, moderated by Nidhi Ji (NLD Platform), in collaboration with Śrī Guru Teg Bahadur Khalsa College, Śrī Ānandpur Sāhib, Punjab.</p><p>Recap of previous sessions: we began with Patañjali Yoga Sūtra — an extremely experiential session that set the tone for everything since.</p>',
        pull_quote: '',
        meta_text: '10-Day IKS Certificate Course',
        read_more_label: 'Read Full Post',
        read_more_url: LI_URL,
        sort_order: 5,
      },
      {
        is_featured: 0,
        source_name: 'LinkedIn · Article',
        source_icon: 'in',
        source_icon_color: '#0a66c2',
        pub_date: '2026',
        tags: 'Dharma,IKS,Psychology',
        categories: 'iks dharma',
        title: 'Viewing the World Through Indian Knowledge Systems',
        body: '<p>From ancient wisdom to living ways of seeing, being, and healing — a summary article based on responses to questions asked during a recent full panel discussion on Dharma, Dharmic Economics, Dharmic Innovation, and Education.</p>',
        pull_quote: '',
        meta_text: 'Full Article',
        read_more_label: 'Read Full Article',
        read_more_url: 'http://localhost:3001/category/iks/',
        sort_order: 6,
      },
    ];

    for (const a of articles) {
      await db.execute(
        `INSERT INTO news_articles
         (is_featured, source_name, source_icon, source_icon_color, pub_date,
          tags, categories, title, body, pull_quote, meta_text,
          read_more_label, read_more_url, image_svg, sort_order, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
        [
          a.is_featured, a.source_name, a.source_icon, a.source_icon_color, a.pub_date,
          a.tags, a.categories, a.title, a.body, a.pull_quote, a.meta_text,
          a.read_more_label, a.read_more_url, '', a.sort_order,
        ]
      );
    }
  }

  // Seed news/navigation entry
  try {
    const [[evtNav]] = await db.execute(
      "SELECT sort_order FROM nav_items WHERE menu='header' AND url='/events' LIMIT 1"
    );
    const [[newsNav]] = await db.execute(
      "SELECT id FROM nav_items WHERE menu='header' AND url='/news' LIMIT 1"
    );
    if (!newsNav) {
      const nextOrder = evtNav ? evtNav.sort_order + 1 : 50;
      await db.execute(
        "INSERT INTO nav_items (menu, label, url, is_external, parent_id, sort_order) VALUES ('header','News','/news',0,NULL,?)",
        [nextOrder]
      );
    }
  } catch (_) { /* nav_items table might not exist — skip */ }
}

ensureTables().catch(e => console.error('[news] table init failed:', e.message));

// Add image_url column if missing (idempotent)
db.execute("ALTER TABLE news_articles ADD COLUMN image_url VARCHAR(500) DEFAULT ''")
  .catch(() => {}); // silently skip if column already exists

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.execute('SELECT * FROM news_hero LIMIT 1'),
      db.execute('SELECT * FROM news_articles WHERE is_active=1 ORDER BY sort_order, id'),
      db.execute('SELECT * FROM news_filters ORDER BY sort_order, id'),
      db.execute('SELECT * FROM news_sidebar ORDER BY id'),
    ]);
    const val = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];
    res.json({
      hero:     val(0)[0] || {},
      articles: val(1),
      filters:  val(2),
      sidebar:  val(3),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM news_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/hero', verifyToken, async (req, res) => {
  const { eyebrow, title, title_em, description, linkedin_url, linkedin_label, footer_note } = req.body;
  try {
    const [[ex]] = await db.execute('SELECT id FROM news_hero LIMIT 1');
    if (ex) {
      await db.execute(
        'UPDATE news_hero SET eyebrow=?,title=?,title_em=?,description=?,linkedin_url=?,linkedin_label=?,footer_note=? WHERE id=?',
        [eyebrow, title, title_em, description, linkedin_url, linkedin_label, footer_note, ex.id]
      );
    } else {
      await db.execute(
        'INSERT INTO news_hero (eyebrow,title,title_em,description,linkedin_url,linkedin_label,footer_note) VALUES (?,?,?,?,?,?,?)',
        [eyebrow, title, title_em, description, linkedin_url, linkedin_label, footer_note]
      );
    }
    const [[row]] = await db.execute('SELECT * FROM news_hero LIMIT 1');
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ARTICLES ──────────────────────────────────────────────────────────────────
router.get('/articles', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM news_articles ORDER BY sort_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/articles', verifyToken, async (req, res) => {
  const {
    is_featured = 0, source_name = 'LinkedIn · Post', source_icon = 'in',
    source_icon_color = '#0a66c2', pub_date = '', tags = '', categories = '',
    title, body = '', pull_quote = '', meta_text = '',
    read_more_label = 'Read Full Post', read_more_url = '',
    image_svg = '', image_url = '', sort_order = 0,
  } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO news_articles
       (is_featured,source_name,source_icon,source_icon_color,pub_date,tags,categories,
        title,body,pull_quote,meta_text,read_more_label,read_more_url,image_svg,image_url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [is_featured?1:0, source_name, source_icon, source_icon_color, pub_date, tags,
       categories, title, body, pull_quote, meta_text, read_more_label, read_more_url,
       image_svg, image_url, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM news_articles WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Specific routes before /:id to prevent "reorder" matching as an id
router.put('/articles/reorder', verifyToken, async (req, res) => {
  const { items } = req.body; // [{id, sort_order}]
  try {
    for (const { id, sort_order } of items) {
      await db.execute('UPDATE news_articles SET sort_order=? WHERE id=?', [sort_order, id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/articles/:id', verifyToken, async (req, res) => {
  const {
    is_featured, source_name, source_icon, source_icon_color, pub_date,
    tags, categories, title, body, pull_quote, meta_text,
    read_more_label, read_more_url, image_svg, image_url, sort_order, is_active,
  } = req.body;
  try {
    await db.execute(
      `UPDATE news_articles SET
       is_featured=?,source_name=?,source_icon=?,source_icon_color=?,pub_date=?,
       tags=?,categories=?,title=?,body=?,pull_quote=?,meta_text=?,
       read_more_label=?,read_more_url=?,image_svg=?,image_url=?,sort_order=?,is_active=?
       WHERE id=?`,
      [is_featured?1:0, source_name, source_icon, source_icon_color, pub_date,
       tags, categories, title, body, pull_quote, meta_text,
       read_more_label, read_more_url, image_svg||'', image_url||'', sort_order||0, is_active?1:0,
       req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM news_articles WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/articles/:id/image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const image_url = `/uploads/news/${req.file.filename}`;
  try {
    await db.execute('UPDATE news_articles SET image_url=? WHERE id=?', [image_url, req.params.id]);
    const [[row]] = await db.execute('SELECT * FROM news_articles WHERE id=?', [req.params.id]);
    res.json({ image_url, article: row });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/articles/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM news_articles WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FILTERS ───────────────────────────────────────────────────────────────────
router.get('/filters', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM news_filters ORDER BY sort_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/filters', verifyToken, async (req, res) => {
  const { label, slug, sort_order = 0 } = req.body;
  try {
    const [r] = await db.execute(
      'INSERT INTO news_filters (label, slug, sort_order) VALUES (?,?,?)',
      [label, slug, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM news_filters WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/filters/:id', verifyToken, async (req, res) => {
  const { label, slug, sort_order } = req.body;
  try {
    await db.execute(
      'UPDATE news_filters SET label=?,slug=?,sort_order=? WHERE id=?',
      [label, slug, sort_order||0, req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM news_filters WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/filters/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM news_filters WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
router.get('/sidebar', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM news_sidebar ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/sidebar/:key', verifyToken, async (req, res) => {
  const { title, name_text, role_text, cta_label, cta_url, body_text } = req.body;
  try {
    await db.execute(`
      INSERT INTO news_sidebar (block_key, title, name_text, role_text, cta_label, cta_url, body_text)
      VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title), name_text=VALUES(name_text), role_text=VALUES(role_text),
        cta_label=VALUES(cta_label), cta_url=VALUES(cta_url), body_text=VALUES(body_text)
    `, [req.params.key, title, name_text, role_text, cta_label, cta_url, body_text]);
    const [[row]] = await db.execute('SELECT * FROM news_sidebar WHERE block_key=?', [req.params.key]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
