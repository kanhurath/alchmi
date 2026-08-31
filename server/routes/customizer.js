const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// ── Upload setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'customizer');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Sections & defaults ───────────────────────────────────────────────────────
const SECTIONS = ['typography', 'colors', 'container', 'buttons', 'site-protection', 'header', 'footer', 'loader', 'favicon', 'admin-settings', 'inner-hero'];

const DEFAULTS = {
  typography: {
    bodyFont: 'Cormorant Garamond',
    headingFont: 'Josefin Sans',
    h1Size: '3.5', h1Unit: 'rem',
    h2Size: '2.5', h2Unit: 'rem',
    h3Size: '2.0', h3Unit: 'rem',
    h4Size: '1.5', h4Unit: 'rem',
    h5Size: '1.25', h5Unit: 'rem',
    h6Size: '1.0', h6Unit: 'rem',
    paragraphMarginBottom: '1', paragraphMarginUnit: 'em',
  },
  colors: {
    accent: '#d4670a',
    links: '#d4670a',
    headings: '#1a1208',
    bodyText: '#1a1208',
    borders: 'rgba(184,146,42,0.25)',
    siteBackground: '#faf6ee',
    contentBackground: '#f5edd8',
    darkBgEyebrow: '#ffffff',
    darkBgTitle:   '#ffffff',
    darkBgDesc:    'rgba(255,255,255,0.85)',
    darkBgLink:    'rgba(255,255,255,0.75)',
    darkBgBtn:          '#ffffff',
    darkBgMuted:        'rgba(255,255,255,0.6)',
    darkBgTitleEm:      'rgba(255,255,255,0.75)',
    darkBgBtnBg:        '#ffffff',
    darkBgBtnColor:     '#1a1208',
    darkBgBtnHoverBg:   '#f5e8d0',
    darkBgBtnHoverColor:'#1a1208',
  },
  container: {
    layout: 'standard',
    style: 'unboxed',
    containerWidth: 1200,
    narrowWidth: 750,
  },
  'site-protection': {
    frontendProtection: false,
    adminProtection:    false,
  },
  buttons: {
    textColor: '#ffffff',
    bgColor: '#d4670a',
    borderColor: 'transparent',
    font: 'Josefin Sans',
    paddingTop: '12', paddingRight: '28', paddingBottom: '12', paddingLeft: '28', paddingUnit: 'px',
    borderWidthTop: '0', borderWidthRight: '0', borderWidthBottom: '0', borderWidthLeft: '0',
    borderRadiusTop: '3', borderRadiusRight: '3', borderRadiusBottom: '3', borderRadiusLeft: '3', borderRadiusUnit: 'px',
  },
  header: {
    logoUrl:            '',
    logoWidth:          '',
    logoHeight:         '60',
    logoAlt:            'Vinay Kulkarni',
    tagline:            'Dharayati Iti Dharmaha',
    ctaText:            'Book a Session',
    ctaAction:          'modal',
    ctaLink:            '',
    navFontColor:       '',
    navHoverColor:      '',
    navActiveBarColor:  '',
    navActiveBarHeight: '',
    stickyBg:           '',
    stickyFontColor:    '',
    stickyHoverColor:   '',
    ctaBg:              '',
    ctaBorder:          '',
    ctaTextColor:       '',
    ctaHoverBg:         '',
    ctaHoverBorder:     '',
    ctaHoverTextColor:  '',
    dropdownBg:         '',
    dropdownFontColor:  '',
    dropdownHoverBg:    '',
    dropdownHoverColor: '',
  },
  footer: {
    logoUrl:       '',
    logoWidth:     '',
    logoHeight:    '80',
    logoAlt:       'Vinay Kulkarni',
    copyrightText: '© 2026 Vinay Kulkarni · All Rights Reserved',
    footerBg:      '',
    navFontColor:  '',
    navHoverColor: '',
  },
  loader: {
    bgColor:    '#8b2e33',
    iconType:   'text',
    iconText:   'ॐ',
    iconColor:  '#ffea00',
    iconUrl:    '',
    iconWidth:  '',
    iconHeight: '',
    lineColor:  '#ffea00',
  },
  favicon: {
    faviconUrl: '',
  },
  'inner-hero': {
    bgColor: '', bgImage: '', mandalaImage: '', afterColor: '', afterImage: '',
    eyebrowColor: '', eyebrowSize: '', eyebrowMobileSize: '',
    h1Color: '',     h1Size: '',     h1MobileSize: '',
    h1EmColor: '',   h1EmSize: '',   h1EmMobileSize: '',
    subColor: '',    subSize: '',    subMobileSize: '',
  },
  'admin-settings': {
    logoUrl:          '',
    siteName:         'Vinay Kulkarni',
    accentColor:      '#d4670a',
    sidebarBg:        '#1a1208',
    pageBg:           '#f0ece4',
    topbarBg:         '#ffffff',
    sidebarFontColor: '',
    sidebarFontSize:  '',
  },
};

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS global_customizer (
      section    VARCHAR(50) PRIMARY KEY,
      settings   LONGTEXT    NOT NULL,
      updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}
ensureTable().catch(e => console.error('[customizer] table init failed:', e.message));

