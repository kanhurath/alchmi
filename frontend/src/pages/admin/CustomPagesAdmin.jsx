import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/customPagesApi';
import './CustomPagesAdmin.css';

function CustomPagesAdmin() {
  const navigate = useNavigate();
  const [pages,   setPages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try { setPages(await api.listPages()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async id => {
    if (!confirm('Delete this page and all its blocks?')) return;
    setDeleting(id);
    try { await api.deletePage(id); setPages(p => p.filter(x => x.id !== id)); }
    finally { setDeleting(null); }
  };

  return (
    <div className="cpg-root">
      <div className="cpg-header">
        <div>
          <span className="cpg-eyebrow">Page Builder</span>
          <h1 className="cpg-title">Custom Pages</h1>
          <p className="cpg-sub">Create and manage custom pages built with reusable content blocks.</p>
        </div>
        <button className="cpg-new-btn" onClick={() => navigate('/admin/builder/new')}>
          + New Page
        </button>
      </div>

      {loading && <p className="adm-hint" style={{ padding: '2rem' }}>Loading…</p>}

      {!loading && pages.length === 0 && (
        <div className="cpg-empty">
          <div className="cpg-empty-icon">⊞</div>
          <p>No custom pages yet. Click <strong>+ New Page</strong> to get started.</p>
        </div>
      )}

      {!loading && pages.length > 0 && (
        <table className="cpg-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Blocks</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.id} className={p.status === 'published' ? 'cpg-row-pub' : ''}>
                <td>
                  <div className="cpg-page-title">{p.title || '(Untitled)'}</div>
                </td>
                <td>
                  <code className="cpg-slug">/{p.slug}</code>
                </td>
                <td>
                  <span className={`cpg-status ${p.status}`}>
                    {p.status === 'published' ? '● Published' : '○ Draft'}
                  </span>
                </td>
                <td className="cpg-count">{p.block_count || 0}</td>
                <td className="cpg-date">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</td>
                <td>
                  <div className="cpg-actions">
                    <button className="cpg-edit-btn" onClick={() => navigate(`/admin/builder/${p.id}`)}>
                      Edit
                    </button>
                    {p.status === 'published' && (
                      <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="cpg-view-btn">View ↗</a>
                    )}
                    <button
                      className="cpg-del-btn"
                      onClick={() => remove(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomPagesAdmin;
