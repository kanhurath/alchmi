import { useNavigate } from 'react-router-dom';
import { ADMIN_PAGES } from './pageRegistry';
import { PublishToggle } from '../../components/admin/PublishToggle';
import './AdminPages.css';

function AdminPages() {
  const navigate = useNavigate();

  return (
    <div className="pages-root">
      <div className="pages-header">
        <div>
          <span className="pages-eyebrow">Content Management</span>
          <h1 className="pages-title">All Pages</h1>
          <p className="pages-subtitle">
            Select a page to open its CMS editor. Use the Publish toggle to control
            visibility on the live site. Draft pages are hidden from visitors.
          </p>
        </div>
      </div>

      <table className="pages-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Sections</th>
            <th>CMS Status</th>
            <th>Publish Status</th>
            <th>Front-end</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ADMIN_PAGES.map(page => (
            <tr key={page.id} className={page.status === 'active' ? 'row-active' : 'row-planned'}>
              <td>
                <div className="pages-page-name">{page.label}</div>
                <div className="pages-page-desc">{page.desc}</div>
              </td>
              <td>
                <div className="pages-tags">
                  {page.sections.map(s => (
                    <span key={s} className="pages-tag">{s}</span>
                  ))}
                </div>
              </td>
              <td>
                {page.status === 'active' ? (
                  <span className="pages-status active">● Active</span>
                ) : (
                  <span className="pages-status planned">○ Planned</span>
                )}
              </td>
              <td>
                {page.status === 'active'
                  ? <PublishToggle slug={page.id} />
                  : <span className="pages-status planned">—</span>
                }
              </td>
              <td>
                <a
                  href={page.frontPath}
                  target="_blank"
                  rel="noreferrer"
                  className="pages-view-btn"
                >
                  View ↗
                </a>
              </td>
              <td>
                {page.status === 'active' ? (
                  <button
                    className="pages-edit-btn"
                    onClick={() => navigate(page.adminPath)}
                  >
                    Open Editor
                  </button>
                ) : (
                  <span className="pages-edit-placeholder">Coming soon</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPages;
