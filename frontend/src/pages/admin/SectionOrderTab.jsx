import { useState, useEffect, useCallback } from 'react';
import * as layoutApi from '../../services/sectionLayoutApi';
import { getBlocks }  from '../../services/siteBlocksApi';
import { getBlockDef } from '../../data/blockDefs';
import './SectionOrderTab.css';

// ── Built-in section definitions per page ─────────────────────────────────────
const PAGE_SECTION_DEFS = {
  home: [
    { key: 'hero',         label: 'Hero Banner',          icon: '🏠' },
    { key: 'marquee',      label: 'Marquee Strip',        icon: '📢' },
    { key: 'about',        label: 'About Section',        icon: '👤' },
    { key: 'testimonials', label: 'Testimonials',         icon: '⭐' },
    { key: 'articles',     label: 'Articles',             icon: '📝' },
    { key: 'themes',       label: 'Themes',               icon: '🔷' },
    { key: 'quote',        label: 'Quote',                icon: '❝' },
    { key: 'talks',        label: 'Talks & Videos',       icon: '▶' },
    { key: 'connect',      label: 'Connect Section',      icon: '🔗' },
    { key: 'cta',          label: 'Book an Engagement',   icon: '📅' },
  ],
  biography: [
    { key: 'hero',     label: 'Page Hero',          icon: '⬛' },
    { key: 'profile',  label: 'Profile',            icon: '👤' },
    { key: 'engage',   label: 'How Vinay Engages',  icon: '🤝' },
    { key: 'ventures', label: 'Ventures',           icon: '🏢' },
    { key: 'cta',      label: 'Book an Engagement', icon: '📅' },
  ],
  teaching: [
    { key: 'hero',     label: 'Page Hero',          icon: '⬛' },
    { key: 'stats',    label: 'Teaching Stats',     icon: '📊' },
    { key: 'history',  label: 'Teaching History',   icon: '📖' },
    { key: 'courses',  label: 'Course Reports',     icon: '🎓' },
    { key: 'feedback', label: 'Student Feedback',   icon: '⭐' },
    { key: 'themes',   label: 'Teaching Themes',    icon: '🔷' },
    { key: 'cta',      label: 'Book an Engagement', icon: '📅' },
  ],
  videos: [
    { key: 'hero',        label: 'Page Hero',          icon: '⬛' },
    { key: 'videos_list', label: 'Talks & Videos',     icon: '▶' },
    { key: 'cta',         label: 'Book an Engagement', icon: '📅' },
  ],
  events: [
    { key: 'hero',        label: 'Page Hero',          icon: '⬛' },
    { key: 'events_list', label: 'Events',             icon: '📅' },
    { key: 'cta',         label: 'Book an Engagement', icon: '📅' },
  ],
  workshops: [
    { key: 'hero',           label: 'Page Hero',            icon: '⬛' },
    { key: 'workshops_list', label: 'Workshops & Retreats', icon: '🧘' },
    { key: 'cta',            label: 'Book an Engagement',   icon: '📅' },
  ],
  connect: [
    { key: 'hero',            label: 'Page Hero', icon: '⬛' },
    { key: 'connect_section', label: 'Connect',   icon: '🔗' },
  ],
  gallery: [
    { key: 'hero',           label: 'Page Hero', icon: '⬛' },
    { key: 'gallery_section',label: 'Gallery',   icon: '🖼' },
    { key: 'cta',            label: 'Book an Engagement', icon: '📅' },
  ],
  methodology: [
    { key: 'hero',        label: 'Page Hero',   icon: '⬛' },
    { key: 'frameworks',  label: 'Frameworks',  icon: '🔷' },
    { key: 'explainer',   label: 'Explainer',   icon: '📖' },
    { key: 'cta',         label: 'CTA Band',    icon: '📅' },
  ],
  services: [
    { key: 'hero',          label: 'Page Hero',       icon: '⬛' },
    { key: 'cards',         label: 'Service Cards',   icon: '🃏' },
    { key: 'facilitation',  label: 'Facilitation',    icon: '🤝' },
    { key: 'workshops',     label: 'Workshops',       icon: '🧘' },
    { key: 'retreats',      label: 'Retreats',        icon: '🌿' },
    { key: 'industries',    label: 'Industries',      icon: '🏭' },
    { key: 'longform',      label: 'Services Intro',  icon: '📄' },
    { key: 'cgrowth',       label: 'C-Growth',        icon: '🔄' },
    { key: 'cta',           label: 'CTA Band',        icon: '📅' },
  ],
};

// Build a lookup map from key → def for any slug
function buildDefMap(slug) {
  const map = {};
  (PAGE_SECTION_DEFS[slug] || []).forEach(d => { map[d.key] = d; });
  return map;
}