// ── Helper: read current saved settings for a section ────────────────────────
async function getSaved(section) {
  const [[row]] = await db.execute('SELECT settings FROM global_customizer WHERE section=?', [section]);
  return row ? JSON.parse(row.settings) : {};
}

async function upsertSection(section, data) {
  await db.execute(
    `INSERT INTO global_customizer (section, settings) VALUES (?,?)
     ON DUPLICATE KEY UPDATE settings=VALUES(settings)`,
    [section, JSON.stringify(data)],
  );
}

// ── GET /api/customizer — all sections merged with defaults ───────────────────
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT section, settings FROM global_customizer');
    const result = {};
    SECTIONS.forEach(s => { result[s] = { ...DEFAULTS[s] }; });
    rows.forEach(r => {
      try {
        const saved = JSON.parse(r.settings);
        result[r.section] = { ...(DEFAULTS[r.section] || {}), ...saved };
      } catch (_) {}
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/customizer/:section ─────────────────────────────────────────────
router.get('/:section', async (req, res) => {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section' });
  try {
    const saved = await getSaved(section);
    res.json({ ...(DEFAULTS[section] || {}), ...saved });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/customizer/:section ─────────────────────────────────────────────
router.put('/:section', verifyToken, async (req, res) => {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section' });
  try {
    await upsertSection(section, req.body);
    res.json({ ...(DEFAULTS[section] || {}), ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/customizer/loader/icon — upload loader icon image ──────────────
router.post('/loader/icon', verifyToken, upload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const iconUrl = `/uploads/customizer/${req.file.filename}`;
  try {
    const saved = await getSaved('loader');
    if (saved.iconUrl && saved.iconUrl.startsWith('/uploads/customizer/')) {
      fs.unlink(path.join(uploadDir, path.basename(saved.iconUrl)), () => {});
    }
    const updated = { ...DEFAULTS.loader, ...saved, iconUrl };
    await upsertSection('loader', updated);
    res.json({ iconUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/customizer/favicon/image — upload favicon ──────────────────────
router.post('/favicon/image', verifyToken, upload.single('favicon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const faviconUrl = `/uploads/customizer/${req.file.filename}`;
  try {
    const saved = await getSaved('favicon');
    if (saved.faviconUrl && saved.faviconUrl.startsWith('/uploads/customizer/')) {
      fs.unlink(path.join(uploadDir, path.basename(saved.faviconUrl)), () => {});
    }
    const updated = { ...DEFAULTS.favicon, ...saved, faviconUrl };
    await upsertSection('favicon', updated);
    res.json({ faviconUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/customizer/header/logo — upload header logo ────────────────────
router.post('/header/logo', verifyToken, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/customizer/${req.file.filename}`;
  try {
    const saved = await getSaved('header');
    // Delete old logo file
    if (saved.logoUrl && saved.logoUrl.startsWith('/uploads/customizer/')) {
      fs.unlink(path.join(uploadDir, path.basename(saved.logoUrl)), () => {});
    }
    const updated = { ...DEFAULTS.header, ...saved, logoUrl };
    await upsertSection('header', updated);
    res.json({ logoUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/customizer/footer/logo — upload footer logo ────────────────────
router.post('/footer/logo', verifyToken, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/customizer/${req.file.filename}`;
  try {
    const saved = await getSaved('footer');
    if (saved.logoUrl && saved.logoUrl.startsWith('/uploads/customizer/')) {
      fs.unlink(path.join(uploadDir, path.basename(saved.logoUrl)), () => {});
    }
    const updated = { ...DEFAULTS.footer, ...saved, logoUrl };
    await upsertSection('footer', updated);
    res.json({ logoUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/customizer/admin-settings/logo — upload admin logo ─────────────
router.post('/admin-settings/logo', verifyToken, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/customizer/${req.file.filename}`;
  try {
    const saved = await getSaved('admin-settings');
    if (saved.logoUrl && saved.logoUrl.startsWith('/uploads/customizer/')) {
      fs.unlink(path.join(uploadDir, path.basename(saved.logoUrl)), () => {});
    }
    const updated = { ...DEFAULTS['admin-settings'], ...saved, logoUrl };
    await upsertSection('admin-settings', updated);
    res.json({ logoUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Helper: upload an image for inner-hero and save the URL ──────────────────
async function uploadInnerHeroImage(req, res, field) {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/customizer/${req.file.filename}`;
    try {
      const saved = await getSaved('inner-hero');
      // Delete old file if it was previously uploaded
      const oldUrl = saved[field];
      if (oldUrl && oldUrl.startsWith('/uploads/customizer/')) {
        fs.unlink(path.join(uploadDir, path.basename(oldUrl)), () => {});
      }
      const updated = { ...DEFAULTS['inner-hero'], ...saved, [field]: imageUrl };
      await upsertSection('inner-hero', updated);
      res.json({ url: imageUrl });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

router.post('/inner-hero/bg-image',      verifyToken, (req, res) => uploadInnerHeroImage(req, res, 'bgImage'));
router.post('/inner-hero/mandala-image', verifyToken, (req, res) => uploadInnerHeroImage(req, res, 'mandalaImage'));
router.post('/inner-hero/after-image',   verifyToken, (req, res) => uploadInnerHeroImage(req, res, 'afterImage'));

module.exports = router;
