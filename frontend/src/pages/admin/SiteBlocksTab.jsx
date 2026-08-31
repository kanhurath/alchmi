import { useState, useEffect, useCallback } from 'react';
import { getBlockDef } from '../../data/blockDefs';
import { BlockEditor } from './BlockEditors';
import { DesignLibraryModal } from '../../components/blocks/DesignLibraryModal';
import * as siteApi from '../../services/siteBlocksApi';
import './SiteBlocksTab.css';

export function SiteBlocksTab({ pageSlug }) {
  const [blocks,   setBlocks]   = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [library,  setLibrary]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const load = useCallback(() =>
    siteApi.getBlocks(pageSlug).then(setBlocks).catch(() => {}), [pageSlug]);

  useEffect(() => { load(); }, [load]);

  const activeBlock = blocks.find(b => b.id === activeId) ?? null;

  const uploadFn = file => siteApi.uploadBlockImage(pageSlug, file);

  // ── Add from library ────────────────────────────────────────────────────────
  const handleSelect = async def => {
    setLibrary(false);
    try {
      const block = await siteApi.addBlock(pageSlug, {
        block_type: def.type,
        content:    def.defaultContent,
        sort_order: blocks.length + 1,
      });
      setBlocks(prev => [...prev, block]);
      setActiveId(block.id);
    } catch (e) { setError(e.message); }
  };

  // ── Move ────────────────────────────────────────────────────────────────────
  const move = async (blockId, dir) => {
    const idx  = blocks.findIndex(b => b.id === blockId);
    const swap = idx + dir;
    if (swap < 0 || swap >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBlocks(next);
    await siteApi.reorderBlocks(pageSlug, next.map((b, i) => ({ id: b.id, sort_order: i + 1 })));
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const removeBlock = async blockId => {
    if (!confirm('Delete this section?')) return;
    await siteApi.deleteBlock(pageSlug, blockId);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (activeId === blockId) setActiveId(null);
  };

  // ── Save block content ──────────────────────────────────────────────────────
  const saveBlock = async (blockId, content) => {
    setSaving(true); setSaved(false); setError('');
    try {
      await siteApi.updateBlock(pageSlug, blockId, { content });
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ── Width toggle ────────────────────────────────────────────────────────────
  const setWidth = async (w) => {
    if (!activeBlock) return;
    const newContent = { ...(activeBlock.content || {}), wrapper_width: w };
    setBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, content: newContent } : b));
    try { await siteApi.updateBlock(pageSlug, activeBlock.id, { content: newContent }); } catch { /* saved on next Save */ }
  };

  return (
    <div className="stb-root">
      <div className="stb-hint">
        Extra sections built from the Design Library. They are rendered below the page's main content on the public site.
      </div>

      <div className="stb-body">
        {/* ── Block list ── */}
        <div className="stb-sidebar">
          <div className="stb-sidebar-head">Sections ({blocks.length})</div>

          {blocks.length === 0 && (
            <p className="stb-empty">No extra sections yet. Click "Add New Section" below.</p>
          )}

          {blocks.map((b, idx) => {
            const def = getBlockDef(b.block_type);
            return (
              <div
                key={b.id}
                className={`stb-block-row${activeId === b.id ? ' active' : ''}`}
                onClick={() => setActiveId(activeId === b.id ? null : b.id)}
              >
                <span className="stb-block-icon">{def.icon}</span>
                <span className="stb-block-label">{def.label}</span>
                <div className="stb-block-btns" onClick={e => e.stopPropagation()}>
                  <button onClick={() => move(b.id, -1)} disabled={idx === 0} title="Move up">↑</button>
                  <button onClick={() => move(b.id,  1)} disabled={idx === blocks.length - 1} title="Move down">↓</button>
                  <button className="danger" onClick={() => removeBlock(b.id)} title="Delete">✕</button>
                </div>
              </div>
            );
          })}

          <button className="stb-add-btn" onClick={() => setLibrary(true)}>
            + Add New Section
          </button>
        </div>

        {/* ── Editor panel ── */}
        <div className="stb-editor">
          {!activeBlock ? (
            <div className="stb-editor-empty">
              <div className="stb-editor-empty-icon">⊞</div>
              <p>{blocks.length === 0
                ? 'Add your first section using the button on the left.'
                : 'Select a section on the left to edit its content.'}</p>
            </div>
          ) : (
            <div className="stb-editor-panel">
              <div className="stb-editor-head">
                <div className="stb-editor-head-left">
                  <span className="stb-editor-type">
                    {getBlockDef(activeBlock.block_type).icon} {getBlockDef(activeBlock.block_type).label}
                  </span>
                  <div className="stb-width-toggle">
                    <span className="stb-width-label">Width</span>
                    {['contained', 'full'].map(w => (
                      <button
                        key={w}
                        className={`stb-width-btn${(activeBlock.content?.wrapper_width || 'contained') === w ? ' active' : ''}`}
                        onClick={() => setWidth(w)}
                        title={w === 'full' ? 'Full width (100%)' : 'Contained (max 1100px)'}
                      >
                        {w === 'full' ? '⇔ 100%' : '⊡ Contained'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="stb-save-row">
                  {saved  && <span className="stb-saved-msg">✓ Saved</span>}
                  {error  && <span className="stb-error-msg" title={error}>⚠ Error</span>}
                  <button
                    className="adm-btn adm-btn-primary"
                    onClick={() => saveBlock(activeBlock.id, activeBlock.content)}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Block'}
                  </button>
                </div>
              </div>
              <div className="stb-editor-body">
                <BlockEditor
                  block={activeBlock}
                  uploadFn={uploadFn}
                  onChange={content =>
                    setBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, content } : b))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {library && <DesignLibraryModal onSelect={handleSelect} onClose={() => setLibrary(false)} />}
    </div>
  );
}
