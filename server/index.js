const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { injectSeo } = require('./seoInjector');
// Built frontend is deployed directly at public_html/ (index.html + assets/),
// not public_html/frontend/dist — there is no frontend/dist on this server.
const FRONTEND_DIST = path.join(__dirname, '..');

const biographyRoutes = require('./routes/biography');
const homeRoutes      = require('./routes/home');
const teachingRoutes  = require('./routes/teaching');
const videosRoutes    = require('./routes/videos');
const eventsRoutes    = require('./routes/events');
const workshopsRoutes     = require('./routes/workshops');
const testimonialsRoutes  = require('./routes/testimonials');
const connectRoutes       = require('./routes/connect');
const galleryRoutes       = require('./routes/gallery');
const authRoutes          = require('./routes/auth');
const navigationRoutes    = require('./routes/navigation');
const customPagesRoutes   = require('./routes/customPages');
const siteBlocksRoutes    = require('./routes/siteBlocks');
const seoRoutes           = require('./routes/seo');
const sectionLayoutRoutes = require('./routes/sectionLayout');
const usersRoutes         = require('./routes/users');
const newsRoutes          = require('./routes/news');
const pageStatusRoutes    = require('./routes/pageStatus');
const customizerRoutes    = require('./routes/customizer');
const articlesRoutes      = require('./routes/articles');
const sectionStylesRoutes = require('./routes/sectionStyles');
const servicesRoutes      = require('./routes/services');
const methodologyRoutes   = require('./routes/methodology');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:3001',
  'https://www.alchmi.com',
  'https://www.vinaykulkarni.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3001',
];
// CLIENT_URL / ALLOWED_ORIGINS let local dev and staging add origins via .env
// without touching source code (e.g. ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173)
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    .forEach(o => allowedOrigins.push(o));
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable caching for all API responses — prevents CDN/proxy from serving stale image URLs after CMS updates
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Serve uploaded images — filenames are unique (timestamp + random) so immutable caching is safe
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '365d',
  immutable: true,
  etag: false,
  lastModified: false,
}));
// Any /uploads/* path that express.static didn't match (file doesn't exist)
// must 404 here, not fall through to the SPA catch-all below — otherwise a
// missing image silently returns 200 text/html (the SPA shell), which
// browsers can't decode and gets cached as "real" for 365 days.
app.use('/uploads', (_req, res) => res.status(404).end());

// Serve built frontend (assets: js/css/images served directly)
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST, { index: false }));
}

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/navigation',    navigationRoutes);
app.use('/api/custom-pages',  customPagesRoutes);
app.use('/api/site-blocks',   siteBlocksRoutes);
app.use('/api/seo',            seoRoutes);
app.use('/api/section-layout', sectionLayoutRoutes);
app.use('/api/home',      homeRoutes);
app.use('/api/biography', biographyRoutes);
app.use('/api/teaching',  teachingRoutes);
app.use('/api/videos',    videosRoutes);
app.use('/api/events',    eventsRoutes);
app.use('/api/workshops',    workshopsRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/connect',      connectRoutes);
app.use('/api/gallery',      galleryRoutes);
app.use('/api/users',        usersRoutes);
app.use('/api/news',         newsRoutes);
app.use('/api/page-status',  pageStatusRoutes);
app.use('/api/customizer',      customizerRoutes);
app.use('/api/articles',        articlesRoutes);
app.use('/api/section-styles',  sectionStylesRoutes);
app.use('/api/services',        servicesRoutes);
app.use('/api/methodology',     methodologyRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// SPA catch-all: inject per-page SEO into index.html before sending
if (fs.existsSync(FRONTEND_DIST)) {
  app.get('*', async (req, res) => {
    // Prevent CDN/proxy from caching HTML so every crawler request
    // gets fresh, page-specific SEO tags from the injector.
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    try {
      const html = await injectSeo(req.path);
      res.send(html);
    } catch (err) {
      console.error('[seo-injector] failed for', req.path, err.message);
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`CMS server running on port ${PORT}`);
});
