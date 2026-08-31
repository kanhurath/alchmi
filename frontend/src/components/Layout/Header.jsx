import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navigationLinks as staticLinks } from '../../data/contentConfig';
import { useBookingModal } from '../../context/BookingModalContext';
import './Header.css';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const NAV_API  = `${API_ROOT}/navigation`;

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [closedDropdown, setClosedDropdown] = useState(null);
  const [navigationLinks, setNavigationLinks] = useState(staticLinks);
  const [headerSettings, setHeaderSettings] = useState({
    logoUrl: '', logoWidth: '', logoHeight: '60', logoAlt: 'Vinay Kulkarni', tagline: 'Dharayati Iti Dharmaha', ctaText: 'Book a Session', ctaAction: 'modal', ctaLink: '',
    navFontColor: '', navHoverColor: '', navActiveBarColor: '', navActiveBarHeight: '',
    stickyBg: '', stickyFontColor: '', stickyHoverColor: '',
    ctaBg: '', ctaBorder: '', ctaTextColor: '',
    ctaHoverBg: '', ctaHoverBorder: '', ctaHoverTextColor: '',
    dropdownBg: '', dropdownFontColor: '', dropdownHoverBg: '', dropdownHoverColor: '',
  });
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    fetch(`${API_ROOT}/customizer/header`)
      .then(r => r.json())
      .then(d => setHeaderSettings(s => ({ ...s, ...d })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(NAV_API)
      .then(r => r.json())
      .then(data => {
        if (data.header?.length) {
          setNavigationLinks(data.header.map(item => ({
            id:       String(item.id),
            label:    item.label,
            path:     item.url,
            external: !!item.is_external,
            ...(item.children?.length ? {
              children: item.children.map(c => ({
                id:       String(c.id),
                label:    c.label,
                path:     c.url,
                external: !!c.is_external,
              })),
            } : {}),
          })));
        }
      })
      .catch(() => {}); // keep static fallback on error
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
  }, [location]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close desktop submenu when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { openModal } = useBookingModal();

  const logoSrc = headerSettings.logoUrl
    ? (headerSettings.logoUrl.startsWith('http')
        ? headerSettings.logoUrl
        : `${API_ROOT.replace('/api', '')}${headerSettings.logoUrl}`)
    : null;

  const handleCta = () => {
    if (headerSettings.ctaAction === 'url' && headerSettings.ctaLink) {
      if (headerSettings.ctaLink.startsWith('http')) {
        window.open(headerSettings.ctaLink, '_blank', 'noreferrer');
      } else {
        window.location.href = headerSettings.ctaLink;
      }
    } else {
      openModal();
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);
  const toggle    = () => setIsMobileMenuOpen((o) => !o);

  const toggleSubmenu = (id) =>
    setOpenSubmenu((current) => (current === id ? null : id));

  const isParentActive = (link) =>
    location.pathname === link.path ||
    (link.children && link.children.some((c) => location.pathname === c.path));

  const hs = headerSettings;
  const barH = hs.navActiveBarHeight ? `${hs.navActiveBarHeight}px` : '2px';
  const dynamicCss = [
    // nav default
    hs.navFontColor       ? `.nav-link { color: ${hs.navFontColor} !important; }` : '',
    hs.navFontColor       ? `.nav-hamburger span { background: ${hs.navFontColor} !important; }` : '',
    // nav hover / active color
    hs.navHoverColor      ? `.nav-link:hover, .nav-link.active { color: ${hs.navHoverColor} !important; }` : '',
    // active bar color + height
    hs.navActiveBarColor  ? `.nav-link::after { background: ${hs.navActiveBarColor} !important; }` : '',
    hs.navActiveBarHeight ? `.nav-link::after { height: ${barH} !important; }` : '',
    // sticky default
    hs.stickyFontColor    ? `.navbar.scrolled .nav-link { color: ${hs.stickyFontColor} !important; }` : '',
    hs.stickyFontColor    ? `.navbar.scrolled .nav-hamburger span { background: ${hs.stickyFontColor} !important; }` : '',
    // sticky hover
    hs.stickyHoverColor   ? `.navbar.scrolled .nav-link:hover, .navbar.scrolled .nav-link.active { color: ${hs.stickyHoverColor} !important; }` : '',
    // cta default
    hs.ctaBg              ? `.nav-cta { background: ${hs.ctaBg} !important; }` : '',
    hs.ctaBorder          ? `.nav-cta { border-color: ${hs.ctaBorder} !important; }` : '',
    hs.ctaTextColor       ? `.nav-cta { color: ${hs.ctaTextColor} !important; }` : '',
    // cta hover
    hs.ctaHoverBg         ? `.nav-cta:hover { background: ${hs.ctaHoverBg} !important; }` : '',
    hs.ctaHoverBorder     ? `.nav-cta:hover { border-color: ${hs.ctaHoverBorder} !important; }` : '',
    hs.ctaHoverTextColor  ? `.nav-cta:hover { color: ${hs.ctaHoverTextColor} !important; }` : '',
    // dropdown bg + arrow caret
    hs.dropdownBg         ? `.nav-dropdown { background: ${hs.dropdownBg} !important; }` : '',
    hs.dropdownBg         ? `.nav-dropdown::before { background: ${hs.dropdownBg} !important; }` : '',
    // dropdown font
    hs.dropdownFontColor  ? `.nav-dropdown-link { color: ${hs.dropdownFontColor} !important; }` : '',
    // dropdown hover
    hs.dropdownHoverBg    ? `.nav-dropdown-link:hover, .nav-dropdown-link.active { background: ${hs.dropdownHoverBg} !important; }` : '',
    hs.dropdownHoverColor ? `.nav-dropdown-link:hover, .nav-dropdown-link.active { color: ${hs.dropdownHoverColor} !important; }` : '',
  ].filter(Boolean).join('\n');

  return (
    <>
      {dynamicCss && <style>{dynamicCss}</style>}
      {/* Backdrop */}
      <div
        className={`mobile-backdrop${isMobileMenuOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        className={`mobile-menu${isMobileMenuOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-logo">
            <strong>Vinay Kulkarni</strong>
            {headerSettings.tagline}
          </div>
          <button
            className="mobile-close"
            onClick={closeMenu}
            aria-label="Close menu"
          />
        </div>

        <div className="mobile-menu-body">
          {navigationLinks.map((link) => (
            <div key={link.id} className="mm-item-wrap">
              {link.children ? (
                <>
                  <button
                    className={`mmlink mmlink-parent${openSubmenu === link.id ? ' submenu-open' : ''}`}
                    onClick={() => toggleSubmenu(link.id)}
                    aria-expanded={openSubmenu === link.id}
                  >
                    {link.label}
                    <span className="mm-chevron" aria-hidden="true" />
                  </button>
                  <div className={`mm-submenu${openSubmenu === link.id ? ' open' : ''}`}>
                    <Link
                      to={link.path}
                      className="mmlink mmsub-link"
                      onClick={closeMenu}
                    >
                      All {link.label}
                    </Link>
                    {link.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className="mmlink mmsub-link"
                        onClick={closeMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={link.path}
                  className="mmlink"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          <div className="mm-cta-wrap">
            <button
              className="mobile-cta-btn"
              onClick={() => { closeMenu(); handleCta(); }}
            >
              {headerSettings.ctaText}
            </button>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav
        ref={navRef}
        className={`navbar${isScrolled ? ' scrolled' : ''}`}
        style={isScrolled ? {
          ...(headerSettings.stickyBg        ? { background: headerSettings.stickyBg }                  : {}),
          ...(headerSettings.stickyFontColor ? { '--nav-sticky-color': headerSettings.stickyFontColor } : {}),
        } : {}}
      >
        <Link to="/" className="nav-logo">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={headerSettings.logoAlt || 'Vinay Kulkarni'}
              className="nav-logo-img"
              style={{
                width:  headerSettings.logoWidth  ? `${headerSettings.logoWidth}px`  : undefined,
                height: headerSettings.logoHeight ? `${headerSettings.logoHeight}px` : undefined,
              }}
            />
          ) : (
            <span className="nav-logo-text">{headerSettings.logoAlt || 'Vinay Kulkarni'}</span>
          )}
        </Link>

        <ul className="nav-links">
          {navigationLinks.map((link) => (
            <li
              key={link.id}
              className={`${link.children ? 'has-submenu' : ''}${closedDropdown === link.id ? ' dropdown-closed' : ''}`}
              onMouseLeave={() => link.children && setClosedDropdown(null)}
            >
              <Link
                to={link.path}
                className={`nav-link${isParentActive(link) ? ' active' : ''}${link.children ? ' has-arrow' : ''}`}
                onClick={() => link.children && setClosedDropdown(link.id)}
              >
                {link.label}
              </Link>
              {link.children && (
                <ul className="nav-dropdown">
                  {link.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={child.path}
                        className={`nav-dropdown-link${location.pathname === child.path ? ' active' : ''}`}
                        onClick={() => setClosedDropdown(link.id)}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <button className="nav-cta" onClick={handleCta}>
          {headerSettings.ctaText}
        </button>

        <button
          className={`nav-hamburger${isMobileMenuOpen ? ' open' : ''}`}
          onClick={toggle}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </>
  );
}

export default Header;
