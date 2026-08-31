import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/navigationApi';
import './NavigationAdmin.css';

const SITE_PAGES = [
  { label: 'Home',                 url: '/' },
  { label: 'Biography',            url: '/biography' },
  { label: 'Articles',             url: '/articles' },
  { label: 'Teaching',             url: '/teaching' },
  { label: 'Videos',               url: '/videos' },
  { label: 'Events',               url: '/events' },
  { label: 'Workshops & Retreats', url: '/workshops' },
  { label: 'Testimonials',         url: '/testimonials' },
  { label: 'Connect',              url: '/connect' },
  { label: 'Gallery',              url: '/gallery' },
];

// ── Reusable input ────────────────────────────────────────────────────────────
function Inp({ value, onChange, placeholder, style }) {
  return (
    <input
      className="nav-inp"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );
}

// ── URL picker: page dropdown or custom URL ───────────────────────────────────
function UrlPicker({ url, isExternal, onChange }) {
  const isPage   = !isExternal && SITE_PAGES.some(p => p.url === url);
  const [mode, setMode] = useState(isExternal ? 'custom' : isPage ? 'page' : 'custom');

  const switchMode = (m) => {
    setMode(m);
    if (m === 'page') onChange(SITE_PAGES[0].url, false);
    else              onChange(url, m === 'external');
  };

  return (
    <div className="nav-url-picker">
      <div className="nav-mode-tabs">
        <button className={`nav-mode-tab${mode === 'page'     ? ' active' : ''}`} onClick={() => switchMode('page')}>Page</button>
        <button className={`nav-mode-tab${mode === 'custom'   ? ' active' : ''}`} onClick={() => switchMode('custom')}>Custom URL</button>
        <button className={`nav-mode-tab${mode === 'external' ? ' active' : ''}`} onClick={() => switchMode('external')}>External</button>
      </div>
      {mode === 'page' ? (
        <select
          className="nav-inp"
          value={url}
          onChange={e => onChange(e.target.value, false)}
        >
          {SITE_PAGES.map(p => (
            <option key={p.url} value={p.url}>{p.label} ({p.url})</option>
          ))}
        </select>
      ) : (
        <Inp
          value={url}
          onChange={v => onChange(v, mode === 'external')}
          placeholder={mode === 'external' ? 'https://...' : '/path'}
        />
      )}
    </div>
  );
}

