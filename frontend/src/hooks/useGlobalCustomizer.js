import { useEffect, useState } from 'react';
import { getCustomizer } from '../services/customizerApi';

// ── Shared utilities ──────────────────────────────────────────────────────────

function _isAdminRoute() {
  return window.location.pathname.startsWith('/admin');
}

// Single overlay element shared by both protection contexts
function _showOverlay(ms = 400) {
  const overlay = document.getElementById('vk-ss-overlay');
  if (!overlay) return;
  overlay.style.opacity = '1';
  overlay.style.display = 'block';
  clearTimeout(overlay.__t);
  overlay.__t = setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
  }, ms);
}

function _ensureOverlay() {
  if (document.getElementById('vk-ss-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'vk-ss-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:#000', 'display:none', 'opacity:0',
    'transition:opacity 0.15s ease', 'pointer-events:none',
  ].join(';');
  document.body.appendChild(overlay);
}

// ── Frontend-protection handlers (skip when on an admin route) ───────────────
// Route-based check is used instead of DOM-ancestry (_inAdmin) because React
// portals (modals, dropdowns) render outside .adm-root, making DOM checks
// unreliable. The URL is always accurate regardless of render location.

function _fe_onContextMenu(e) { if (_isAdminRoute()) return; e.preventDefault(); }
function _fe_onSelectStart(e) { if (_isAdminRoute()) return; e.preventDefault(); }
function _fe_onDragStart(e)   { if (_isAdminRoute()) return; e.preventDefault(); }
function _fe_onCopy(e) {
  if (_isAdminRoute()) return;
  e.preventDefault();
  try { e.clipboardData?.setData('text/plain', ''); } catch (_) {}
}
function _fe_onKeyDown(e) {
  if (_isAdminRoute()) return;
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && 'cxspa'.includes(k.toLowerCase())) e.preventDefault();
  if (k === 'PrintScreen') { e.preventDefault(); _showOverlay(900); }
}
function _fe_onKeyUp(e) {
  if (_isAdminRoute()) return;
  if (e.key === 'PrintScreen') {
    navigator.clipboard?.writeText('').catch(() => {});
    _showOverlay(900);
  }
}
function _fe_onWindowBlur() {
  if (!_isAdminRoute()) _showOverlay(350);
}

// ── Admin-protection handlers (skip when NOT on an admin route) ───────────────

function _adm_onContextMenu(e) { if (!_isAdminRoute()) return; e.preventDefault(); }
function _adm_onSelectStart(e) { if (!_isAdminRoute()) return; e.preventDefault(); }
function _adm_onDragStart(e)   { if (!_isAdminRoute()) return; e.preventDefault(); }
function _adm_onCopy(e) {
  if (!_isAdminRoute()) return;
  e.preventDefault();
  try { e.clipboardData?.setData('text/plain', ''); } catch (_) {}
}
function _adm_onKeyDown(e) {
  if (!_isAdminRoute()) return;
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && 'cxspa'.includes(k.toLowerCase())) e.preventDefault();
  if (k === 'PrintScreen') { e.preventDefault(); _showOverlay(900); }
}
function _adm_onKeyUp(e) {
  if (!_isAdminRoute()) return;
  if (e.key === 'PrintScreen') {
    navigator.clipboard?.writeText('').catch(() => {});
    _showOverlay(900);
  }
}
function _adm_onWindowBlur() {
  if (_isAdminRoute()) _showOverlay(350);
}

// ── Frontend init / teardown ──────────────────────────────────────────────────

function _initFrontendProtection() {
  if (document.__vkFeProtected) return;
  document.__vkFeProtected = true;

  _ensureOverlay();
  document.addEventListener('contextmenu', _fe_onContextMenu, true);
  document.addEventListener('selectstart', _fe_onSelectStart, true);
  document.addEventListener('dragstart',   _fe_onDragStart,   true);
  document.addEventListener('copy',        _fe_onCopy,        true);
  document.addEventListener('keydown',     _fe_onKeyDown,     true);
  document.addEventListener('keyup',       _fe_onKeyUp,       true);
  window.addEventListener('blur',          _fe_onWindowBlur);

  // Disable selection on public pages; admin explicitly uses `text` (not `auto`)
  // because `auto` resolves to the parent's computed value and inherits `none`
  // through React wrapper divs, so it would silently re-enable protection in admin.
  let style = document.getElementById('vk-fe-protection-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'vk-fe-protection-css';
    document.head.appendChild(style);
  }
  style.textContent = `
    body * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    .adm-root, .adm-root * {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }
  `;
}

