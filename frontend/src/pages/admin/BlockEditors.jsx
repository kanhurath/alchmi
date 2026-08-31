import { createContext, useContext, useRef, useState } from 'react';
import * as api from '../../services/customPagesApi';
import { uploadBlockPdf } from '../../services/customPagesApi';

// Optional context set by callers (e.g. SiteBlocksTab) to override image/PDF upload
export const UploadFnContext = createContext(null);
import { BLOCK_DEFS, getBlockDef } from '../../data/blockDefs';

// Blocks allowed inside a popup (no nested popups)
const POPUP_BLOCKS = BLOCK_DEFS.filter(d => d.type !== 'popup');

const SERVER     = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const API_SERVER = (import.meta.env.VITE_API_URL  || 'http://localhost:3001/api').replace('/api', '');

// ── Primitives ────────────────────────────────────────────────────────────────

function F({ label, value, onChange, type = 'text', rows, hint, placeholder }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows
        ? <textarea className="adm-input adm-textarea" value={value ?? ''} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        : <input    className="adm-input" type={type} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function Row({ children }) { return <div className="adm-field-row">{children}</div>; }

function ColorF({ label, value, onChange }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: 40, height: 32, border: '1px solid #d4c9b8', cursor: 'pointer', padding: 2 }} />
        <input className="adm-input" value={value || ''} onChange={e => onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function ImageF({ label, value, onChange, pageId }) {
  const ref = useRef();
  const uploadFn = useContext(UploadFnContext);
  const upload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { url } = uploadFn ? await uploadFn(file) : await api.uploadBlockImage(pageId, file);
      onChange(url);
    } catch { alert('Upload failed'); }
  };
  const src = value
    ? value.startsWith('http')           ? value
    : value.startsWith('/uploads/pages/') ? `${API_SERVER}${value}`
    : `${SERVER}${value}`
    : null;
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <div className="blk-img-row">
        {src && <img src={src} alt="" className="blk-img-thumb" />}
        <div style={{ flex: 1 }}>
          <input className="adm-input" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://... or /uploads/pages/..." />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
            <button className="adm-btn adm-btn-sm" onClick={() => ref.current?.click()}>Upload image</button>
            {value && <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => onChange('')}>Clear</button>}
          </div>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
        </div>
      </div>
    </div>
  );
}

