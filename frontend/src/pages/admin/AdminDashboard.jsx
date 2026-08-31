import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_PAGES, activePages, plannedPages } from './pageRegistry';
import './AdminDashboard.css';

function StatCard({ value, label, sub }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-label">{label}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="dash-root">

      {/* ── Welcome ── */}
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <span className="dash-eyebrow">CMS Dashboard</span>
          <h1 className="dash-title">
            Welcome back, <em>{user?.username || 'Admin'}</em>
          </h1>
          <p className="dash-subtitle">
            Manage your website content from here. Select a page from the sidebar or the quick-access cards below.
          </p>
        </div>
        <div className="dash-welcome-badge">वि</div>
      </div>

      {/* ── Stats ── */}
      <div className="dash-stats-row">
        <StatCard value={ADMIN_PAGES.length}   label="Total Pages"    sub="Across all sections" />
        <StatCard value={activePages.length}   label="Active CMS"     sub="Editors ready to use" />
        <StatCard value={plannedPages.length}  label="Coming Soon"    sub="In development queue" />
        <StatCard value="1"                    label="DB Connected"   sub="vkulkarni-react · MySQL" />
      </div>

      {/* ── Active CMS ── */}
      <section className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Active CMS Editors</h2>
          <span className="dash-badge green">{activePages.length} Ready</span>
        </div>
        <div className="dash-page-grid">
          {activePages.map(page => (
            <button
              key={page.id}
              className="dash-page-card active"
              onClick={() => navigate(page.adminPath)}
            >
              <div className="dash-page-card-top">
                <span className="dash-page-status-dot active" />
                <span className="dash-page-status-text">Live</span>
                <a
                  href={page.frontPath}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-page-view-link"
                  onClick={e => e.stopPropagation()}
                >
                  ↗
                </a>
              </div>
              <h3 className="dash-page-name">{page.label}</h3>
              <p className="dash-page-desc">{page.desc}</p>
              <div className="dash-page-sections">
                {page.sections.map(s => (
                  <span key={s} className="dash-page-section-tag">{s}</span>
                ))}
              </div>
              <div className="dash-page-cta">Open Editor →</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Coming Soon ── */}
      <section className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Pages — CMS Coming Soon</h2>
          <span className="dash-badge">{plannedPages.length} Planned</span>
        </div>
        <div className="dash-page-grid">
          {plannedPages.map(page => (
            <div key={page.id} className="dash-page-card planned">
              <div className="dash-page-card-top">
                <span className="dash-page-status-dot" />
                <span className="dash-page-status-text">Planned</span>
                <a
                  href={page.frontPath}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-page-view-link"
                  onClick={e => e.stopPropagation()}
                >
                  ↗
                </a>
              </div>
              <h3 className="dash-page-name">{page.label}</h3>
              <p className="dash-page-desc">{page.desc}</p>
              <div className="dash-page-sections">
                {page.sections.map(s => (
                  <span key={s} className="dash-page-section-tag">{s}</span>
                ))}
              </div>
              <div className="dash-page-cta planned">CMS not yet built</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;
