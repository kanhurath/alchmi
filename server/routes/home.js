const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Upload setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'home');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertSingle(table, data) {
  const [rows] = await db.query(`SELECT id FROM ${table} LIMIT 1`);
  const keys   = Object.keys(data);
  const vals   = Object.values(data);
  if (rows.length) {
    const set = keys.map(k => `${k}=?`).join(', ');
    await db.query(`UPDATE ${table} SET ${set} WHERE id=?`, [...vals, rows[0].id]);
    const [r] = await db.query(`SELECT * FROM ${table} WHERE id=?`, [rows[0].id]);
    return r[0];
  }
  const cols = keys.join(', ');
  const ph   = keys.map(() => '?').join(', ');
  const [res] = await db.query(`INSERT INTO ${table} (${cols}) VALUES (${ph})`, vals);
  const [r]   = await db.query(`SELECT * FROM ${table} WHERE id=?`, [res.insertId]);
  return r[0];
}

// ── GET /api/home/all — fetch all sections at once ────────────────────────────
router.get('/all', async (_req, res) => {
  try {
    const [[hero]]         = await db.query('SELECT * FROM home_hero LIMIT 1');
    const [marquee]          = await db.query('SELECT * FROM home_marquee_items ORDER BY sort_order');
    const [[marqueeStyle]]   = await db.execute('SELECT * FROM home_marquee_style LIMIT 1').catch(() => [[]]);
    const [[about]]        = await db.query('SELECT * FROM home_about LIMIT 1');
    const [tags]           = await db.query('SELECT * FROM home_about_tags ORDER BY sort_order');
    const [articles]       = await db.query('SELECT * FROM home_articles ORDER BY sort_order');
    const [themes]         = await db.query('SELECT * FROM home_themes ORDER BY sort_order');
    const [[quote]]        = await db.query('SELECT * FROM home_quote LIMIT 1');
    const [talks]          = await db.query('SELECT * FROM home_talks ORDER BY sort_order');
    const [[connect]]      = await db.query('SELECT * FROM home_connect LIMIT 1');
    const [connectLinks]   = await db.query('SELECT * FROM home_connect_links ORDER BY sort_order');
    const [[wwdSection]]   = await db.query('SELECT * FROM home_whatwedo LIMIT 1').catch(() => [[]]);
    const [wwdCards]       = await db.query('SELECT * FROM home_whatwedo_cards ORDER BY sort_order').catch(() => [[]]);

    res.json({
      hero:    hero    || {},
      marquee:      marquee      || [],
      marqueeStyle: marqueeStyle || {},
      about:   { ...(about || {}), tags: tags || [] },
      whatwedo: { section: wwdSection || {}, cards: wwdCards || [] },
      articles: articles || [],
      themes:   themes   || [],
      quote:    quote    || {},
      talks:    talks    || [],
      connect:  { ...(connect || {}), links: connectLinks || [] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── HERO ──────────────────────────────────────────────────────────────────────

// Ensure image columns exist (safe to run on every boot)
async function ensureHeroImageCols() {
  const varcharCols = ['bg_image_url', 'bg_image_mob_url', 'animation_image_url', 'animation_image_mob_url', 'portrait_url', 'portrait_mob_url'];
  for (const col of varcharCols) {
    await db.query(`ALTER TABLE home_hero ADD COLUMN ${col} VARCHAR(500) NOT NULL DEFAULT ''`)
      .catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') console.error('[home] hero col:', col, e.message); });
  }
  const textCols = ['animation_html_desktop', 'animation_html_mobile'];
  for (const col of textCols) {
    await db.query(`ALTER TABLE home_hero ADD COLUMN ${col} MEDIUMTEXT`)
      .catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') console.error('[home] hero col:', col, e.message); });
  }
  const styleCols = [
    'style_mantra_size', 'style_mantra_color',
    'style_eyebrow_size', 'style_eyebrow_color',
    'style_title_size', 'style_title_color', 'style_title_em_color',
    'style_subtitle_size', 'style_subtitle_color',
    'style_btn1_bg', 'style_btn1_color', 'style_btn1_hover_bg', 'style_btn1_hover_color',
    'style_btn2_bg', 'style_btn2_border', 'style_btn2_color',
    'style_btn2_hover_bg', 'style_btn2_hover_border', 'style_btn2_hover_color',
  ];
  for (const col of styleCols) {
    await db.query(`ALTER TABLE home_hero ADD COLUMN ${col} VARCHAR(100) NOT NULL DEFAULT ''`)
      .catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') console.error('[home] hero col:', col, e.message); });
  }
}
ensureHeroImageCols().catch(e => console.error('[home] hero col init:', e.message));

router.get('/hero', async (_req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM home_hero LIMIT 1');
    res.json(row || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const HERO_WRITABLE = new Set([
  'mantra', 'eyebrow', 'title_line1', 'title_em', 'title_line3',
  'subtitle', 'cta1_text', 'cta1_link', 'cta2_text', 'cta2_link',
  'bg_image_url', 'bg_image_mob_url', 'animation_image_url', 'animation_image_mob_url',
  'animation_html_desktop', 'animation_html_mobile',
  'portrait_url', 'portrait_mob_url',
  // style overrides
  'style_mantra_size', 'style_mantra_color',
  'style_eyebrow_size', 'style_eyebrow_color',
  'style_title_size', 'style_title_color', 'style_title_em_color',
  'style_subtitle_size', 'style_subtitle_color',
  'style_btn1_bg', 'style_btn1_color', 'style_btn1_hover_bg', 'style_btn1_hover_color',
  'style_btn2_bg', 'style_btn2_border', 'style_btn2_color',
  'style_btn2_hover_bg', 'style_btn2_hover_border', 'style_btn2_hover_color',
]);

router.put('/hero', verifyToken, async (req, res) => {
  try {
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => HERO_WRITABLE.has(k))
    );
    res.json(await upsertSingle('home_hero', data));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generic hero image upload helper
async function uploadHeroImage(req, res, colName) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/home/${req.file.filename}`;
  try {
    const [[row]] = await db.query('SELECT id, ?? FROM home_hero LIMIT 1', [colName]);
    if (row) {
      // Delete old file
      const old = row[colName];
      if (old && old.startsWith('/uploads/home/')) {
        fs.unlink(path.join(uploadDir, path.basename(old)), () => {});
      }
      await db.query(`UPDATE home_hero SET ${colName}=? WHERE id=?`, [url, row.id]);
    } else {
      await db.query(`INSERT INTO home_hero (${colName}) VALUES (?)`, [url]);
    }
    res.json({ url });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

router.post('/hero/bg-image',              verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'bg_image_url'));
router.post('/hero/bg-image-mob',          verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'bg_image_mob_url'));
router.post('/hero/animation-image',       verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'animation_image_url'));
router.post('/hero/animation-image-mob',   verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'animation_image_mob_url'));
router.post('/hero/portrait',              verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'portrait_url'));
router.post('/hero/portrait-mob',          verifyToken, upload.single('image'), (req, res) => uploadHeroImage(req, res, 'portrait_mob_url'));

// ── MARQUEE ───────────────────────────────────────────────────────────────────

async function ensureMarqueeStyleTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS home_marquee_style (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      bg_color     VARCHAR(50)  NOT NULL DEFAULT '',
      height_px    VARCHAR(10)  NOT NULL DEFAULT '',
      font_color   VARCHAR(50)  NOT NULL DEFAULT '',
      font_size_px VARCHAR(10)  NOT NULL DEFAULT ''
    )
  `);
}
ensureMarqueeStyleTable().catch(e => console.error('[home] marquee style table init:', e.message));

router.get('/marquee/style', async (_req, res) => {
  try {
    const [[row]] = await db.execute('SELECT * FROM home_marquee_style LIMIT 1');
    res.json(row || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/marquee/style', verifyToken, async (req, res) => {
  const { bg_color = '', height_px = '', font_color = '', font_size_px = '' } = req.body;
  try {
    const [[existing]] = await db.execute('SELECT id FROM home_marquee_style LIMIT 1');
    if (existing) {
      await db.execute(
        'UPDATE home_marquee_style SET bg_color=?, height_px=?, font_color=?, font_size_px=? WHERE id=?',
        [bg_color, height_px, font_color, font_size_px, existing.id]
      );
    } else {
      await db.execute(
        'INSERT INTO home_marquee_style (bg_color, height_px, font_color, font_size_px) VALUES (?,?,?,?)',
        [bg_color, height_px, font_color, font_size_px]
      );
    }
    const [[row]] = await db.execute('SELECT * FROM home_marquee_style LIMIT 1');
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/marquee', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_marquee_items ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/marquee', verifyToken, async (req, res) => {
  const { item_text, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_marquee_items (item_text, sort_order) VALUES (?,?)', [item_text, sort_order || 0]);
    const [[row]] = await db.query('SELECT * FROM home_marquee_items WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/marquee/:id', verifyToken, async (req, res) => {
  const { item_text, sort_order } = req.body;
  try {
    await db.query('UPDATE home_marquee_items SET item_text=?, sort_order=? WHERE id=?', [item_text, sort_order, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM home_marquee_items WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/marquee/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_marquee_items WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ABOUT ─────────────────────────────────────────────────────────────────────
router.get('/about', async (_req, res) => {
  try {
    const [[about]] = await db.query('SELECT * FROM home_about LIMIT 1');
    const [tags]    = await db.query('SELECT * FROM home_about_tags ORDER BY sort_order');
    res.json({ ...(about || {}), tags });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/about', verifyToken, async (req, res) => {
  const { heading1, heading_em, heading2, bio, quote, journey_btn_text } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM home_about LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE home_about SET heading1=?, heading_em=?, heading2=?, bio=?, quote=?, journey_btn_text=? WHERE id=?',
        [heading1, heading_em, heading2, bio, quote, journey_btn_text || '', ex[0].id]
      );
      const [[row]] = await db.query('SELECT * FROM home_about WHERE id=?', [ex[0].id]);
      res.json(row);
    } else {
      const [r] = await db.query(
        'INSERT INTO home_about (heading1, heading_em, heading2, bio, quote, journey_btn_text) VALUES (?,?,?,?,?,?)',
        [heading1, heading_em, heading2, bio, quote, journey_btn_text || '']
      );
      const [[row]] = await db.query('SELECT * FROM home_about WHERE id=?', [r.insertId]);
      res.json(row);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about/tags', verifyToken, async (req, res) => {
  const { tag_text, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_about_tags (tag_text, sort_order) VALUES (?,?)', [tag_text, sort_order || 0]);
    const [[row]] = await db.query('SELECT * FROM home_about_tags WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/about/tags/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_about_tags WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about/media', verifyToken, upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mediaUrl = `/uploads/home/${req.file.filename}`;
  try {
    const [ex] = await db.query('SELECT id, media_url FROM home_about LIMIT 1');
    if (ex.length) {
      // Delete the previous upload so stale files don't accumulate on disk
      const oldUrl = ex[0].media_url;
      if (oldUrl && oldUrl.startsWith('/uploads/home/')) {
        const oldPath = path.join(uploadDir, path.basename(oldUrl));
        fs.unlink(oldPath, () => {});
      }
      await db.query('UPDATE home_about SET media_url=? WHERE id=?', [mediaUrl, ex[0].id]);
    } else {
      await db.query('INSERT INTO home_about (media_url) VALUES (?)', [mediaUrl]);
    }
    res.json({ media_url: mediaUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about/journey-pdf', verifyToken, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const pdfUrl = `/uploads/home/${req.file.filename}`;
  try {
    const [ex] = await db.query('SELECT id FROM home_about LIMIT 1');
    if (ex.length) {
      await db.query('UPDATE home_about SET journey_pdf_url=? WHERE id=?', [pdfUrl, ex[0].id]);
    } else {
      await db.query('INSERT INTO home_about (journey_pdf_url) VALUES (?)', [pdfUrl]);
    }
    res.json({ pdf_url: pdfUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ARTICLES ──────────────────────────────────────────────────────────────────
router.get('/articles', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_articles ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/articles', verifyToken, async (req, res) => {
  const { featured, category, title, excerpt, pub_date, url, image_url, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_articles (featured,category,title,excerpt,pub_date,url,image_url,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [featured||0, category, title, excerpt, pub_date, url, image_url||null, sort_order||0]
    );
    const [[row]] = await db.query('SELECT * FROM home_articles WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/articles/:id', verifyToken, async (req, res) => {
  const { featured, category, title, excerpt, pub_date, url, image_url, sort_order } = req.body;
  try {
    // Only overwrite image_url when the client explicitly sends a non-empty value; otherwise preserve the
    // existing DB value so a plain text-field save never wipes a previously uploaded image.
    if (image_url !== undefined && image_url !== null && image_url !== '') {
      await db.query(
        'UPDATE home_articles SET featured=?,category=?,title=?,excerpt=?,pub_date=?,url=?,image_url=?,sort_order=? WHERE id=?',
        [featured||0, category, title, excerpt, pub_date, url, image_url, sort_order||0, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE home_articles SET featured=?,category=?,title=?,excerpt=?,pub_date=?,url=?,sort_order=? WHERE id=?',
        [featured||0, category, title, excerpt, pub_date, url, sort_order||0, req.params.id]
      );
    }
    const [[row]] = await db.query('SELECT * FROM home_articles WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/articles/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_articles WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/articles/:id/image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/home/${req.file.filename}`;
  try {
    const [[existing]] = await db.query('SELECT image_url FROM home_articles WHERE id=?', [req.params.id]);
    // Delete old image file so stale uploads don't accumulate on disk
    if (existing?.image_url && existing.image_url.startsWith('/uploads/home/')) {
      const oldPath = path.join(uploadDir, path.basename(existing.image_url));
      fs.unlink(oldPath, () => {});
    }
    await db.query('UPDATE home_articles SET image_url=? WHERE id=?', [imageUrl, req.params.id]);
    res.json({ image_url: imageUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── THEMES ────────────────────────────────────────────────────────────────────
router.get('/themes', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_themes ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/themes', verifyToken, async (req, res) => {
  const { theme_key, devanagari, name, description, count, sort_order, link_url } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_themes (theme_key,devanagari,name,description,count,sort_order,link_url) VALUES (?,?,?,?,?,?,?)',
      [theme_key, devanagari, name, description, count||0, sort_order||0, link_url||'']
    );
    const [[row]] = await db.query('SELECT * FROM home_themes WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/themes/:id', verifyToken, async (req, res) => {
  const { theme_key, devanagari, name, description, count, sort_order, link_url } = req.body;
  try {
    await db.query(
      'UPDATE home_themes SET theme_key=?,devanagari=?,name=?,description=?,count=?,sort_order=?,link_url=? WHERE id=?',
      [theme_key, devanagari, name, description, count||0, sort_order||0, link_url||'', req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM home_themes WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/themes/:id/icon', verifyToken, upload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const iconUrl = `/uploads/home/${req.file.filename}`;
  try {
    await db.query('UPDATE home_themes SET icon_url=? WHERE id=?', [iconUrl, req.params.id]);
    res.json({ icon_url: iconUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/themes/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_themes WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── QUOTE ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_quote' AND COLUMN_NAME = 'bg_image_url'`
    );
    if (!cols.length) {
      await db.query(`ALTER TABLE home_quote ADD COLUMN bg_image_url VARCHAR(500) NOT NULL DEFAULT ''`);
    }
  } catch (e) { console.error('[home_quote migration]', e.message); }
})();

router.get('/quote', async (_req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM home_quote LIMIT 1');
    res.json(row || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/quote', verifyToken, async (req, res) => {
  const { quote_text, quote_attr, quote_mark_url, ornament_url, bg_image_url } = req.body;
  try { res.json(await upsertSingle('home_quote', { quote_text, quote_attr, quote_mark_url, ornament_url, bg_image_url: bg_image_url ?? '' })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/quote/upload/quote-mark', verifyToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/home/${req.file.filename}`;
    try {
      const [[row]] = await db.query('SELECT id FROM home_quote LIMIT 1');
      if (row) {
        await db.query('UPDATE home_quote SET quote_mark_url=? WHERE id=?', [url, row.id]);
      } else {
        await db.query('INSERT INTO home_quote (quote_mark_url) VALUES (?)', [url]);
      }
      res.json({ url });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

router.post('/quote/upload/ornament', verifyToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/home/${req.file.filename}`;
    try {
      const [[row]] = await db.query('SELECT id FROM home_quote LIMIT 1');
      if (row) {
        await db.query('UPDATE home_quote SET ornament_url=? WHERE id=?', [url, row.id]);
      } else {
        await db.query('INSERT INTO home_quote (ornament_url) VALUES (?)', [url]);
      }
      res.json({ url });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

router.post('/quote/upload/bg-image', verifyToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/home/${req.file.filename}`;
    try {
      const [[row]] = await db.query('SELECT id FROM home_quote LIMIT 1');
      if (row) {
        await db.query('UPDATE home_quote SET bg_image_url=? WHERE id=?', [url, row.id]);
      } else {
        await db.query('INSERT INTO home_quote (bg_image_url) VALUES (?)', [url]);
      }
      res.json({ url });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// ── TALKS ─────────────────────────────────────────────────────────────────────
router.get('/talks', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_talks ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/talks', verifyToken, async (req, res) => {
  const { label, title, youtube_id, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_talks (label,title,youtube_id,sort_order) VALUES (?,?,?,?)',
      [label, title, youtube_id, sort_order||0]
    );
    const [[row]] = await db.query('SELECT * FROM home_talks WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/talks/:id', verifyToken, async (req, res) => {
  const { label, title, youtube_id, sort_order, thumb_url } = req.body;
  try {
    await db.query(
      'UPDATE home_talks SET label=?,title=?,youtube_id=?,sort_order=?,thumb_url=? WHERE id=?',
      [label, title, youtube_id, sort_order||0, thumb_url||'', req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM home_talks WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/talks/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_talks WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/talks/:id/thumb', verifyToken, (req, res) => {
  upload.single('thumb')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const thumbUrl = `/uploads/home/${req.file.filename}`;
    try {
      await db.query('UPDATE home_talks SET thumb_url=? WHERE id=?', [thumbUrl, req.params.id]);
      res.json({ thumb_url: thumbUrl });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// ── CONNECT ───────────────────────────────────────────────────────────────────
router.get('/connect', async (_req, res) => {
  try {
    const [[connect]] = await db.query('SELECT * FROM home_connect LIMIT 1');
    const [links]     = await db.query('SELECT * FROM home_connect_links ORDER BY sort_order');
    res.json({ ...(connect || {}), links });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/connect', verifyToken, async (req, res) => {
  const { description } = req.body;
  try { res.json(await upsertSingle('home_connect', { description })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/connect/links', verifyToken, async (req, res) => {
  const { href, icon, label, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_connect_links (href,icon,label,sort_order) VALUES (?,?,?,?)', [href, icon, label, sort_order||0]);
    const [[row]] = await db.query('SELECT * FROM home_connect_links WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/connect/links/:id', verifyToken, async (req, res) => {
  const { href, icon, label, sort_order } = req.body;
  try {
    await db.query('UPDATE home_connect_links SET href=?,icon=?,label=?,sort_order=? WHERE id=?', [href, icon, label, sort_order||0, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM home_connect_links WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/connect/links/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM home_connect_links WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── WHAT WE DO ────────────────────────────────────────────────────────────────

async function ensureWhatWeDoTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS home_whatwedo (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      eyebrow    VARCHAR(200) NOT NULL DEFAULT 'What We Do',
      heading    VARCHAR(300) NOT NULL DEFAULT '',
      heading_em VARCHAR(300) NOT NULL DEFAULT '',
      lede       TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS home_whatwedo_cards (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(200) NOT NULL DEFAULT '',
      description TEXT,
      link_text   VARCHAR(100) NOT NULL DEFAULT 'Learn More',
      link_url    VARCHAR(500) NOT NULL DEFAULT '#',
      icon_url    VARCHAR(500) NOT NULL DEFAULT '',
      sort_order  INT          NOT NULL DEFAULT 0
    )
  `);
}
ensureWhatWeDoTables().catch(e => console.error('[home] whatwedo table init:', e.message));

router.get('/whatwedo', async (_req, res) => {
  try {
    const [[section]] = await db.execute('SELECT * FROM home_whatwedo LIMIT 1');
    const [cards]     = await db.execute('SELECT * FROM home_whatwedo_cards ORDER BY sort_order');
    res.json({ section: section || {}, cards });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/whatwedo', verifyToken, async (req, res) => {
  try { res.json(await upsertSingle('home_whatwedo', req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/whatwedo/cards', verifyToken, async (req, res) => {
  const { title = '', description = '', link_text = 'Learn More', link_url = '#', sort_order = 0 } = req.body;
  try {
    const [r] = await db.execute(
      'INSERT INTO home_whatwedo_cards (title, description, link_text, link_url, sort_order) VALUES (?,?,?,?,?)',
      [title, description, link_text, link_url, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM home_whatwedo_cards WHERE id=?', [r.insertId]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/whatwedo/cards/:id', verifyToken, async (req, res) => {
  const { title = '', description = '', link_text = 'Learn More', link_url = '#', sort_order = 0 } = req.body;
  const id = req.params.id;
  try {
    await db.execute(
      'UPDATE home_whatwedo_cards SET title=?, description=?, link_text=?, link_url=?, sort_order=? WHERE id=?',
      [title, description, link_text, link_url, sort_order, id]
    );
    const [[row]] = await db.execute('SELECT * FROM home_whatwedo_cards WHERE id=?', [id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/whatwedo/cards/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM home_whatwedo_cards WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/whatwedo/cards/:id/icon', verifyToken, upload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const iconUrl = `/uploads/home/${req.file.filename}`;
  try {
    await db.execute('UPDATE home_whatwedo_cards SET icon_url=? WHERE id=?', [iconUrl, req.params.id]);
    res.json({ icon_url: iconUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