function SelectF({ label, value, onChange, options }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <select className="adm-input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const set = (content, key, val) => ({ ...content, [key]: val });

function CheckF({ label, value, onChange }) {
  return (
    <div className="adm-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', display: 'flex' }}>
      <input type="checkbox" checked={value !== false} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
      <label className="adm-label" style={{ margin: 0, cursor: 'pointer' }}>{label}</label>
    </div>
  );
}

function SliderF({ label, value, onChange, min = 0, max = 1, step = 0.01 }) {
  const v = Number(value ?? 0.08);
  return (
    <div className="adm-field">
      <label className="adm-label">{label} — <strong>{v.toFixed(2)}</strong></label>
      <input type="range" min={min} max={max} step={step} value={v}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer', accentColor: '#de7336' }} />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroEditor({ content: c, onChange, pageId }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      {/* ── Content ── */}
      <h3 className="adm-sub-title">Content</h3>
      <Row>
        <F label="Eyebrow text" value={c.eyebrow} onChange={v => s('eyebrow', v)} />
        <F label="Title (plain)" value={c.title} onChange={v => s('title', v)} />
        <F label="Title (italic accent)" value={c.title_em} onChange={v => s('title_em', v)} />
      </Row>
      <F label="Subtitle" value={c.subtitle} onChange={v => s('subtitle', v)} rows={2} />
      <Row>
        <F label="CTA Button Text" value={c.cta_text} onChange={v => s('cta_text', v)} />
        <F label="CTA Button URL"  value={c.cta_url}  onChange={v => s('cta_url', v)} />
      </Row>

      <hr className="adm-divider" />

      {/* ── Gradient background ── */}
      <h3 className="adm-sub-title">Gradient Background</h3>
      <p className="adm-hint">Rendered as <code>linear-gradient(angle, start 0%, end 100%)</code></p>
      <Row>
        <ColorF label="Gradient Start (top)"   value={c.gradient_start || '#f3b33e'} onChange={v => s('gradient_start', v)} />
        <ColorF label="Gradient End (bottom)"  value={c.gradient_end   || '#de7336'} onChange={v => s('gradient_end', v)} />
        <F      label="Angle (deg)"            value={String(c.gradient_angle ?? 175)} type="number" onChange={v => s('gradient_angle', Number(v))} />
      </Row>

      <hr className="adm-divider" />

      {/* ── Background image overlay ── */}
      <h3 className="adm-sub-title">Background Image Overlay</h3>
      <p className="adm-hint">Layered on top of the gradient with mix-blend-mode: overlay. Leave empty to use gradient only.</p>
      <ImageF label="Background Image" value={c.bg_image_url} onChange={v => s('bg_image_url', v)} pageId={pageId} />
      <SliderF label="Image Opacity" value={c.bg_opacity ?? 0.08} onChange={v => s('bg_opacity', v)} />

      <hr className="adm-divider" />

      {/* ── Typography colours ── */}
      <h3 className="adm-sub-title">Typography Colours</h3>
      <Row>
        <ColorF label="Text colour"         value={c.text_color     || '#ffffff'} onChange={v => s('text_color', v)} />
        <ColorF label="Italic accent colour" value={c.title_em_color || '#8b2e33'} onChange={v => s('title_em_color', v)} />
      </Row>

      <hr className="adm-divider" />

      {/* ── Decorative elements ── */}
      <h3 className="adm-sub-title">Decorative Elements</h3>
      <Row>
        <CheckF label="Show spinning mandala"  value={c.show_mandala !== false} onChange={v => s('show_mandala', v)} />
        <CheckF label="Show OM (ॐ) overlay"    value={c.show_om !== false}      onChange={v => s('show_om', v)} />
      </Row>
      <ColorF
        label="OM symbol colour (use rgba for transparency, e.g. rgba(139,46,51,0.08))"
        value={c.om_color || 'rgba(139,46,51,0.08)'}
        onChange={v => s('om_color', v)}
      />
    </>
  );
}

// ── Text Section ──────────────────────────────────────────────────────────────
function TextSectionEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <Row>
        <F label="Label (small tag)" value={c.label}    onChange={v => s('label', v)} />
        <SelectF label="Alignment" value={c.alignment || 'left'} onChange={v => s('alignment', v)}
          options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]} />
      </Row>
      <Row>
        <F label="Title (plain)"  value={c.title}    onChange={v => s('title', v)} />
        <F label="Title (italic)" value={c.title_em} onChange={v => s('title_em', v)} />
      </Row>
      <F label="Body" value={c.body} onChange={v => s('body', v)} rows={8} hint="Plain text or basic HTML." />
    </>
  );
}