function _teardownFrontendProtection() {
  if (!document.__vkFeProtected) return;
  document.__vkFeProtected = false;

  document.removeEventListener('contextmenu', _fe_onContextMenu, true);
  document.removeEventListener('selectstart', _fe_onSelectStart, true);
  document.removeEventListener('dragstart',   _fe_onDragStart,   true);
  document.removeEventListener('copy',        _fe_onCopy,        true);
  document.removeEventListener('keydown',     _fe_onKeyDown,     true);
  document.removeEventListener('keyup',       _fe_onKeyUp,       true);
  window.removeEventListener('blur',          _fe_onWindowBlur);

  const style = document.getElementById('vk-fe-protection-css');
  if (style) style.textContent = '';
}

// ── Admin init / teardown ─────────────────────────────────────────────────────

function _initAdminProtection() {
  if (document.__vkAdmProtected) return;
  document.__vkAdmProtected = true;

  _ensureOverlay();
  document.addEventListener('contextmenu', _adm_onContextMenu, true);
  document.addEventListener('selectstart', _adm_onSelectStart, true);
  document.addEventListener('dragstart',   _adm_onDragStart,   true);
  document.addEventListener('copy',        _adm_onCopy,        true);
  document.addEventListener('keydown',     _adm_onKeyDown,     true);
  document.addEventListener('keyup',       _adm_onKeyUp,       true);
  window.addEventListener('blur',          _adm_onWindowBlur);

  // Disable selection only inside .adm-root
  let style = document.getElementById('vk-adm-protection-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'vk-adm-protection-css';
    document.head.appendChild(style);
  }
  style.textContent = `
    .adm-root, .adm-root * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
  `;
}

function _teardownAdminProtection() {
  if (!document.__vkAdmProtected) return;
  document.__vkAdmProtected = false;

  document.removeEventListener('contextmenu', _adm_onContextMenu, true);
  document.removeEventListener('selectstart', _adm_onSelectStart, true);
  document.removeEventListener('dragstart',   _adm_onDragStart,   true);
  document.removeEventListener('copy',        _adm_onCopy,        true);
  document.removeEventListener('keydown',     _adm_onKeyDown,     true);
  document.removeEventListener('keyup',       _adm_onKeyUp,       true);
  window.removeEventListener('blur',          _adm_onWindowBlur);

  const style = document.getElementById('vk-adm-protection-css');
  if (style) style.textContent = '';
}

// ── Google Fonts ──────────────────────────────────────────────────────────────

const BUNDLED_FONTS = new Set([
  'Cormorant Garamond',
  'Josefin Sans',
  'Noto Serif Devanagari',
]);

function loadGoogleFont(fontName) {
  if (!fontName || BUNDLED_FONTS.has(fontName)) return;
  const id = `gf-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const slug = fontName.replace(/\s+/g, '+');
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${slug}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap`;
  document.head.appendChild(link);
}

// ── Customizer settings ───────────────────────────────────────────────────────

