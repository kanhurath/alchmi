import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_PAGES } from './pageRegistry';
import { getAdminSettings } from '../../services/customizerApi';
import './AdminLayout.css';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

function resolveLogoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_ROOT}${url}`;
}

function applyAdminVars(s) {
  const root = document.documentElement;
  root.style.setProperty('--adm-sidebar-bg', s.sidebarBg   || '#1a1208');
  root.style.setProperty('--adm-accent',     s.accentColor || '#d4670a');
  root.style.setProperty('--adm-page-bg',    s.pageBg      || '#f0ece4');
  root.style.setProperty('--adm-topbar-bg',  s.topbarBg    || '#ffffff');
}

function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pagesOpen,    setPagesOpen]    = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [adminSettings, setAdminSettings] = useState({ logoUrl: '', siteName: 'Vinay Kulkarni' });

  useEffect(() => {
    getAdminSettings()
      .then(s => { setAdminSettings(s); applyAdminVars(s); })
      .catch(() => {});

    // Stay in sync when WebsiteSettingsAdmin saves new values
    const onSettingsChange = (e) => {
      setAdminSettings(e.detail);
      applyAdminVars(e.detail);
    };
    window.addEventListener('adm-settings-change', onSettingsChange);
    return () => {
      window.removeEventListener('adm-settings-change', onSettingsChange);
      document.title = 'Vinay Kulkarni — Dharayati Iti Dharmaha'; // restore public title on unmount
    };
  }, []);

  // Update browser tab title whenever the page or site name changes
  useEffect(() => {
    const siteName = adminSettings.siteName || 'Vinay Kulkarni';
    const pageName =
      pathname.includes('website-settings') ? 'Website Settings'
      : pathname.includes('customizer')     ? 'Customizer'
      : pathname.includes('builder')        ? 'Page Builder'
      : pathname.includes('navigation')     ? 'Navigation'
      : pathname.includes('users')          ? 'Users'
      : pathname.includes('dashboard')      ? 'Dashboard'
      : ADMIN_PAGES.find(p => pathname.startsWith(p.adminPath))?.label || 'Admin';
    document.title = `${pageName} — ${siteName} CMS`;
  }, [pathname, adminSettings.siteName]);

  const logoSrc = resolveLogoUrl(adminSettings.logoUrl) || null;

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const isOnPages = pathname.startsWith('/admin/pages');

  const sidebarBg  = adminSettings.sidebarBg   || '#1a1208';
  const pageBg     = adminSettings.pageBg      || '#f0ece4';
  const topbarBg   = adminSettings.topbarBg    || '#ffffff';

  // Build scoped CSS for sidebar nav typography (targets class selectors — must use <style>)
  const sidebarTypoCss = [
    adminSettings.sidebarFontColor
      ? `.adm-nav-item, .adm-nav-group-trigger, .adm-page-item, .adm-footer-link { color: ${adminSettings.sidebarFontColor} !important; }`
      : '',
    adminSettings.sidebarFontSize
      ? `.adm-nav-item, .adm-nav-group-trigger, .adm-page-item, .adm-footer-link { font-size: ${adminSettings.sidebarFontSize}px !important; }`
      : '',
  ].filter(Boolean).join('\n');

  return (
    <div className="adm-root" style={{ background: pageBg }}>
      {sidebarTypoCss && <style>{sidebarTypoCss}</style>}

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ background: sidebarBg }}>

        {/* Brand */}
        <div className="adm-brand">
          {logoSrc
            ? <img src={logoSrc} alt={adminSettings.siteName || 'Admin'} className="adm-brand-logo" />
            : <span className="adm-brand-text">{adminSettings.siteName || 'Admin'}</span>
          }
        </div>

        {/* Main nav */}
        <nav className="adm-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">◈</span>
            Dashboard
          </NavLink>

          {/* Page Builder */}
          <NavLink
            to="/admin/builder"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">⊞</span>
            Page Builder
          </NavLink>

          {/* Navigation */}
          <NavLink
            to="/admin/navigation"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">≡</span>
            Navigation
          </NavLink>

          {/* Customizer */}
          <NavLink
            to="/admin/customizer"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">✦</span>
            Customizer
          </NavLink>

          {/* Website Settings */}
          <NavLink
            to="/admin/website-settings"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">⚙</span>
            Website Settings
          </NavLink>

          {/* Users — visible only to super_admin */}
          {user?.role === 'super_admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="adm-nav-icon">◉</span>
              Users
            </NavLink>
          )}

          {/* Pages section */}
          <div className="adm-nav-group">
            <button
              className={`adm-nav-group-trigger${isOnPages ? ' active' : ''}`}
              onClick={() => setPagesOpen(o => !o)}
            >
              <span className="adm-nav-icon">⊞</span>
              Pages
              <span className={`adm-chevron${pagesOpen ? ' open' : ''}`}>›</span>
            </button>

            {pagesOpen && (
              <ul className="adm-page-list">
                {ADMIN_PAGES.map(page => (
                  <li key={page.id}>
                    {page.status === 'active' ? (
                      <NavLink
                        to={page.adminPath}
                        className={({ isActive }) => `adm-page-item${isActive ? ' active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="adm-page-dot active" />
                        {page.label}
                      </NavLink>
                    ) : (
                      <span className="adm-page-item disabled">
                        <span className="adm-page-dot" />
                        {page.label}
                        <span className="adm-soon">soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer links */}
        <div className="adm-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer" className="adm-footer-link">
            <span>↗</span> View Site
          </a>
          <button className="adm-footer-link" onClick={handleLogout}>
            <span>→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">

        {/* Topbar */}
        <header className="adm-topbar" style={{ background: topbarBg }}>
          <button
            className="adm-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            <span /><span /><span />
          </button>

          <div className="adm-breadcrumb">
            <span className="adm-breadcrumb-home">Admin</span>
            {pathname !== '/admin/dashboard' && (
              <>
                <span className="adm-breadcrumb-sep">›</span>
                <span className="adm-breadcrumb-current">
                  {pathname.includes('website-settings') ? 'Website Settings'
                    : pathname.includes('customizer')  ? 'Customizer'
                    : pathname.includes('builder')    ? 'Page Builder'
                    : pathname.includes('navigation') ? 'Navigation'
                    : pathname.includes('users')      ? 'Users'
                    : ADMIN_PAGES.find(p => pathname.startsWith(p.adminPath))?.label
                    || (pathname.includes('dashboard') ? 'Dashboard' : 'Pages')}
                </span>
              </>
            )}
          </div>

          <div className="adm-topbar-right">
            <div className="adm-user-chip">
              <div className="adm-user-avatar">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="adm-user-name">{user?.username || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="adm-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
