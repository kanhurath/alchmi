import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const NAV_API  = `${API_ROOT}/navigation`;

const STATIC_LINKS = [
  { label: 'Biography',            url: '/biography',           is_external: false },
  { label: 'Articles',             url: '/articles',            is_external: false },
  { label: 'Teaching',             url: '/teaching',            is_external: false },
  { label: 'Videos',               url: '/videos',              is_external: false },
  { label: 'Events',               url: '/events',              is_external: false },
  { label: 'Workshops & Retreats', url: '/workshops',           is_external: false },
  { label: 'Connect',              url: '/connect',             is_external: false },
  { label: 'Gallery',              url: '/gallery',             is_external: false },
  { label: 'Newsletter',           url: 'https://zcmp.in/xO0w', is_external: true  },
];

function Footer() {
  const [links,          setLinks]          = useState(STATIC_LINKS);
  const [footerSettings, setFooterSettings] = useState({
    logoUrl: '', logoWidth: '', logoHeight: '80', logoAlt: 'Vinay Kulkarni', copyrightText: '© 2026 Vinay Kulkarni · All Rights Reserved',
    footerBg: '', navFontColor: '', navHoverColor: '',
  });

  useEffect(() => {
    fetch(NAV_API)
      .then(r => r.json())
      .then(data => { if (data.footer?.length) setLinks(data.footer); })
      .catch(() => {});
    fetch(`${API_ROOT}/customizer/footer`)
      .then(r => r.json())
      .then(d => setFooterSettings(s => ({ ...s, ...d })))
      .catch(() => {});
  }, []);

  const logoSrc = footerSettings.logoUrl
    ? (footerSettings.logoUrl.startsWith('http')
        ? footerSettings.logoUrl
        : `${API_ROOT.replace('/api', '')}${footerSettings.logoUrl}`)
    : null;

  const fs = footerSettings;
  const dynamicCss = [
    fs.footerBg      ? `.footer { background: ${fs.footerBg} !important; }` : '',
    fs.navFontColor  ? `.footer-nav a { color: ${fs.navFontColor} !important; }` : '',
    fs.navHoverColor ? `.footer-nav a:hover { color: ${fs.navHoverColor} !important; }` : '',
  ].filter(Boolean).join('\n');

  return (
    <>
      {dynamicCss && <style>{dynamicCss}</style>}
      <footer className="footer">
      {logoSrc && (
        <div className="footer-logo">
          <img
            src={logoSrc}
            alt={footerSettings.logoAlt || 'Vinay Kulkarni'}
            className="footer-logo-img"
            style={{
              width:  footerSettings.logoWidth  ? `${footerSettings.logoWidth}px`  : undefined,
              height: footerSettings.logoHeight ? `${footerSettings.logoHeight}px` : undefined,
            }}
          />
        </div>
      )}
      <ul className="footer-nav">
        {links.map(link => (
          <li key={link.label}>
            {link.is_external ? (
              <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
            ) : (
              <Link to={link.url}>{link.label}</Link>
            )}
          </li>
        ))}
      </ul>
      <div className="footer-copy">{footerSettings.copyrightText}</div>
    </footer>
    </>
  );
}

export default Footer;
