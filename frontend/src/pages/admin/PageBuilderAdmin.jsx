import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../services/customPagesApi';
import { getBlockDef } from '../../data/blockDefs';
import { BlockEditor } from './BlockEditors';
import { DesignLibraryModal } from '../../components/blocks/DesignLibraryModal';
import './PageBuilderAdmin.css';

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

// ── Layout options ────────────────────────────────────────────────────────────
const LAYOUTS = [
  {
    value: 'no_sidebar',
    label: 'No Sidebar',
    icon: (
      <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="pb-layout-svg">
        <rect x="2" y="2" width="36" height="24" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    value: 'left_sidebar',
    label: 'Left Sidebar',
    icon: (
      <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="pb-layout-svg">
        <rect x="2" y="2" width="10" height="24" rx="2" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="15" y="2" width="23" height="24" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    value: 'right_sidebar',
    label: 'Right Sidebar',
    icon: (
      <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="pb-layout-svg">
        <rect x="2" y="2" width="23" height="24" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="28" y="2" width="10" height="24" rx="2" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

// ── SEO Panel (collapsible) ───────────────────────────────────────────────────
function SeoPanel({ page, onChange, pageId }) {
  const [open, setOpen] = useState(false);
  const imgRef = useRef();

  const s = (k, v) => onChange({ ...page, [k]: v });

  const uploadOgImage = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { url } = await api.uploadBlockImage(pageId, file);
      s('og_image_url', url);
    } catch { alert('Image upload failed'); }
    e.target.value = '';
  };

  const ogSrc = page.og_image_url
    ? page.og_image_url.startsWith('http') ? page.og_image_url : `${API_SERVER}${page.og_image_url}`
    : null;

  const titleLen = (page.seo_title || '').length;
  const descLen  = (page.meta_description || '').length;

  return (
    <div className="pb-seo-panel">
      <button className="pb-seo-toggle" onClick={() => setOpen(o => !o)}>
        <span>🔍 SEO Settings</span>
        <span className="pb-seo-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pb-seo-body">
          <div className="pb-seo-grid">
            <div className="pb-seo-field">
              <label className="pb-seo-label">
                SEO Title
                <span className={`pb-seo-count ${titleLen === 0 ? '' : titleLen <= 60 ? 'ok' : titleLen <= 70 ? 'warn' : 'over'}`}>{titleLen}/60</span>
              </label>
              <input className="pb-seo-inp" value={page.seo_title || ''} onChange={e => s('seo_title', e.target.value)} placeholder="Defaults to page title if blank" />
            </div>
            <div className="pb-seo-field">
              <label className="pb-seo-label">
                Meta Description
                <span className={`pb-seo-count ${descLen === 0 ? '' : descLen <= 160 ? 'ok' : 'over'}`}>{descLen}/160</span>
              </label>
              <textarea className="pb-seo-inp" rows={2} value={page.meta_description || ''} onChange={e => s('meta_description', e.target.value)} placeholder="Summary shown in search results…" />
            </div>
            <div className="pb-seo-field">
              <label className="pb-seo-label">Focus Keyword</label>
              <input className="pb-seo-inp" value={page.focus_keyword || ''} onChange={e => s('focus_keyword', e.target.value)} placeholder="Primary keyword phrase" />
            </div>
            <div className="pb-seo-field">
              <label className="pb-seo-label">Canonical URL</label>
              <input className="pb-seo-inp" value={page.canonical_url || ''} onChange={e => s('canonical_url', e.target.value)} placeholder="http://localhost:3001/page-slug" />
            </div>
            <div className="pb-seo-field pb-seo-field--full">
              <label className="pb-seo-label">Open Graph Image</label>
              {ogSrc && <img src={ogSrc} alt="" className="pb-seo-og-img" />}
              <input className="pb-seo-inp" value={page.og_image_url || ''} onChange={e => s('og_image_url', e.target.value)} placeholder="https://… or /uploads/pages/…" />
              <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.3rem' }} onClick={() => imgRef.current?.click()}>Upload image</button>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadOgImage} />
            </div>
            <div className="pb-seo-field pb-seo-field--full">
              <label className="pb-seo-label">Custom Schema (JSON-LD)</label>
              <textarea className="pb-seo-inp pb-seo-schema" rows={5} value={page.custom_schema || ''} onChange={e => s('custom_schema', e.target.value)} placeholder={'{ "@context": "https://schema.org", "@type": "WebPage" }'} spellCheck={false} />
            </div>
          </div>
          <p className="adm-hint" style={{ marginTop: '0.5rem' }}>SEO settings are saved when you click "Save Page".</p>
        </div>
      )}
    </div>
  );
}

// ── Area picker modal ─────────────────────────────────────────────────────────
function AreaPickerModal({ layout, onPick, onClose }) {
  return (
    <div className="pb-area-backdrop" onClick={onClose}>
      <div className="pb-area-modal" onClick={e => e.stopPropagation()}>
        <div className="pb-area-modal-head">
          <span>Add Section To…</span>
          <button className="pb-library-close" onClick={onClose}>✕</button>
        </div>
        <div className="pb-area-modal-body">
          <button className="pb-area-card" onClick={() => onPick('main')}>
            <span className="pb-area-card-icon">
              {layout === 'left_sidebar' ? '▉▌' : '▌▉'}
            </span>
            <div>
              <div className="pb-area-card-title">Main Content</div>
              <div className="pb-area-card-desc">Full-width or contained sections in the primary column</div>
            </div>
          </button>
          <button className="pb-area-card" onClick={() => onPick('sidebar')}>
            <span className="pb-area-card-icon">▐</span>
            <div>
              <div className="pb-area-card-title">Sidebar</div>
              <div className="pb-area-card-desc">Narrower column shown {layout === 'left_sidebar' ? 'on the left' : 'on the right'}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────
function BlockRow({ block, isActive, isFirst, isLast, area, onSelect, onMove, onDelete }) {
  const def = getBlockDef(block.block_type);
  return (
    <div
      className={`pb-block-row${isActive ? ' active' : ''}`}
      onClick={() => onSelect(block.id)}
    >
      <span className="pb-block-icon">{def.icon}</span>
      <div className="pb-block-label-wrap">
        <span className="pb-block-label">{def.label}</span>
        {area && <span className={`pb-area-tag pb-area-tag-${area}`}>{area}</span>}
      </div>
      <div className="pb-block-btns" onClick={e => e.stopPropagation()}>
        <button onClick={() => onMove(block.id, -1)} disabled={isFirst}  title="Move up">↑</button>
        <button onClick={() => onMove(block.id,  1)} disabled={isLast}   title="Move down">↓</button>
        <button className="danger" onClick={() => onDelete(block.id)} title="Delete">✕</button>
      </div>
    </div>
  );
}

// ── Slug helper ───────────────────────────────────────────────────────────────
const slugify = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Main Page Builder ─────────────────────────────────────────────────────────
function PageBuilderAdmin() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isNew    = id === 'new';

  const [page,        setPage]        = useState({ title: '', slug: '', status: 'draft', layout: 'no_sidebar', meta_description: '', seo_title: '', focus_keyword: '', canonical_url: '', og_image_url: '', custom_schema: '' });
  const [blocks,      setBlocks]      = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [library,     setLibrary]     = useState(false);
  const [areaPicker,  setAreaPicker]  = useState(false);
  const [pendingArea, setPendingArea] = useState('main');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [pageId,      setPageId]      = useState(isNew ? null : id);
  const [slugLocked,  setSlugLocked]  = useState(!isNew);

  const hasSidebar = page.layout !== 'no_sidebar';

  const load = useCallback(async (pid) => {
    const data = await api.getPage(pid);
    setPage({
      title:            data.title,
      slug:             data.slug,
      status:           data.status,
      layout:           data.layout || 'no_sidebar',
      meta_description: data.meta_description || '',
      seo_title:        data.seo_title        || '',
      focus_keyword:    data.focus_keyword    || '',
      canonical_url:    data.canonical_url    || '',
      og_image_url:     data.og_image_url     || '',
      custom_schema:    data.custom_schema    || '',
    });
    setBlocks(data.blocks || []);
  }, []);

  useEffect(() => { if (!isNew) load(id); }, [id, isNew, load]);

  const handleTitle = v => {
    setPage(p => ({ ...p, title: v, ...(!slugLocked ? { slug: slugify(v) } : {}) }));
  };

  // ── Save page meta ──────────────────────────────────────────────────────────
  const saveMeta = async () => {
    if (!page.title.trim()) return setSaveError('Title is required.');
    if (!page.slug.trim())  return setSaveError('Slug is required.');
    setSaving(true); setSaveError('');
    try {
      if (isNew) {
        const created = await api.createPage(page);
        setPageId(created.id);
        setSlugLocked(true);
        navigate(`/admin/builder/${created.id}`, { replace: true });
      } else {
        await api.updatePage(pageId, page);
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  // ── Open "Add Section" — with or without area picker ──────────────────────
  const openAddSection = (forceArea = null) => {
    if (!pageId) { alert('Save page details first before adding blocks.'); return; }
    if (forceArea) {
      setPendingArea(forceArea);
      setLibrary(true);
    } else if (hasSidebar) {
      setAreaPicker(true);
    } else {
      setPendingArea('main');
      setLibrary(true);
    }
  };

  const handleAreaPick = (area) => {
    setAreaPicker(false);
    setPendingArea(area);
    setLibrary(true);
  };

  // ── Add block from Design Library ──────────────────────────────────────────
  const addBlock = async def => {
    setLibrary(false);
    if (!pageId) return;
    const area       = pendingArea || 'main';
    const areaBlocks = blocks.filter(b => (b.area || 'main') === area);
    const block = await api.addBlock(pageId, {
      block_type: def.type,
      content:    def.defaultContent,
      sort_order: areaBlocks.length + 1,
      area,
    });
    setBlocks(prev => [...prev, block]);
    setActiveId(block.id);
  };

  // ── Reorder within same area ────────────────────────────────────────────────
  const move = async (blockId, dir) => {
    const block      = blocks.find(b => b.id === blockId);
    const area       = block?.area || 'main';
    const areaBlocks = blocks.filter(b => (b.area || 'main') === area);
    const idx        = areaBlocks.findIndex(b => b.id === blockId);
    const swap       = idx + dir;
    if (swap < 0 || swap >= areaBlocks.length) return;

    const next = [...areaBlocks];
    [next[idx], next[swap]] = [next[swap], next[idx]];

    // Rebuild global blocks keeping the other area intact
    const others   = blocks.filter(b => (b.area || 'main') !== area);
    const newBlocks = [...next, ...others];
    setBlocks(newBlocks);

    await api.reorderBlocks(pageId, next.map((b, i) => ({ id: b.id, sort_order: i + 1 })));
  };

  // ── Delete block ────────────────────────────────────────────────────────────
  const removeBlock = async blockId => {
    if (!confirm('Delete this block?')) return;
    await api.deleteBlock(pageId, blockId);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (activeId === blockId) setActiveId(null);
  };

  // ── Save block content ──────────────────────────────────────────────────────
  const saveBlock = async (blockId, content) => {
    await api.updateBlock(pageId, blockId, { content });
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b));
  };

  const activeBlock  = blocks.find(b => b.id === activeId);
  const mainBlocks   = blocks.filter(b => (b.area || 'main') === 'main');
  const sidebarBlocks = blocks.filter(b => b.area === 'sidebar');

  return (
    <div className="pb-root">
      {/* ── Top bar ── */}
      <div className="pb-topbar">
        <button className="adm-btn adm-btn-sm" onClick={() => navigate('/admin/builder')}>← Pages</button>
        <div className="pb-meta">
          <input
            className="pb-title-inp"
            value={page.title}
            onChange={e => handleTitle(e.target.value)}
            placeholder="Page title…"
          />
          <div className="pb-slug-row">
            <span className="pb-slug-prefix">/</span>
            <input
              className="pb-slug-inp"
              value={page.slug}
              onChange={e => { setSlugLocked(true); setPage(p => ({ ...p, slug: slugify(e.target.value) })); }}
              placeholder="page-slug"
            />
          </div>
        </div>
        <div className="pb-actions">
          <select className="pb-status-sel" value={page.status} onChange={e => setPage(p => ({ ...p, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {pageId && (
            <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm">Preview ↗</a>
          )}
          <button className="adm-btn adm-btn-primary" onClick={saveMeta} disabled={saving}>
            {saving ? 'Saving…' : 'Save Page'}
          </button>
        </div>
      </div>
      {saved     && <div className="pb-banner pb-banner-ok">✓ Page saved</div>}
      {saveError && <div className="pb-banner pb-banner-err">⚠ {saveError}</div>}

      {/* ── SEO Panel ── */}
      <SeoPanel page={page} onChange={setPage} pageId={pageId} />

      {/* ── Body ── */}
      <div className="pb-body">

        {/* ── Left panel: layout + sections ── */}
        <div className="pb-sidebar">

          {/* ── Page Layout selector ── */}
          <div className="pb-layout-panel">
            <div className="pb-layout-panel-head">Page Layout</div>
            <div className="pb-layout-options">
              {LAYOUTS.map(l => (
                <button
                  key={l.value}
                  className={`pb-layout-opt${page.layout === l.value ? ' active' : ''}`}
                  onClick={() => setPage(p => ({ ...p, layout: l.value }))}
                  title={l.label}
                >
                  {l.icon}
                  <span className="pb-layout-opt-label">{l.label}</span>
                </button>
              ))}
            </div>
            {hasSidebar && (
              <p className="pb-layout-hint">
                Sections are split into <strong>Main Content</strong> and <strong>Sidebar</strong> columns below.
              </p>
            )}
          </div>

          {/* ── Sections list ── */}
          <div className="pb-sections-head">Sections</div>

          {!hasSidebar ? (
            /* ── No sidebar: flat list ── */
            <>
              {blocks.length === 0 && (
                <p className="adm-hint" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                  No sections yet.
                </p>
              )}
              {blocks.map((b, idx) => (
                <BlockRow
                  key={b.id}
                  block={b}
                  isActive={activeId === b.id}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                  area={null}
                  onSelect={id => setActiveId(activeId === id ? null : id)}
                  onMove={move}
                  onDelete={removeBlock}
                />
              ))}
              <button className="pb-add-btn" onClick={() => openAddSection()}>
                + Add Section
              </button>
            </>
          ) : (
            /* ── Sidebar layout: grouped list ── */
            <>
              {/* Main Content group */}
              <div className="pb-area-group-label pb-area-group-main">Main Content</div>
              {mainBlocks.length === 0 && (
                <p className="adm-hint" style={{ padding: '0.4rem 1rem 0.2rem', fontSize: '0.72rem' }}>No sections yet.</p>
              )}
              {mainBlocks.map((b, idx) => (
                <BlockRow
                  key={b.id}
                  block={b}
                  isActive={activeId === b.id}
                  isFirst={idx === 0}
                  isLast={idx === mainBlocks.length - 1}
                  area="main"
                  onSelect={id => setActiveId(activeId === id ? null : id)}
                  onMove={move}
                  onDelete={removeBlock}
                />
              ))}
              <button className="pb-add-area-btn" onClick={() => openAddSection('main')}>
                + Add to Main
              </button>

              {/* Sidebar group */}
              <div className="pb-area-group-label pb-area-group-sidebar">Sidebar</div>
              {sidebarBlocks.length === 0 && (
                <p className="adm-hint" style={{ padding: '0.4rem 1rem 0.2rem', fontSize: '0.72rem' }}>No sections yet.</p>
              )}
              {sidebarBlocks.map((b, idx) => (
                <BlockRow
                  key={b.id}
                  block={b}
                  isActive={activeId === b.id}
                  isFirst={idx === 0}
                  isLast={idx === sidebarBlocks.length - 1}
                  area="sidebar"
                  onSelect={id => setActiveId(activeId === id ? null : id)}
                  onMove={move}
                  onDelete={removeBlock}
                />
              ))}
              <button className="pb-add-area-btn pb-add-area-btn-sidebar" onClick={() => openAddSection('sidebar')}>
                + Add to Sidebar
              </button>
            </>
          )}
        </div>

        {/* ── Block editor (right) ── */}
        <div className="pb-editor">
          {!activeBlock && (
            <div className="pb-editor-empty">
              <div className="pb-editor-empty-icon">⊞</div>
              <p>{blocks.length === 0 ? 'Add your first section using the panel on the left.' : 'Select a section on the left to edit its content.'}</p>
            </div>
          )}

          {activeBlock && (
            <div className="pb-editor-panel">
              <div className="pb-editor-head">
                <div className="pb-editor-head-left">
                  <span className="pb-editor-type">
                    {getBlockDef(activeBlock.block_type).icon} {getBlockDef(activeBlock.block_type).label}
                  </span>
                  {hasSidebar && (
                    <span className={`pb-area-tag pb-area-tag-${activeBlock.area || 'main'}`}>
                      {activeBlock.area === 'sidebar' ? 'Sidebar' : 'Main Content'}
                    </span>
                  )}
                  {/* Width toggle */}
                  <div className="pb-width-toggle">
                    <span className="pb-width-label">Width</span>
                    {['contained', 'full'].map(w => (
                      <button
                        key={w}
                        className={`pb-width-btn${(activeBlock.content?.wrapper_width || 'contained') === w ? ' active' : ''}`}
                        onClick={async () => {
                          const newContent = { ...(activeBlock.content || {}), wrapper_width: w };
                          setBlocks(prev => prev.map(b =>
                            b.id === activeBlock.id ? { ...b, content: newContent } : b
                          ));
                          if (pageId) {
                            try { await saveBlock(activeBlock.id, newContent); } catch (_) {}
                          }
                        }}
                        title={w === 'full' ? 'Full width (100%)' : 'Contained (max 1100px)'}
                      >
                        {w === 'full' ? '⇔ 100%' : '⊡ Contained'}
                      </button>
                    ))}
                  </div>
                </div>
                <SaveBlockBtn blockId={activeBlock.id} block={activeBlock} onSave={saveBlock} />
              </div>
              <div className="pb-editor-body">
                <BlockEditor
                  block={activeBlock}
                  pageId={pageId}
                  onChange={content => setBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, content } : b))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Area picker modal ── */}
      {areaPicker && (
        <AreaPickerModal
          layout={page.layout}
          onPick={handleAreaPick}
          onClose={() => setAreaPicker(false)}
        />
      )}

      {/* ── Design Library modal ── */}
      {library && <DesignLibraryModal onSelect={addBlock} onClose={() => setLibrary(false)} />}
    </div>
  );
}

// ── Save block button ─────────────────────────────────────────────────────────
function SaveBlockBtn({ blockId, block, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      await onSave(blockId, block.content);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {saved && <span style={{ color: '#4a6b53', fontSize: '0.8rem' }}>✓ Saved</span>}
      {error && <span style={{ color: '#c0392b', fontSize: '0.8rem' }} title={error}>⚠ Error</span>}
      <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save Block'}
      </button>
    </div>
  );
}

export default PageBuilderAdmin;