// Merge saved layout + defaults + extra blocks into a unified ordered list
function buildItems(savedLayout, builtInDefs, extraBlocks) {
  const defKeys = builtInDefs.map(d => d.key);

  if (savedLayout && savedLayout.length > 0) {
    // Start from saved layout
    const inLayout = new Set(savedLayout.map(i => i.section_key));
    const items = savedLayout.map(i => ({ ...i }));
    // Append built-ins not yet in saved layout
    defKeys.forEach((key, idx) => {
      if (!inLayout.has(key))
        items.push({ section_key: key, sort_order: items.length + idx + 1, enabled: true });
    });
    // Append extra blocks not yet in saved layout
    extraBlocks.forEach((b, idx) => {
      const key = `block:${b.id}`;
      if (!inLayout.has(key))
        items.push({ section_key: key, sort_order: items.length + idx + 1, enabled: true });
    });
    return items;
  }

  // No saved layout → default: built-ins in order, then extra blocks
  const items = defKeys.map((key, i) => ({ section_key: key, sort_order: i + 1, enabled: true }));
  extraBlocks.forEach((b, i) => {
    items.push({ section_key: `block:${b.id}`, sort_order: defKeys.length + i + 1, enabled: true });
  });
  return items;
}

export function SectionOrderTab({ pageSlug }) {
  const [items,       setItems]   = useState([]);
  const [extraBlocks, setExtra]   = useState([]);
  const [saving,      setSaving]  = useState(false);
  const [saved,       setSaved]   = useState(false);
  const [error,       setError]   = useState('');

  const builtInDefs = PAGE_SECTION_DEFS[pageSlug] || [];
  const defMap      = buildDefMap(pageSlug);

  const load = useCallback(() => {
    Promise.all([
      layoutApi.getLayout(pageSlug).catch(() => []),
      getBlocks(pageSlug).catch(() => []),
    ]).then(([savedLayout, blocks]) => {
      setExtra(blocks);
      setItems(buildItems(savedLayout, builtInDefs, blocks));
    });
  }, [pageSlug]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // ── Move item ───────────────────────────────────────────────────────────────
  const move = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const arr = [...items];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setItems(arr.map((it, i) => ({ ...it, sort_order: i + 1 })));
  };

  // ── Toggle enable ───────────────────────────────────────────────────────────
  const toggleEnabled = (idx) => {
    setItems(items.map((it, i) => i === idx ? { ...it, enabled: !it.enabled } : it));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      await layoutApi.saveLayout(pageSlug, items.map((it, i) => ({
        section_key: it.section_key,
        sort_order:  i + 1,
        enabled:     it.enabled,
      })));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = async () => {
    if (!confirm('Reset to default section order? This cannot be undone.')) return;
    await layoutApi.resetLayout(pageSlug).catch(() => {});
    load();
  };

  // ── Get display info for a section_key ─────────────────────────────────────
  const getInfo = (section_key) => {
    if (section_key.startsWith('block:')) {
      const blockId = parseInt(section_key.slice(6), 10);
      const block = extraBlocks.find(b => b.id === blockId);
      if (block) {
        const def = getBlockDef(block.block_type);
        return { label: `${def.label} [Extra]`, icon: def.icon, isExtra: true };
      }
      return { label: `Block #${blockId} (deleted)`, icon: '⚠', isExtra: true };
    }
    const d = defMap[section_key];
    return d
      ? { label: d.label, icon: d.icon, isExtra: false }
      : { label: section_key, icon: '?', isExtra: false };
  };

  return (
    <div className="sol-root">
      <p className="sol-intro">
        Drag sections into any order and toggle visibility. Changes take effect on the public page after saving.
        Built-in sections can be reordered and hidden but not deleted here.
      </p>

      <div className="sol-list">
        {items.map((item, idx) => {
          const { label, icon, isExtra } = getInfo(item.section_key);
          return (
            <div key={item.section_key} className={`sol-row${!item.enabled ? ' sol-row--disabled' : ''}`}>
              <div className="sol-row-left">
                <span className="sol-num">{idx + 1}</span>
                <span className="sol-icon">{icon}</span>
                <div className="sol-label-wrap">
                  <span className="sol-label">{label}</span>
                  {isExtra && <span className="sol-tag">Extra Section</span>}
                </div>
              </div>
              <div className="sol-row-right">
                <label className="sol-toggle" title={item.enabled ? 'Visible — click to hide' : 'Hidden — click to show'}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => toggleEnabled(idx)}
                  />
                  <span className="sol-toggle-track" />
                </label>
                <button
                  className="sol-btn"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  title="Move up"
                >↑</button>
                <button
                  className="sol-btn"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  title="Move down"
                >↓</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sol-save-bar">
        <button className="adm-btn" onClick={reset} title="Revert to default section order">
          Reset to Default
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saved  && <span className="sol-saved">✓ Section order saved</span>}
          {error  && <span className="sol-error">⚠ {error}</span>}
          <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Section Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
