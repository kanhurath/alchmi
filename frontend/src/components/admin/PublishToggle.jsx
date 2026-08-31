import { useState } from 'react';
import { usePageStatuses } from '../../context/PageStatusContext';
import './PublishToggle.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/page-status`;

export function PublishToggle({ slug }) {
  const { statuses, refresh } = usePageStatuses();
  const [saving, setSaving] = useState(false);

  // Default to published so existing pages keep working while context loads
  const status  = statuses[slug] ?? 'published';
  const isDraft = status === 'draft';

  const toggle = async () => {
    setSaving(true);
    const next  = isDraft ? 'published' : 'draft';
    const token = localStorage.getItem('vk_admin_token');
    try {
      await fetch(`${API}/${slug}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: next }),
      });
      await refresh();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="pub-toggle">
      <span className={`pub-badge ${isDraft ? 'pub-draft' : 'pub-published'}`}>
        {isDraft ? '○ Draft' : '● Published'}
      </span>
      <button
        className={`pub-btn ${isDraft ? 'pub-btn-publish' : 'pub-btn-unpublish'}`}
        onClick={toggle}
        disabled={saving}
        title={isDraft ? 'Publish this page to make it visible on the site' : 'Set to Draft to hide from visitors'}
      >
        {saving ? '…' : isDraft ? 'Publish' : 'Unpublish'}
      </button>
    </div>
  );
}
