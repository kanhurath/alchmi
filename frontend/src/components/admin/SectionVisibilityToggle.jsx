import { useState, useEffect } from 'react';
import { getLayout, saveLayout } from '../../services/sectionLayoutApi';
import './SectionVisibilityToggle.css';

// Default key order per page — used to build a full layout row list when none is saved yet
const PAGE_DEFAULTS = {
  home: ['hero','marquee','about','whatwedo','testimonials','articles','themes','quote','talks','connect'],
};

function getDefaultItems(pageSlug) {
  return (PAGE_DEFAULTS[pageSlug] || []).map((key, i) => ({
    section_key: key, sort_order: i + 1, enabled: true,
  }));
}

export function SectionVisibilityToggle({ pageSlug, sectionKey }) {
  const [enabled,    setEnabled]    = useState(true);
  const [fullLayout, setFullLayout] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    getLayout(pageSlug)
      .then(items => {
        setFullLayout(items);
        const row = (items || []).find(i => i.section_key === sectionKey);
        // If the section isn't in the saved layout yet, it's visible by default
        setEnabled(row ? !!row.enabled : true);
      })
      .catch(() => {});
  }, [pageSlug, sectionKey]);

  const toggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setSaving(true); setError('');
    try {
      // Build the full list to persist — fall back to page defaults if nothing saved yet
      let base = (fullLayout && fullLayout.length > 0) ? fullLayout : getDefaultItems(pageSlug);
      // Ensure this section key exists in the list
      if (!base.some(i => i.section_key === sectionKey)) {
        base = [...base, { section_key: sectionKey, sort_order: base.length + 1, enabled: true }];
      }
      const updated = base.map(it =>
        it.section_key === sectionKey ? { ...it, enabled: newEnabled } : it
      );
      await saveLayout(pageSlug, updated.map((it, i) => ({
        section_key: it.section_key,
        sort_order:  it.sort_order ?? i + 1,
        enabled:     it.enabled,
      })));
      setFullLayout(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setEnabled(!newEnabled); // revert on failure
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="svt-bar">
      <label className={`svt-label-wrap${saving ? ' svt-label-wrap--busy' : ''}`}>
        <span className="svt-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            disabled={saving}
            className="svt-input"
          />
          <span className="svt-track" />
        </span>
        <span className="svt-text">
          {enabled ? 'Visible on frontend' : 'Hidden from frontend'}
        </span>
      </label>
      {saving && <span className="svt-status svt-status--saving">Saving…</span>}
      {saved  && <span className="svt-status svt-status--saved">✓ Saved</span>}
      {error  && <span className="svt-status svt-status--error">⚠ {error}</span>}
    </div>
  );
}
