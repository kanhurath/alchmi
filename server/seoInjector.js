'use strict';

const fs  = require('fs');
const db  = require('./db');
const {
  buildArticleTags,
  buildPageTags,
  injectTags,
  DIST_HTML,
  SITE_URL,
} = require('./seoHtmlBuilder');

const LOADER_DEFAULTS = {
  bgColor: '#8b2e33', iconType: 'text', iconText: 'ॐ',
  iconColor: '#ffea00', iconUrl: '', iconWidth: '', iconHeight: '', lineColor: '#ffea00',
};
const FAVICON_DEFAULTS = { faviconUrl: '' };

async function fetchLoaderAndFavicon() {
  try {
    const [rows] = await db.query(
      "SELECT section, settings FROM global_customizer WHERE section IN ('loader','favicon')"
    );
    let loader  = { ...LOADER_DEFAULTS };
    let favicon = { ...FAVICON_DEFAULTS };
    for (const row of rows) {
      try {
        const s = JSON.parse(row.settings);
        if (row.section === 'loader')  loader  = { ...LOADER_DEFAULTS,  ...s };
        if (row.section === 'favicon') favicon = { ...FAVICON_DEFAULTS, ...s };
      } catch {}
    }
    return { loader, favicon };
  } catch {
    return { loader: LOADER_DEFAULTS, favicon: FAVICON_DEFAULTS };
  }
}

function buildLoaderScript({ loader, favicon }) {
  // Resolve relative upload URLs to absolute so the inline script works
  // without knowing the API base at injection time.
  const site = SITE_URL.includes('localhost') ? '' : SITE_URL;
  if (loader.iconUrl && !loader.iconUrl.startsWith('http')) {
    loader = { ...loader, iconUrl: site + loader.iconUrl };
  }
  if (favicon.faviconUrl && !favicon.faviconUrl.startsWith('http')) {
    favicon = { ...favicon, faviconUrl: site + favicon.faviconUrl };
  }
  const data = JSON.stringify({ loader, favicon });
  return `  <script>window.__LOADER_SETTINGS__=${data};</script>`;
}

// Maps static URL paths to page_seo.page_slug values in the DB.
const PATH_TO_SLUG = {
  '/':             'home',
  '/biography':    'biography',
  '/teaching':     'teaching',
  '/videos':       'videos',
  '/connect':      'connect',
  '/events':       'events',
  '/news':         'news',
  '/gallery':      'gallery',
  '/workshops':    'workshops',
  '/testimonials': 'testimonials',
  '/articles':     'articles',
};

async function injectSeo(urlPath) {
  const template = fs.readFileSync(DIST_HTML, 'utf8');
  const loaderData = await fetchLoaderAndFavicon();
  let tags = '';

  // ── Individual article page: /articles/:slug ─────────────────────────────
  const articleMatch = urlPath.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) {
    const slug = articleMatch[1];
    try {
      const [[article]] = await db.query(
        `SELECT slug, title, excerpt, seo_title, meta_description,
                og_image_url, featured_image_url, canonical_url,
                tags, pub_date, author_name
         FROM articles
         WHERE slug = ? AND status = 'published' LIMIT 1`,
        [slug]
      );
      if (article) {
        tags = buildArticleTags(article);
      } else {
        console.warn('[seo-injector] article not found for slug:', slug);
      }
    } catch (err) {
      console.error('[seo-injector] article query error for slug:', slug, err.message);
    }
  }

  // ── Static CMS page ───────────────────────────────────────────────────────
  if (!tags) {
    const pageSlug = PATH_TO_SLUG[urlPath] || null;
    if (pageSlug) {
      try {
        const [[row]] = await db.query(
          'SELECT * FROM page_seo WHERE page_slug = ?',
          [pageSlug]
        );
        if (row) tags = buildPageTags(row);
      } catch (err) {
        console.error('[seo-injector] page_seo query error for slug:', pageSlug, err.message);
      }
    }
  }

  // ── Fallback: generic site tags ───────────────────────────────────────────
  if (!tags) tags = buildPageTags({});

  // Prepend loader/favicon settings script so React has them before first render
  const loaderScript = buildLoaderScript(loaderData);
  return injectTags(template, `${loaderScript}\n${tags}`);
}

module.exports = { injectSeo, PATH_TO_SLUG };
