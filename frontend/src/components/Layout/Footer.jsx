import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const NAV_API  = `${API_ROOT}/navigation`;

const STATIC_COLUMNS = [
  { id: 'explore', label: 'Explore', children: [
    { label: 'Recognition', url: '/recognition',          is_external: false },
    { label: 'Biography',   url: '/biography',            is_external: false },
    { label: 'Articles',    url: '/articles',             is_external: false },
    { label: 'Teaching',    url: '/teaching',             is_external: false },
    { label: 'Videos',      url: '/videos',               is_external: false },
  ]},
  { id: 'connect', label: 'Connect', children: [
    { label: 'Connect',     url: '/connect',              is_external: false },
    { label: 'Gallery',     url: '/gallery',              is_external: false },
    { label: 'Newsletter',  url: 'https://zcmp.in/xO0w', is_external: true  },
  ]},
  { id: 'legal', label: 'Legal', children: [
    { label: 'Privacy Policy',              url: '/privacy',  is_external: false },
    { label: 'Terms & Conditions',          url: '/terms',    is_external: false },
    { label: 'Refund & Cancellation Policy', url: '/refund',  is_external: false },
  ]},
];

function NavLink({ link }) {
  let url = link.url || '/';
  // If the URL is absolute but points to this same site, strip the origin
  // so React Router can handle it as an internal <Link>.
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === window.location.hostname) {
        url = parsed.pathname + parsed.search + parsed.hash;
      } else {
        // Genuinely external — always open in new tab
        return <a href={url} target="_blank" rel="noreferrer">{link.label}</a>;
      }
    } catch (_) { /* malformed URL — fall through */ }
  }
  if (link.is_external) {
    return <a href={url} target="_blank" rel="noreferrer">{link.label}</a>;
  }
  return <Link to={url}>{link.label}</Link>;
}

function Footer() {
  const [columns,        setColumns]        = useState(STATIC_COLUMNS);
  const [footerSettings, setFooterSettings] = useState({
    logoUrl: '', logoWidth: '', logoHeight: '80', logoAlt: 'Vinay Kulkarni',
    tagline: 'Insights and resources on strategy, marketing, and growth.',
    copyrightText: '© 2026 Vinay Kulkarni · All Rights Reserved',
    footerBg: '', navFontColor: '', navHoverColor: '',
  });

  useEffect(() => {
    fetch(NAV_API)
      .then(r => r.json())
      .then(data => {
        const tree = data.footer || [];
        if (!tree.length) return;

        const hasColumns = tree.some(i => i.children?.length > 0);
        if (hasColumns) {
          // Admin set up a proper column/group structure — use it directly.
          setColumns(tree);
        } else {
          // Admin has flat items (no column groups).
          // Build a URL map keyed by normalised label so we can patch STATIC_COLUMNS
          // with the correct URLs the admin configured, while keeping the 3-column layout.
          const urlMap = {};
          tree.forEach(item => {
            const key = item.label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            urlMap[key] = { url: item.url, is_external: item.is_external };
          });

          const patched = STATIC_COLUMNS.map(col => ({
            ...col,
            children: col.children.map(child => {
              const key = child.label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
              return urlMap[key] ? { ...child, ...urlMap[key] } : child;
            }),
          }));
          setColumns(patched);
        }
      })
      .catch(() => {});
    fetch(`${API_ROOT}/customizer/footer`)
      .then(r => r.json())
      .then(d => setFooterSettings(s => ({ ...s, ...d })))
      .catch(() => {});
  }, []);

  const fs = footerSettings;

  const logoSrc = fs.logoUrl
    ? (fs.logoUrl.startsWith('http') ? fs.logoUrl : `${API_ROOT.replace('/api', '')}${fs.logoUrl}`)
    : null;

  const dynamicCss = [
    fs.footerBg      ? `.footer { background: ${fs.footerBg} !important; }` : '',
    fs.navFontColor  ? `.footer-col-links a { color: ${fs.navFontColor} !important; }` : '',
    fs.navHoverColor ? `.footer-col-links a:hover { color: ${fs.navHoverColor} !important; }` : '',
  ].filter(Boolean).join('\n');

  return (
    <>
      {dynamicCss && <style>{dynamicCss}</style>}
      <footer className="footer">
        <div className="footer-inner">

          {/* Brand column */}
          <div className="footer-brand">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={fs.logoAlt || 'Vinay Kulkarni'}
                className="footer-brand-logo"
                style={{
                  width:  fs.logoWidth  ? `${fs.logoWidth}px`  : undefined,
                  height: fs.logoHeight ? `${fs.logoHeight}px` : undefined,
                }}
              />
            ) : (
              <span className="footer-brand-name">{fs.logoAlt || 'Alchmi'}</span>
            )}
            {fs.tagline && <p className="footer-tagline">{fs.tagline}</p>}
          </div>

          {/* Nav columns */}
          {columns.map(col => (
            <div className="footer-col" key={col.id || col.label}>
              <div className="footer-col-heading">{col.label}</div>
              <ul className="footer-col-links">
                {(col.children || []).map(link => (
                  <li key={link.id || link.label}>
                    <NavLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="footer-bottom">
          <span>{fs.copyrightText}</span>
        </div>
      </footer>
    </>
  );
}

export default Footer;
