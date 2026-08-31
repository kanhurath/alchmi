import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ── Slug map ──────────────────────────────────────────────────────────────────
// Must stay in sync with server/seoInjector.js PATH_TO_SLUG.
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

// ── HTML helpers (mirrors seoInjector.js buildTags) ───────────────────────────
function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildDevTags(seo, serverOrigin) {
  if (!seo || !Object.keys(seo).some(k => seo[k])) return '';

  const title = esc(seo.seo_title || '');
  const lines = [];

  if (title) {
    lines.push(`<title>${title}</title>`);
    lines.push(`<meta property="og:title" content="${title}">`);
    lines.push(`<meta name="twitter:title" content="${title}">`);
  }
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
  if (seo.og_image_url) {
    const img = seo.og_image_url.startsWith('http')
      ? seo.og_image_url
      : `${serverOrigin}${seo.og_image_url}`;
    lines.push(`<meta property="og:image" content="${esc(img)}">`);
    lines.push(`<meta property="og:image:width" content="1200">`);
    lines.push(`<meta property="og:image:height" content="630">`);
    lines.push(`<meta name="twitter:image" content="${esc(img)}">`);
  }
  lines.push(`<meta property="og:type" content="website">`);
  lines.push(`<meta property="og:site_name" content="Vinay Kulkarni">`);
  lines.push(`<meta property="og:locale" content="en_IN">`);
  lines.push(`<meta name="twitter:card" content="${seo.og_image_url ? 'summary_large_image' : 'summary'}">`);
  if (seo.custom_schema) {
    // Escape </script> to prevent the tag from being closed prematurely
    const safe = seo.custom_schema.replace(/<\/script>/gi, '<\\/script>');
    lines.push(`<script type="application/ld+json">${safe}</script>`);
  }

  return lines.map(l => `  ${l}`).join('\n');
}

// ── Dev SEO + Loader plugin ───────────────────────────────────────────────────
// Runs only during `vite dev`. On every HTML page request it fetches SEO data
// and loader/favicon settings from the Express API and injects them into
// <head> — making behaviour identical to the production server injection.
function seoDevPlugin(apiBase) {
  const origin = apiBase.replace(/\/api$/, ''); // e.g. http://localhost:3001

  return {
    name: 'vk-seo-dev',
    apply: 'serve', // dev only — production uses server/seoInjector.js

    transformIndexHtml: {
      order: 'post', // after Vite's own HTML transforms
      async handler(html, ctx) {
        const url  = (ctx.originalUrl || '/').split('?')[0];
        const slug = PATH_TO_SLUG[url];

        // ── Loader / favicon settings (injected on every page) ───────────────
        let loaderScript = '';
        try {
          const res = await fetch(`${apiBase}/customizer`, {
            signal: AbortSignal.timeout(1500),
          });
          if (res.ok) {
            const data   = await res.json();
            const loader  = data.loader  || {};
            const favicon = data.favicon || {};
            // Resolve relative upload URLs so they work from the Vite origin
            if (loader.iconUrl && !loader.iconUrl.startsWith('http')) {
              loader.iconUrl = origin + loader.iconUrl;
            }
            if (favicon.faviconUrl && !favicon.faviconUrl.startsWith('http')) {
              favicon.faviconUrl = origin + favicon.faviconUrl;
            }
            loaderScript = `  <script>window.__LOADER_SETTINGS__=${JSON.stringify({ loader, favicon })};</script>`;
          }
        } catch (err) {
          console.warn(`[vk-seo-dev] Could not inject loader settings: ${err.message}`);
        }

        // ── Per-page SEO tags ─────────────────────────────────────────────────
        let seoTags = '';
        if (slug) {
          try {
            const res = await fetch(`${apiBase}/seo/${slug}`, {
              signal: AbortSignal.timeout(1500),
            });
            if (res.ok) {
              const seo = await res.json();
              seoTags   = buildDevTags(seo, origin);
              if (seoTags && seo.seo_title) {
                html = html.replace(/<title>[^<]*<\/title>/, '');
              }
            }
          } catch (err) {
            console.warn(`[vk-seo-dev] Could not inject SEO tags for "${url}": ${err.message}`);
          }
        }

        const inject = [loaderScript, seoTags].filter(Boolean).join('\n');
        if (!inject) return html;
        return html.replace('</head>', `${inject}\n  </head>`);
      },
    },
  };
}

// ── Vite config ───────────────────────────────────────────────────────────────
export default defineConfig(({ mode }) => {
  const env    = loadEnv(mode, process.cwd(), 'VITE_');
  // In production mode, fall back to the live domain. In dev mode .env.development.local supplies localhost.
  const apiBase = env.VITE_API_URL || (mode === 'production' ? 'http://localhost:3001/api' : 'http://localhost:3001/api');

  // Derive the local Express origin for the dev proxy (strip /api suffix)
  const localOrigin = apiBase.replace(/\/api$/, ''); // e.g. http://localhost:3001

  return {
    plugins: [
      react(),
      seoDevPlugin(apiBase),
    ],
    assetsInclude: ['**/*.pdf'],
    // In dev, proxy /uploads/ and /api/ to the Express server so root-relative
    // upload URLs work the same as in production (no VITE_SERVER_URL prefix needed).
    server: {
      proxy: {
        '/uploads': { target: localOrigin, changeOrigin: true },
        '/api':     { target: localOrigin, changeOrigin: true },
      },
    },
  };
});
