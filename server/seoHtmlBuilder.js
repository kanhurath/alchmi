'use strict';

/**
 * seoHtmlBuilder.js
 *
 * Shared utilities for building SEO meta tags and writing pre-rendered
 * article HTML files into frontend/dist so that static hosts (nginx, CDN)
 * serve correct SEO without needing Node.js to handle the request.
 */

const fs   = require('fs');
const path = require('path');

// Built frontend is deployed directly at public_html/ (index.html + assets/),
// not public_html/frontend/dist — there is no frontend/dist on this server.
const DIST_DIR  = path.join(__dirname, '..');
const DIST_HTML = path.join(DIST_DIR, 'index.html');
const _rawSiteUrl = process.env.SITE_URL || 'http://localhost:3001';
if (_rawSiteUrl.includes('localhost') || _rawSiteUrl.includes('127.0.0.1')) {
  console.warn(
    '[seo-html] WARNING: SITE_URL is set to a localhost address (%s). ' +
    'Canonical URLs and OG image paths in generated SEO HTML will be wrong. ' +
    'Set SITE_URL=http://localhost:3001 in your .env file.',
    _rawSiteUrl
  );
}
const SITE_URL = _rawSiteUrl.replace(/\/$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SITE_URL}${url}`;
}

// ── Tag builders ──────────────────────────────────────────────────────────────

function buildArticleTags(article) {
  const title    = esc(article.seo_title || article.title || 'Article — Vinay Kulkarni');
  const rawDesc  = article.meta_description || stripHtml(article.excerpt).substring(0, 200);
  const desc     = esc(rawDesc);
  const canonical = article.canonical_url || `${SITE_URL}/articles/${article.slug}`;
  const img      = resolveImage(article.og_image_url || article.featured_image_url);
  const lines    = [];

  lines.push(`<title>${title}</title>`);

  if (desc) {
    lines.push(`<meta name="description" content="${desc}">`);
    lines.push(`<meta property="og:description" content="${desc}">`);
    lines.push(`<meta name="twitter:description" content="${desc}">`);
  }
  if (article.tags) {
    lines.push(`<meta name="keywords" content="${esc(String(article.tags).replace(/,/g, ', '))}">`);
  }

  lines.push(`<link rel="canonical" href="${esc(canonical)}">`);
  lines.push(`<meta property="og:url" content="${esc(canonical)}">`);

  if (img) {
    lines.push(`<meta property="og:image" content="${esc(img)}">`);
    lines.push(`<meta property="og:image:width" content="1200">`);
    lines.push(`<meta property="og:image:height" content="630">`);
    lines.push(`<meta name="twitter:image" content="${esc(img)}">`);
  }

  lines.push(`<meta property="og:title" content="${title}">`);
  lines.push(`<meta property="og:type" content="article">`);
  lines.push(`<meta property="og:site_name" content="Vinay Kulkarni">`);
  lines.push(`<meta property="og:locale" content="en_IN">`);
  lines.push(`<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`);
  lines.push(`<meta name="twitter:title" content="${title}">`);

  if (article.pub_date) {
    lines.push(`<meta property="article:published_time" content="${new Date(article.pub_date).toISOString()}">`);
  }
  if (article.author_name) {
    lines.push(`<meta property="article:author" content="${esc(article.author_name)}">`);
  }

  // JSON-LD structured data
  const schema = {
    '@context':    'https://schema.org',
    '@type':       'Article',
    headline:      article.seo_title || article.title,
    url:           canonical,
    author:        { '@type': 'Person', name: article.author_name || 'Vinay Kulkarni' },
    publisher:     { '@type': 'Organization', name: 'Vinay Kulkarni', url: SITE_URL },
  };
  if (rawDesc)       schema.description  = rawDesc;
  if (img)           schema.image        = img;
  if (article.pub_date) schema.datePublished = new Date(article.pub_date).toISOString();

  lines.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);

  return lines.map(l => `    ${l}`).join('\n');
}

function buildPageTags(seo) {
  const title = esc(seo.seo_title || 'Vinay Kulkarni — Dharayati Iti Dharmaha');
  const img   = resolveImage(seo.og_image_url);
  const lines = [];

  lines.push(`<title>${title}</title>`);

  if (seo.meta_description) {
    lines.push(`<meta name="description" content="${esc(seo.meta_description)}">`);
    lines.push(`<meta property="og:description" content="${esc(seo.meta_description)}">`);
    lines.push(`<meta name="twitter:description" content="${esc(seo.meta_description)}">`);
  }
  if (seo.focus_keyword) {
    lines.push(`<meta name="keywords" content="${esc(seo.focus_keyword)}">`);
  }
  if (seo.canonical_url) {
    lines.push(`<link rel="canonical" href="${esc(seo.canonical_url)}">`);
    lines.push(`<meta property="og:url" content="${esc(seo.canonical_url)}">`);
  }
  if (img) {
    lines.push(`<meta property="og:image" content="${esc(img)}">`);
    lines.push(`<meta property="og:image:width" content="1200">`);
    lines.push(`<meta property="og:image:height" content="630">`);
    lines.push(`<meta name="twitter:image" content="${esc(img)}">`);
  }

  lines.push(`<meta property="og:title" content="${title}">`);
  lines.push(`<meta property="og:type" content="website">`);
  lines.push(`<meta property="og:site_name" content="Vinay Kulkarni">`);
  lines.push(`<meta property="og:locale" content="en_IN">`);
  lines.push(`<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`);
  lines.push(`<meta name="twitter:title" content="${title}">`);

  if (seo.custom_schema) {
    const safe = seo.custom_schema.replace(/<\/script>/gi, '<\\/script>');
    lines.push(`<script type="application/ld+json">${safe}</script>`);
  }

  return lines.map(l => `    ${l}`).join('\n');
}

// ── Template injection ────────────────────────────────────────────────────────

function injectTags(template, tags) {
  // Use function replacement so any `$` chars in titles/descriptions
  // are never misread as regex backreferences by String.prototype.replace()
  const cleaned = template.replace(/<title>[\s\S]*?<\/title>/, () => '');
  return cleaned.replace('</head>', () => `${tags}\n  </head>`);
}

// ── Static file writer ────────────────────────────────────────────────────────

/**
 * Writes frontend/dist/articles/<slug>/index.html with baked-in SEO tags.
 * Called after every article create/update so nginx serves correct SEO
 * without needing Node.js to handle the HTML request.
 *
 * Fails silently (logs only) so it never breaks the API response.
 */
function writeArticleSeoHtml(article) {
  try {
    if (!fs.existsSync(DIST_HTML)) return; // no build yet — skip silently
    if (!article.slug) return;

    const template = fs.readFileSync(DIST_HTML, 'utf8');
    const tags     = buildArticleTags(article);
    const html     = injectTags(template, tags);

    const outDir  = path.join(DIST_DIR, 'articles', article.slug);
    const outFile = path.join(outDir, 'index.html');

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
    console.log(`[seo-html] wrote dist/articles/${article.slug}/index.html`);
  } catch (err) {
    console.error(`[seo-html] failed for "${article.slug}":`, err.message);
  }
}

/**
 * Removes frontend/dist/articles/<slug>/index.html when an article is deleted
 * or unpublished so nginx no longer serves a stale pre-rendered file.
 */
function removeArticleSeoHtml(slug) {
  try {
    const outFile = path.join(DIST_DIR, 'articles', slug, 'index.html');
    if (fs.existsSync(outFile)) {
      fs.unlinkSync(outFile);
      console.log(`[seo-html] removed dist/articles/${slug}/index.html`);
    }
  } catch (err) {
    console.error(`[seo-html] remove failed for "${slug}":`, err.message);
  }
}

module.exports = {
  esc,
  stripHtml,
  resolveImage,
  buildArticleTags,
  buildPageTags,
  injectTags,
  writeArticleSeoHtml,
  removeArticleSeoHtml,
  DIST_HTML,
  DIST_DIR,
  SITE_URL,
};