export function applyCustomizerSettings({
  typography    = {},
  colors        = {},
  container     = {},
  buttons       = {},
  'site-protection': protection = {},
  favicon       = {},
  'inner-hero': innerHero = {},
}) {
  // ── Content protection — each toggle is fully independent ───────────────────
  if (protection.frontendProtection) _initFrontendProtection();
  else                               _teardownFrontendProtection();

  if (protection.adminProtection) _initAdminProtection();
  else                            _teardownAdminProtection();

  const root = document.documentElement;
  let css = '';

  // ── Google Fonts ────────────────────────────────────────────────────────────
  if (typography.bodyFont)    loadGoogleFont(typography.bodyFont);
  if (typography.headingFont) loadGoogleFont(typography.headingFont);
  if (buttons.font)           loadGoogleFont(buttons.font);

  // ── Colors → CSS variables ──────────────────────────────────────────────────
  if (colors.accent)            root.style.setProperty('--saffron', colors.accent);
  if (colors.links)             root.style.setProperty('--gold',    colors.links);
  if (colors.bodyText)          root.style.setProperty('--ink',     colors.bodyText);
  if (colors.siteBackground)    root.style.setProperty('--cream',   colors.siteBackground);
  if (colors.contentBackground) {
    root.style.setProperty('--parchment',  colors.contentBackground);
    root.style.setProperty('--section-bg', colors.contentBackground);
  }
  if (colors.borders) root.style.setProperty('--border', colors.borders);

  // ── Dark background font colors → CSS variables ─────────────────────────────
  if (colors.darkBgEyebrow) root.style.setProperty('--dark-bg-eyebrow', colors.darkBgEyebrow);
  if (colors.darkBgTitle)   root.style.setProperty('--dark-bg-title',   colors.darkBgTitle);
  if (colors.darkBgDesc)    root.style.setProperty('--dark-bg-desc',     colors.darkBgDesc);
  if (colors.darkBgLink)    root.style.setProperty('--dark-bg-link',     colors.darkBgLink);
  if (colors.darkBgBtn)     root.style.setProperty('--dark-bg-btn',      colors.darkBgBtn);
  if (colors.darkBgMuted)   root.style.setProperty('--dark-bg-muted',    colors.darkBgMuted);
  if (colors.darkBgTitleEm)      root.style.setProperty('--dark-bg-title-em',        colors.darkBgTitleEm);
  if (colors.darkBgBtnBg)        root.style.setProperty('--dark-bg-btn-bg',           colors.darkBgBtnBg);
  if (colors.darkBgBtnColor)     root.style.setProperty('--dark-bg-btn-color',        colors.darkBgBtnColor);
  if (colors.darkBgBtnHoverBg)   root.style.setProperty('--dark-bg-btn-hover-bg',     colors.darkBgBtnHoverBg);
  if (colors.darkBgBtnHoverColor) root.style.setProperty('--dark-bg-btn-hover-color', colors.darkBgBtnHoverColor);

  // ── Colors → direct CSS rules (override hardcoded component values) ─────────
  // Uses !important so class-level component selectors don't win over these rules.
  if (colors.headings) {
    css += `h1,h2,h3,h4,h5,h6,.section-title { color: ${colors.headings} !important; }\n`;
  }
  if (colors.bodyText) {
    css += `body { color: ${colors.bodyText} !important; }\n`;
  }
  if (colors.siteBackground) {
    css += `body { background-color: ${colors.siteBackground} !important; }\n`;
  }
  if (colors.accent) {
    css += `.section-label,.section-label::before { color: ${colors.accent} !important; background-color: ${colors.accent} !important; }\n`;
  }
  if (colors.links) {
    css += `.section-title em { color: ${colors.links} !important; }\n`;
  }

  // ── Dark background section overrides (must come after global heading/label rules) ──
  // These use more specific selectors so they win over the !important global rules above.
  if (colors.darkBgTitle) {
    css += [
      '.inner-cta-strip h2',
      '.connect-left .section-title',
      '.mth-fw-dark .mth-fw-title',
      '.mth-fw-dark .mth-check-title',
      '.mth-cta-heading',
      '.svc-retreats-title',
      '.svc-gluttons-title',
      '.svc-cta-heading',
      '.home-page .talk-title',
      '.inner-hero h1',
      '.quote-text',
    ].join(',') + ` { color: ${colors.darkBgTitle} !important; }\n`;
  }
  if (colors.darkBgEyebrow) {
    css += `.inner-hero-eyebrow,.connect-left .section-label,.home-page .talk-label { color: ${colors.darkBgEyebrow} !important; }\n`;
    css += `.inner-hero-eyebrow::before,.connect-left .section-label::before { background-color: ${colors.darkBgEyebrow} !important; }\n`;
  }
  if (colors.darkBgDesc) {
    css += [
      '.inner-cta-strip p',
      '.connect-desc',
      '.mth-fw-dark .mth-fw-body',
      '.mth-cta-desc',
      '.svc-retreats-desc',
      '.svc-gluttons-tagline',
      '.inner-hero-sub',
    ].join(',') + ` { color: ${colors.darkBgDesc} !important; }\n`;
  }
  if (colors.darkBgLink) {
    css += `.inner-hero-breadcrumb a,.quote-attr,.connect-link { color: ${colors.darkBgLink} !important; }\n`;
  }
  if (colors.darkBgBtn) {
    css += `.btn-outline-light,.svc-btn-outline,.mth-btn-outline,.svc-action-btn { color: ${colors.darkBgBtn} !important; }\n`;
    css += `.btn-outline-light:hover,.svc-btn-outline:hover,.mth-btn-outline:hover { border-color: ${colors.darkBgBtn} !important; }\n`;
  }
  if (colors.darkBgMuted) {
    css += `.inner-hero-breadcrumb,.footer-nav a,.footer-copy { color: ${colors.darkBgMuted} !important; }\n`;
  }
  if (colors.darkBgTitleEm) {
    css += `.inner-cta-strip h2 em,.connect-left .section-title em,.mth-fw-dark .mth-fw-title em,.mth-cta-heading em,.svc-retreats-title em,.svc-gluttons-title em,.svc-cta-heading em,.inner-hero h1 em { color: ${colors.darkBgTitleEm} !important; }\n`;
  }
  if (colors.darkBgBtnBg) {
    css += `.svc-btn-primary,.mth-btn-primary,.btn-light,.svc-action-btn { background: ${colors.darkBgBtnBg} !important; }\n`;
  }
  if (colors.darkBgBtnColor) {
    css += `.svc-btn-primary,.mth-btn-primary,.btn-light,.svc-action-btn { color: ${colors.darkBgBtnColor} !important; }\n`;
  }
  if (colors.darkBgBtnHoverBg) {
    css += `.svc-btn-primary:hover,.mth-btn-primary:hover,.btn-light:hover,.svc-action-btn:hover { background: ${colors.darkBgBtnHoverBg} !important; }\n`;
  }
  if (colors.darkBgBtnHoverColor) {
    css += `.svc-btn-primary:hover,.mth-btn-primary:hover,.btn-light:hover,.svc-action-btn:hover { color: ${colors.darkBgBtnHoverColor} !important; }\n`;
  }

  // ── Typography ──────────────────────────────────────────────────────────────
  if (typography.bodyFont) {
    css += `body { font-family: '${typography.bodyFont}', Georgia, serif; }\n`;
  }
  if (typography.headingFont) {
    css += `h1,h2,h3,h4,h5,h6 { font-family: '${typography.headingFont}', sans-serif; }\n`;
  }
  ['h1','h2','h3','h4','h5','h6'].forEach(h => {
    const size = typography[`${h}Size`];
    const unit = typography[`${h}Unit`] || 'rem';
    if (size) css += `${h} { font-size: ${size}${unit}; }\n`;
  });
  if (typography.paragraphMarginBottom) {
    const unit = typography.paragraphMarginUnit || 'em';
    css += `p { margin-bottom: ${typography.paragraphMarginBottom}${unit}; }\n`;
  }

  // ── Container ───────────────────────────────────────────────────────────────
  if (container.containerWidth) root.style.setProperty('--gc-container-width', `${container.containerWidth}px`);
  if (container.narrowWidth)    root.style.setProperty('--gc-narrow-width',    `${container.narrowWidth}px`);
  if (container.style === 'boxed') {
    css += `body { max-width: var(--gc-container-width, 1200px); margin: 0 auto; box-shadow: 0 0 40px rgba(0,0,0,0.08); }\n`;
  }

  // ── Buttons ─────────────────────────────────────────────────────────────────
  root.style.setProperty('--gc-btn-text',   buttons.textColor   || '#fff');
  root.style.setProperty('--gc-btn-bg',     buttons.bgColor     || '#d4670a');
  root.style.setProperty('--gc-btn-border', buttons.borderColor || 'transparent');
  const pu = buttons.paddingUnit      || 'px';
  const ru = buttons.borderRadiusUnit || 'px';
  root.style.setProperty('--gc-btn-padding',
    `${buttons.paddingTop||12}${pu} ${buttons.paddingRight||28}${pu} ${buttons.paddingBottom||12}${pu} ${buttons.paddingLeft||28}${pu}`
  );
  root.style.setProperty('--gc-btn-radius',
    `${buttons.borderRadiusTop||3}${ru} ${buttons.borderRadiusRight||3}${ru} ${buttons.borderRadiusBottom||3}${ru} ${buttons.borderRadiusLeft||3}${ru}`
  );
  root.style.setProperty('--gc-btn-border-width',
    `${buttons.borderWidthTop||0}px ${buttons.borderWidthRight||0}px ${buttons.borderWidthBottom||0}px ${buttons.borderWidthLeft||0}px`
  );
  if (buttons.font) {
    css += `.booking-btn, .btn-primary, .profile-cta, .newsletter-btn, .load-more-btn,
            .adm-btn-primary { font-family: '${buttons.font}', sans-serif; }\n`;
  }

  // ── Favicon ─────────────────────────────────────────────────────────────────
  if (favicon.faviconUrl) {
    const apiRoot = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
    const href    = favicon.faviconUrl.startsWith('http') ? favicon.faviconUrl : `${apiRoot}${favicon.faviconUrl}`;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  // ── Inner Hero ──────────────────────────────────────────────────────────────
  const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
  const ihUrl = (u) => u ? (u.startsWith('http') ? u : `${SERVER_ORIGIN}${u}`) : null;

  if (innerHero.bgColor || innerHero.bgImage) {
    const bgParts = [];
    if (innerHero.bgImage) bgParts.push(`url('${ihUrl(innerHero.bgImage)}')`);
    if (innerHero.bgColor) bgParts.push(innerHero.bgColor);
    else if (innerHero.bgImage) bgParts.push('linear-gradient(175deg,#f3b33e 0%,#de7336 100%)');
    css += `.inner-hero { background: ${bgParts.join(', ')} !important; background-size: cover !important; background-position: center !important; }\n`;
  }
  if (innerHero.afterColor) {
    css += `.inner-hero::after { color: ${innerHero.afterColor} !important; }\n`;
  }
  if (innerHero.afterImage) {
    css += `.inner-hero::after { content: '' !important; background-image: url('${ihUrl(innerHero.afterImage)}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: right center !important; width: 45vw !important; height: 90% !important; top: 50% !important; transform: translateY(-50%) !important; }\n`;
  }
  if (innerHero.mandalaImage) {
    css += `.hero-mandala { background-image: url('${ihUrl(innerHero.mandalaImage)}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; }\n`;
    css += `.hero-mandala .mandala-svg { opacity: 0 !important; }\n`;
  }

  // ── Inner Hero Typography ────────────────────────────────────────────────────
  const ihTypo = [
    { color: innerHero.eyebrowColor, size: innerHero.eyebrowSize, mobileSize: innerHero.eyebrowMobileSize, sel: '.inner-hero-eyebrow' },
    { color: innerHero.h1Color,      size: innerHero.h1Size,      mobileSize: innerHero.h1MobileSize,      sel: '.inner-hero h1' },
    { color: innerHero.h1EmColor,    size: innerHero.h1EmSize,    mobileSize: innerHero.h1EmMobileSize,    sel: '.inner-hero h1 em' },
    { color: innerHero.subColor,     size: innerHero.subSize,     mobileSize: innerHero.subMobileSize,     sel: '.inner-hero-sub' },
  ];
  ihTypo.forEach(({ color, size, mobileSize, sel }) => {
    if (color)      css += `${sel} { color: ${color} !important; }\n`;
    if (size)       css += `${sel} { font-size: ${size}px !important; }\n`;
    if (mobileSize) css += `@media (max-width: 767px) { ${sel} { font-size: ${mobileSize}px !important; } }\n`;
  });

  // ── Inject override stylesheet ───────────────────────────────────────────────
  let styleEl = document.getElementById('gc-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'gc-overrides';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

const DEF_LOADER = {
  bgColor: '#8b2e33', iconType: 'text', iconText: 'ॐ',
  iconColor: '#ffea00', iconUrl: '', iconWidth: '', iconHeight: '', lineColor: '#ffea00',
};

const LOADER_CACHE_KEY = 'vk_loader_settings';

function readInitialLoader() {
  // 1. Server-injected settings (zero-latency, correct on first visit)
  try {
    if (window.__LOADER_SETTINGS__?.loader) {
      return { ...DEF_LOADER, ...window.__LOADER_SETTINGS__.loader };
    }
  } catch {}
  // 2. localStorage cache (correct on repeat visits without server injection)
  try {
    const raw = localStorage.getItem(LOADER_CACHE_KEY);
    if (raw) return { ...DEF_LOADER, ...JSON.parse(raw) };
  } catch {}
  // 3. Hardcoded defaults (only on true first visit with no server injection)
  return DEF_LOADER;
}

function writeLoaderCache(settings) {
  try { localStorage.setItem(LOADER_CACHE_KEY, JSON.stringify(settings)); } catch {}
}

export function useGlobalCustomizer() {
  // Initialise from server-injected data, localStorage cache, or defaults — in that order
  const [loaderSettings, setLoaderSettings] = useState(readInitialLoader);

  useEffect(() => {
    // Apply server-injected favicon immediately (before API fetch completes)
    try {
      const injected = window.__LOADER_SETTINGS__?.favicon?.faviconUrl;
      if (injected) {
        let link = document.querySelector("link[rel='icon']");
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = injected;
      }
    } catch {}

    getCustomizer()
      .then(data => {
        applyCustomizerSettings(data);
        if (data.loader) {
          const merged = { ...DEF_LOADER, ...data.loader };
          writeLoaderCache(merged);
          setLoaderSettings(merged);
        }
      })
      .catch(() => {});
  }, []);

  return { loaderSettings };
}