// ── Single nav item row ───────────────────────────────────────────────────────
function NavItemRow({ item, isFirst, isLast, onMove, onSave, onDelete, onAddSub, children }) {
  const [form,    setForm]    = useState({ label: item.label, url: item.url, is_external: !!item.is_external });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [subOpen, setSubOpen] = useState(false);

  useEffect(() => {
    setForm({ label: item.label, url: item.url, is_external: !!item.is_external });
  }, [item]);

  const dirty = form.label !== item.label || form.url !== item.url || form.is_external !== !!item.is_external;

  const save = async () => {
    setSaving(true); setError('');
    try {
      await onSave(item.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="nav-item-block">
      <div className="nav-item-row">
        {/* Order buttons */}
        <div className="nav-order-btns">
          <button className="nav-ord-btn" onClick={() => onMove(item.id, -1)} disabled={isFirst} title="Move up">↑</button>
          <button className="nav-ord-btn" onClick={() => onMove(item.id,  1)} disabled={isLast}  title="Move down">↓</button>
        </div>

        {/* Label */}
        <Inp value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Label" style={{ width: '150px' }} />

        {/* URL picker */}
        <UrlPicker
          url={form.url}
          isExternal={form.is_external}
          onChange={(url, is_external) => setForm(f => ({ ...f, url, is_external }))}
        />

        {/* Actions */}
        <div className="nav-item-actions">
          {dirty && (
            <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={save} disabled={saving}>
              {saving ? '…' : 'Save'}
            </button>
          )}
          {saved  && <span className="nav-saved">✓</span>}
          {error  && <span className="nav-error" title={error}>⚠</span>}
          {onAddSub && (
            <button className="adm-btn adm-btn-sm" onClick={() => setSubOpen(o => !o)} title="Manage submenu">
              {subOpen ? 'Hide Sub' : '+ Sub'}
            </button>
          )}
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => onDelete(item.id)} title="Delete">✕</button>
        </div>
      </div>

      {/* Submenu */}
      {subOpen && (
        <div className="nav-submenu-block">
          <div className="nav-submenu-label">Submenu items</div>
          {children}
          <AddItemForm menu={item.menu} parentId={item.id} onAdded={onAddSub} />
        </div>
      )}
    </div>
  );
}

// ── Add item form ─────────────────────────────────────────────────────────────
function AddItemForm({ menu, parentId = null, onAdded }) {
  const [label,      setLabel]      = useState('');
  const [url,        setUrl]        = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [open,       setOpen]       = useState(false);

  const add = async () => {
    if (!label.trim()) return;
    setAdding(true);
    try {
      await api.createItem({ menu, label: label.trim(), url, is_external: isExternal, parent_id: parentId, sort_order: 999 });
      setLabel(''); setUrl(''); setIsExternal(false); setOpen(false);
      onAdded();
    } finally { setAdding(false); }
  };

  if (!open) return (
    <button className="nav-add-btn" onClick={() => setOpen(true)}>+ Add item</button>
  );

  return (
    <div className="nav-add-form">
      <Inp value={label} onChange={setLabel} placeholder="Label" style={{ width: '150px' }} />
      <UrlPicker url={url} isExternal={isExternal} onChange={(u, ext) => { setUrl(u); setIsExternal(ext); }} />
      <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={add} disabled={adding || !label.trim()}>
        {adding ? '…' : 'Add'}
      </button>
      <button className="adm-btn adm-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

// ── Menu editor (header or footer) ───────────────────────────────────────────
function MenuEditor({ menu, items, onReload }) {
  const topLevel = items.filter(i => !i.parent_id).sort((a, b) => a.sort_order - b.sort_order);

  const move = useCallback(async (id, dir) => {
    const list = [...topLevel];
    const idx  = list.findIndex(i => i.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    await api.reorderItems(list.map((item, i) => ({ id: item.id, sort_order: i + 1 })));
    onReload();
  }, [topLevel, onReload]);

  const moveSub = useCallback(async (parentId, id, dir) => {
    const parent = topLevel.find(i => i.id === parentId);
    if (!parent) return;
    const list = [...(parent.children || [])].sort((a, b) => a.sort_order - b.sort_order);
    const idx  = list.findIndex(i => i.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    await api.reorderItems(list.map((item, i) => ({ id: item.id, sort_order: i + 1 })));
    onReload();
  }, [topLevel, onReload]);

  const save   = useCallback((id, data) => api.updateItem(id, data), []);
  const remove = useCallback(async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await api.deleteItem(id);
    onReload();
  }, [onReload]);

  return (
    <div className="nav-menu-editor">
      {topLevel.length === 0 && <p className="adm-hint">No items yet. Add one below.</p>}

      {topLevel.map((item, idx) => {
        const subs = (item.children || []).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <NavItemRow
            key={item.id}
            item={item}
            isFirst={idx === 0}
            isLast={idx === topLevel.length - 1}
            onMove={move}
            onSave={save}
            onDelete={remove}
            onAddSub={menu === 'header' ? onReload : null}
          >
            {subs.map((sub, si) => (
              <NavItemRow
                key={sub.id}
                item={sub}
                isFirst={si === 0}
                isLast={si === subs.length - 1}
                onMove={(id, dir) => moveSub(item.id, id, dir)}
                onSave={save}
                onDelete={remove}
                onAddSub={null}
              />
            ))}
          </NavItemRow>
        );
      })}

      <AddItemForm menu={menu} parentId={null} onAdded={onReload} />
    </div>
  );
}

// ── Main NavigationAdmin ──────────────────────────────────────────────────────
const TABS = [
  { id: 'header', label: 'Header Menu' },
  { id: 'footer', label: 'Footer Menu' },
];

function NavigationAdmin() {
  const [active, setActive]   = useState('header');
  const [nav,    setNav]      = useState({ header: [], footer: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getNav();
      setNav(data);
    } catch (e) {
      console.error('Failed to load nav:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Site CMS</span>
          <h1 className="bio-adm-title">Navigation</h1>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Site</a>
      </div>

      <p className="adm-hint" style={{ padding: '0 2rem', marginBottom: '0' }}>
        Changes here update the live header and footer menus instantly. Use <strong>Save</strong> on each row after editing.
      </p>

      <div className="bio-adm-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`bio-adm-tab${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bio-adm-content">
        {loading ? (
          <p className="adm-hint" style={{ padding: '2rem' }}>Loading…</p>
        ) : (
          <div className="adm-section">
            <h2 className="adm-section-title">
              {active === 'header' ? 'Header Menu' : 'Footer Menu'}
            </h2>
            {active === 'header' && (
              <p className="adm-hint">
                Header items can have submenu children (click <strong>+ Sub</strong>). Submenu is only supported one level deep.
              </p>
            )}
            <MenuEditor
              key={active}
              menu={active}
              items={active === 'header'
                ? nav.header.flatMap(i => [i, ...(i.children || [])])
                : nav.footer}
              onReload={load}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NavigationAdmin;