// ── Text + Image (shared for left/right) ─────────────────────────────────────
function TextImageEditor({ content: c, onChange, pageId }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <Row>
        <F label="Label" value={c.label} onChange={v => s('label', v)} />
        <F label="Title" value={c.title} onChange={v => s('title', v)} />
      </Row>
      <F label="Body" value={c.body} onChange={v => s('body', v)} rows={6} />
      <Row>
        <F label="CTA Text" value={c.cta_text} onChange={v => s('cta_text', v)} />
        <F label="CTA URL"  value={c.cta_url}  onChange={v => s('cta_url', v)} />
      </Row>
      <ImageF label="Image" value={c.image_url} onChange={v => s('image_url', v)} pageId={pageId} />
      <F label="Image Alt Text" value={c.image_alt} onChange={v => s('image_alt', v)} />
    </>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function AccordionEditor({ content: c, onChange }) {
  const items = c.items || [];
  const setItems = items => onChange({ ...c, items });
  const add    = ()      => setItems([...items, { question: '', answer: '' }]);
  const remove = i       => setItems(items.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const move   = (i, dir) => {
    const arr = [...items]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setItems(arr);
  };
  return (
    <>
      <F label="Section Title (optional)" value={c.title} onChange={v => onChange({ ...c, title: v })} />
      <hr className="adm-divider" />
      {items.map((it, i) => (
        <div key={i} className="blk-repeat-item">
          <div className="blk-repeat-header">
            <span className="adm-list-num">#{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#555' }}>{it.question || '(empty question)'}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="adm-btn adm-btn-sm" onClick={() => move(i,  1)} disabled={i === items.length - 1}>↓</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>✕</button>
          </div>
          <F label="Question" value={it.question} onChange={v => update(i, 'question', v)} />
          <F label="Answer"   value={it.answer}   onChange={v => update(i, 'answer',   v)} rows={3} />
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={add}>+ Add Item</button>
    </>
  );
}

// ── Image Cards ───────────────────────────────────────────────────────────────
function ImageCardsEditor({ content: c, onChange, pageId }) {
  const cards = c.cards || [];
  const setCards = cards => onChange({ ...c, cards });
  const add    = ()       => setCards([...cards, { image_url: '', title: '', subtitle: '', description: '', btn_text: '', btn_url: '' }]);
  const remove = i        => setCards(cards.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setCards(cards.map((cd, idx) => idx === i ? { ...cd, [k]: v } : cd));
  return (
    <>
      <Row>
        <F label="Section Title" value={c.title} onChange={v => onChange({ ...c, title: v })} />
        <SelectF label="Columns" value={String(c.columns || 3)} onChange={v => onChange({ ...c, columns: Number(v) })}
          options={[{ value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }]} />
      </Row>
      <hr className="adm-divider" />
      {cards.map((cd, i) => (
        <div key={i} className="blk-repeat-item">
          <div className="blk-repeat-header">
            <span className="adm-list-num">#{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#555' }}>{cd.title || '(no title)'}</span>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>✕</button>
          </div>
          <ImageF label="Card Image" value={cd.image_url} onChange={v => update(i, 'image_url', v)} pageId={pageId} />
          <Row>
            <F label="Title"    value={cd.title}    onChange={v => update(i, 'title', v)} />
            <F label="Subtitle" value={cd.subtitle} onChange={v => update(i, 'subtitle', v)} />
          </Row>
          <F label="Description (optional)" value={cd.description} onChange={v => update(i, 'description', v)} rows={3}
            hint="Longer body text shown below the subtitle. Leave empty to hide." />
          <Row>
            <F label="Button Text (optional)" value={cd.btn_text} onChange={v => update(i, 'btn_text', v)} placeholder="e.g. Learn More" />
            <F label="Button URL"             value={cd.btn_url}  onChange={v => update(i, 'btn_url', v)}  placeholder="/path or https://..." />
          </Row>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={add}>+ Add Card</button>
    </>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
function DataTableEditor({ content: c, onChange }) {
  const headers = c.headers || ['Column 1'];
  const rows    = c.rows    || [['']];

  const setH = headers => onChange({ ...c, headers, rows: rows.map(r => headers.map((_, i) => r[i] || '')) });
  const setR = rows    => onChange({ ...c, rows });

  const addCol = () => setH([...headers, `Column ${headers.length + 1}`]);
  const delCol = i  => { const h = headers.filter((_, j) => j !== i); setH(h); };
  const addRow = () => setR([...rows, headers.map(() => '')]);
  const delRow = i  => setR(rows.filter((_, j) => j !== i));
  const setCellH = (i, v) => { const h = [...headers]; h[i] = v; onChange({ ...c, headers: h }); };
  const setCellR = (r, col, v) => { const rs = rows.map((row, i) => i === r ? row.map((cell, j) => j === col ? v : cell) : row); setR(rs); };

  return (
    <>
      <F label="Table Title (optional)" value={c.title} onChange={v => onChange({ ...c, title: v })} />
      <hr className="adm-divider" />
      <div className="blk-table-wrap">
        <table className="blk-table-editor">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>
                  <input className="adm-input" value={h} onChange={e => setCellH(i, e.target.value)} style={{ minWidth: 80 }} />
                  <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ marginLeft: 4 }} onClick={() => delCol(i)}>✕</button>
                </th>
              ))}
              <th><button className="adm-btn adm-btn-sm" onClick={addCol}>+ Col</button></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {headers.map((_, col) => (
                  <td key={col}><input className="adm-input" value={row[col] || ''} onChange={e => setCellR(r, col, e.target.value)} style={{ minWidth: 80 }} /></td>
                ))}
                <td><button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => delRow(r)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={addRow}>+ Add Row</button>
    </>
  );
}

// ── Logo Slider ───────────────────────────────────────────────────────────────
function LogoSliderEditor({ content: c, onChange, pageId }) {
  const logos = c.logos || [];
  const setLogos = l => onChange({ ...c, logos: l });
  const add    = ()       => setLogos([...logos, { image_url: '', alt: '', link_url: '' }]);
  const remove = i        => setLogos(logos.filter((_, j) => j !== i));
  const update = (i, k, v) => setLogos(logos.map((l, j) => j === i ? { ...l, [k]: v } : l));
  return (
    <>
      <F label="Section Title (optional)" value={c.title} onChange={v => onChange({ ...c, title: v })} />
      <hr className="adm-divider" />
      {logos.map((l, i) => (
        <div key={i} className="blk-repeat-item">
          <div className="blk-repeat-header">
            <span className="adm-list-num">#{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#555' }}>{l.alt || '(no alt text)'}</span>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>✕</button>
          </div>
          <ImageF label="Logo Image" value={l.image_url} onChange={v => update(i, 'image_url', v)} pageId={pageId} />
          <Row>
            <F label="Alt Text" value={l.alt}      onChange={v => update(i, 'alt', v)} />
            <F label="Link URL" value={l.link_url} onChange={v => update(i, 'link_url', v)} />
          </Row>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={add}>+ Add Logo</button>
    </>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CtaEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <Row>
        <F label="Title"    value={c.title}    onChange={v => s('title', v)} />
        <F label="Subtitle" value={c.subtitle} onChange={v => s('subtitle', v)} />
      </Row>
      <Row>
        <F label="Button Text" value={c.btn_text} onChange={v => s('btn_text', v)} />
        <F label="Button URL"  value={c.btn_url}  onChange={v => s('btn_url',  v)} />
      </Row>
      <Row>
        <ColorF label="Background Colour" value={c.bg_color}   onChange={v => s('bg_color', v)} />
        <ColorF label="Text Colour"       value={c.text_color} onChange={v => s('text_color', v)} />
      </Row>
    </>
  );
}

// ── Pull Quote ────────────────────────────────────────────────────────────────
function QuoteBlockEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <F label="Quote Text"   value={c.text}        onChange={v => s('text', v)} rows={4} />
      <F label="Attribution"  value={c.attribution} onChange={v => s('attribution', v)} placeholder="— Author, Source" />
    </>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function DividerEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <Row>
      <SelectF label="Style" value={c.style || 'line'} onChange={v => s('style', v)}
        options={[{ value: 'line', label: 'Horizontal Line' }, { value: 'space', label: 'Empty Space' }, { value: 'ornament', label: 'Ornament' }]} />
      <F label="Height (px)" value={String(c.height || 60)} type="number" onChange={v => s('height', Number(v))} />
    </Row>
  );
}

// ── PDF upload field ──────────────────────────────────────────────────────────
function PdfF({ label, value, onChange, pageId }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const uploadFn = useContext(UploadFnContext);
  const upload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { url } = uploadFn ? await uploadFn(file) : await uploadBlockPdf(pageId, file);
      onChange(url);
    } catch { alert('PDF upload failed — check server logs.'); }
    finally { setUploading(false); e.target.value = ''; }
  };
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <input className="adm-input" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="https://... or /uploads/pages/file.pdf" style={{ marginBottom: '0.35rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button className="adm-btn adm-btn-sm" onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </button>
        {value && <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => onChange('')}>Clear</button>}
        {value && <span className="adm-hint" style={{ margin: 0 }}>✓ {value.split('/').pop()}</span>}
      </div>
      <input ref={ref} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={upload} />
    </div>
  );
}

// ── Image Section Editor ──────────────────────────────────────────────────────
function ImageSectionEditor({ content: c, onChange, pageId }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <Row>
        <F label="Label (eyebrow, optional)" value={c.label} onChange={v => s('label', v)} />
        <F label="Title (optional)"          value={c.title} onChange={v => s('title', v)} />
      </Row>
      <ImageF label="Image" value={c.image_url} onChange={v => s('image_url', v)} pageId={pageId} />
      <Row>
        <F label="Alt Text"    value={c.image_alt} onChange={v => s('image_alt', v)} placeholder="Describe the image" />
        <F label="Caption"     value={c.caption}   onChange={v => s('caption', v)}   placeholder="Shown below image" />
      </Row>
      <Row>
        <F label="Link URL (optional — wraps image in an anchor)" value={c.link_url} onChange={v => s('link_url', v)} />
        <F label="Max Width (e.g. 800px, 60%, 100%)" value={c.max_width || '100%'} onChange={v => s('max_width', v)} />
      </Row>
      <SelectF label="Alignment" value={c.alignment || 'center'} onChange={v => s('alignment', v)}
        options={[
          { value: 'left',   label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right',  label: 'Right' },
          { value: 'full',   label: 'Full Width' },
        ]} />
    </>
  );
}

// ── YouTube Video Editor ──────────────────────────────────────────────────────
function YouTubeEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <Row>
        <F label="Label (eyebrow, optional)" value={c.label} onChange={v => s('label', v)} />
        <F label="Title (optional)"          value={c.title} onChange={v => s('title', v)} />
      </Row>
      <F label="Description (optional)" value={c.description} onChange={v => s('description', v)} rows={3} />
      <F label="YouTube URL or Video ID" value={c.youtube_url} onChange={v => s('youtube_url', v)}
        placeholder="https://www.youtube.com/watch?v=... or just the video ID"
        hint="Accepts full YouTube URL (watch, youtu.be, embed) or the 11-character video ID directly." />
      <SelectF label="Aspect Ratio" value={c.aspect_ratio || '16:9'} onChange={v => s('aspect_ratio', v)}
        options={[
          { value: '16:9', label: '16 : 9 (Widescreen)' },
          { value: '4:3',  label: '4 : 3 (Standard)' },
          { value: '1:1',  label: '1 : 1 (Square)' },
          { value: '9:16', label: '9 : 16 (Portrait / Shorts)' },
        ]} />
    </>
  );
}

// ── PDF Section Editor ────────────────────────────────────────────────────────
function PdfSectionEditor({ content: c, onChange, pageId }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <h3 className="adm-sub-title">Content</h3>
      <Row>
        <F label="Label (eyebrow, optional)" value={c.label}       onChange={v => s('label', v)} />
        <F label="Title (optional)"          value={c.title}       onChange={v => s('title', v)} />
      </Row>
      <F label="Description (optional)" value={c.description} onChange={v => s('description', v)} rows={3} />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Trigger Button</h3>
      <Row>
        <F label="Button / Link Text" value={c.btn_text || 'Open PDF'} onChange={v => s('btn_text', v)} />
        <SelectF label="Style" value={c.btn_style || 'button'} onChange={v => s('btn_style', v)}
          options={[{ value: 'button', label: 'Button' }, { value: 'link', label: 'Text Link' }]} />
      </Row>

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">PDF File</h3>
      <PdfF label="PDF File (upload or paste URL)" value={c.pdf_url} onChange={v => s('pdf_url', v)} pageId={pageId} />
      <F label="Modal / Viewer Title" value={c.modal_title || ''} onChange={v => s('modal_title', v)}
        placeholder="e.g. Programme Overview" hint="Shown at the top of the PDF viewer popup." />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Image (optional)</h3>
      <p className="adm-hint">Leave empty to show text + button only. When set, the image is displayed alongside the content.</p>
      <ImageF label="Image" value={c.image_url} onChange={v => s('image_url', v)} pageId={pageId} />
      <Row>
        <F label="Image Alt Text" value={c.image_alt || ''} onChange={v => s('image_alt', v)} placeholder="Describe the image" />
        <SelectF label="Image Position" value={c.image_position || 'left'} onChange={v => s('image_position', v)}
          options={[
            { value: 'left',  label: 'Left of content' },
            { value: 'right', label: 'Right of content' },
            { value: 'above', label: 'Above content' },
            { value: 'below', label: 'Below content' },
          ]} />
      </Row>
    </>
  );
}

// ── Custom Tabs ───────────────────────────────────────────────────────────────
function TabsEditor({ content: c, onChange, pageId }) {
  const tabs = c.tabs || [];
  const setTabs = t => onChange({ ...c, tabs: t });
  const add    = ()         => setTabs([...tabs, { title: `Tab ${tabs.length + 1}`, content: '', image_url: '' }]);
  const remove = i          => setTabs(tabs.filter((_, idx) => idx !== i));
  const update = (i, k, v)  => setTabs(tabs.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
  const move   = (i, dir)   => {
    const arr = [...tabs]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setTabs(arr);
  };
  return (
    <>
      {tabs.map((tab, i) => (
        <div key={i} className="blk-repeat-item">
          <div className="blk-repeat-header">
            <span className="adm-list-num">Tab {i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#555' }}>{tab.title || '(untitled)'}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="adm-btn adm-btn-sm" onClick={() => move(i,  1)} disabled={i === tabs.length - 1}>↓</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>✕</button>
          </div>
          <F label="Tab Title" value={tab.title} onChange={v => update(i, 'title', v)} />
          <F label="Tab Content (HTML supported)" value={tab.content} onChange={v => update(i, 'content', v)} rows={7}
            hint="Supports plain text or basic HTML tags." />
          <ImageF label="Tab Image (optional, shown below content)" value={tab.image_url} onChange={v => update(i, 'image_url', v)} pageId={pageId} />
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={add}>+ Add Tab</button>
    </>
  );
}

// ── Custom Popup ──────────────────────────────────────────────────────────────
function PopupEditor({ content: c, onChange, pageId }) {
  const s = (k, v) => onChange({ ...c, [k]: v });
  const blocks    = c.blocks || [];
  const setBlocks = b => onChange({ ...c, blocks: b });
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [showPicker,  setShowPicker]  = useState(false);

  const addBlock = def => {
    const next = [...blocks, { block_type: def.type, content: { ...def.defaultContent } }];
    setBlocks(next);
    setExpandedIdx(next.length - 1);
    setShowPicker(false);
  };
  const removeBlock = i => { setBlocks(blocks.filter((_, idx) => idx !== i)); if (expandedIdx === i) setExpandedIdx(null); };
  const moveBlock   = (i, dir) => {
    const arr = [...blocks]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setBlocks(arr);
  };
  const updateBlock = (i, content) => setBlocks(blocks.map((b, idx) => idx === i ? { ...b, content } : b));

  return (
    <>
      {/* Trigger */}
      <h3 className="adm-sub-title">Trigger</h3>
      <Row>
        <F label="Button / Link Text" value={c.trigger_text || ''} onChange={v => s('trigger_text', v)} placeholder="Open" />
        <SelectF label="Style" value={c.trigger_style || 'button'} onChange={v => s('trigger_style', v)}
          options={[{ value: 'button', label: 'Button' }, { value: 'link', label: 'Text Link' }]} />
      </Row>

      <hr className="adm-divider" />

      {/* Popup settings */}
      <h3 className="adm-sub-title">Popup Settings</h3>
      <Row>
        <F label="Popup Title (optional)" value={c.popup_title || ''} onChange={v => s('popup_title', v)} />
        <F label="Max Width (e.g. 860px)" value={c.popup_width  || '860px'} onChange={v => s('popup_width', v)} />
      </Row>

      <hr className="adm-divider" />

      {/* Mini block builder */}
      <h3 className="adm-sub-title">Popup Content — {blocks.length} block{blocks.length !== 1 ? 's' : ''}</h3>
      <p className="adm-hint">Add any Design Library element to appear inside the popup.</p>

      {blocks.map((block, i) => {
        const def        = getBlockDef(block.block_type);
        const isExpanded = expandedIdx === i;
        return (
          <div key={i} className="popup-editor-block">
            <div className="blk-repeat-header">
              <span className="adm-list-num">{def.icon}</span>
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#1a1208' }}>{def.label}</span>
              <button className="adm-btn adm-btn-sm" onClick={() => moveBlock(i, -1)} disabled={i === 0}>↑</button>
              <button className="adm-btn adm-btn-sm" onClick={() => moveBlock(i,  1)} disabled={i === blocks.length - 1}>↓</button>
              <button className="adm-btn adm-btn-sm" onClick={() => setExpandedIdx(isExpanded ? null : i)}>
                {isExpanded ? 'Collapse' : 'Edit'}
              </button>
              <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeBlock(i)}>✕</button>
            </div>
            {isExpanded && (
              <div className="popup-editor-block-body">
                <BlockEditor
                  block={block}
                  pageId={pageId}
                  onChange={content => updateBlock(i, content)}
                />
              </div>
            )}
          </div>
        );
      })}

      {showPicker ? (
        <div className="popup-block-picker">
          <p className="adm-hint" style={{ marginBottom: '0.6rem' }}>Select a block to add inside the popup:</p>
          <div className="popup-block-picker-grid">
            {POPUP_BLOCKS.map(def => (
              <button key={def.type} className="popup-picker-item" onClick={() => addBlock(def)}>
                <span className="popup-picker-icon">{def.icon}</span>
                <span className="popup-picker-name">{def.label}</span>
              </button>
            ))}
          </div>
          <button className="adm-btn adm-btn-sm" onClick={() => setShowPicker(false)} style={{ marginTop: '0.75rem' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setShowPicker(true)}>
          + Add Block to Popup
        </button>
      )}
    </>
  );
}

// ── HTML Editor ───────────────────────────────────────────────────────────────
function HtmlEditor({ content: c, onChange }) {
  const s = (k, v) => onChange(set(c, k, v));
  return (
    <>
      <div className="adm-field" style={{ background: '#fdf0e8', border: '1px solid #f3b33e', padding: '0.65rem 0.85rem', marginBottom: '0.75rem' }}>
        <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.05em', color: '#8b2e33', margin: 0 }}>
          ⚠ Raw HTML is rendered directly on the page. Only use trusted content — scripts are not sanitised.
        </p>
      </div>
      <F label="Admin Label (for reference only, not shown on site)" value={c.label} onChange={v => s('label', v)} placeholder="e.g. Map embed, Custom widget…" />
      <F label="HTML Content" value={c.html} onChange={v => s('html', v)} rows={16}
        hint="Paste or write HTML here. Inline styles, iframes, embeds and standard tags are all supported." />
    </>
  );
}

// ── Carousel Editor ───────────────────────────────────────────────────────────
function CarouselEditor({ content: c, onChange, pageId }) {
  const slides = c.slides || [];
  const setSlides = s => onChange({ ...c, slides: s });
  const addSlide    = ()         => setSlides([...slides, { image_url: '', image_alt: '', label: '', title: '', subtitle: '', btn_text: '', btn_url: '', overlay_opacity: 0.45 }]);
  const removeSlide = i          => setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlide = (i, k, v)  => setSlides(slides.map((sl, idx) => idx === i ? { ...sl, [k]: v } : sl));
  const moveSlide   = (i, dir)   => {
    const arr = [...slides]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setSlides(arr);
  };

  return (
    <>
      {/* ── Global settings ── */}
      <h3 className="adm-sub-title">Slider Settings</h3>
      <Row>
        <F label="Slide Height (px or vh)" value={c.height || '520px'} onChange={v => onChange({ ...c, height: v })} placeholder="520px" />
        <F label="Autoplay Interval (ms)"  value={String(c.autoplay_interval || 4000)} type="number" onChange={v => onChange({ ...c, autoplay_interval: Number(v) })} />
      </Row>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <CheckF label="Autoplay"     value={!!c.autoplay}              onChange={v => onChange({ ...c, autoplay: v })} />
        <CheckF label="Show Arrows"  value={c.show_arrows !== false}   onChange={v => onChange({ ...c, show_arrows: v })} />
        <CheckF label="Show Dots"    value={c.show_dots !== false}     onChange={v => onChange({ ...c, show_dots: v })} />
      </div>

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Slides ({slides.length})</h3>

      {slides.map((sl, i) => (
        <div key={i} className="blk-repeat-item">
          <div className="blk-repeat-header">
            <span className="adm-list-num">Slide {i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.8rem', color: '#555' }}>{sl.title || '(no title)'}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => moveSlide(i, -1)} disabled={i === 0}>↑</button>
            <button className="adm-btn adm-btn-sm" onClick={() => moveSlide(i,  1)} disabled={i === slides.length - 1}>↓</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeSlide(i)}>✕</button>
          </div>
          <ImageF label="Slide Image" value={sl.image_url} onChange={v => updateSlide(i, 'image_url', v)} pageId={pageId} />
          <F label="Image Alt Text" value={sl.image_alt} onChange={v => updateSlide(i, 'image_alt', v)} />
          <SliderF label="Dark Overlay Opacity" value={sl.overlay_opacity ?? 0.45} onChange={v => updateSlide(i, 'overlay_opacity', v)} />
          <Row>
            <F label="Eyebrow / Label"  value={sl.label}    onChange={v => updateSlide(i, 'label', v)} />
            <F label="Title"            value={sl.title}    onChange={v => updateSlide(i, 'title', v)} />
          </Row>
          <F label="Subtitle" value={sl.subtitle} onChange={v => updateSlide(i, 'subtitle', v)} rows={2} />
          <Row>
            <F label="Button Text (optional)" value={sl.btn_text} onChange={v => updateSlide(i, 'btn_text', v)} placeholder="e.g. Learn More" />
            <F label="Button URL"             value={sl.btn_url}  onChange={v => updateSlide(i, 'btn_url', v)}  placeholder="/path or https://…" />
          </Row>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" style={{ marginTop: '0.5rem' }} onClick={addSlide}>+ Add Slide</button>
    </>
  );
}

// ── Main switch ───────────────────────────────────────────────────────────────
export function BlockEditor({ block, onChange, pageId, uploadFn }) {
  const props = { content: block.content, onChange, pageId };
  const editor = (() => {
    switch (block.block_type) {
      case 'hero':             return <HeroEditor        {...props} />;
      case 'text_section':     return <TextSectionEditor {...props} />;
      case 'text_image_left':
      case 'text_image_right': return <TextImageEditor   {...props} />;
      case 'accordion':        return <AccordionEditor   {...props} />;
      case 'image_cards':      return <ImageCardsEditor  {...props} />;
      case 'data_table':       return <DataTableEditor   {...props} />;
      case 'logo_slider':      return <LogoSliderEditor  {...props} />;
      case 'cta':              return <CtaEditor          {...props} />;
      case 'quote_block':      return <QuoteBlockEditor  {...props} />;
      case 'divider':          return <DividerEditor     {...props} />;
      case 'html_block':       return <HtmlEditor        {...props} />;
      case 'carousel':         return <CarouselEditor    {...props} />;
      case 'image_section':    return <ImageSectionEditor {...props} />;
      case 'youtube_video':    return <YouTubeEditor     {...props} />;
      case 'pdf_section':      return <PdfSectionEditor  {...props} />;
      case 'tabs':             return <TabsEditor        {...props} />;
      case 'popup':            return <PopupEditor       {...props} />;
      default:                 return <p className="adm-hint">No editor for block type "{block.block_type}".</p>;
    }
  })();
  return uploadFn
    ? <UploadFnContext.Provider value={uploadFn}>{editor}</UploadFnContext.Provider>
    : editor;
}
