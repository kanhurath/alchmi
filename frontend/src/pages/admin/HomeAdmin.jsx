import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/homeApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import { SectionStylePanel } from '../../components/admin/SectionStylePanel';
import { SectionVisibilityToggle } from '../../components/admin/SectionVisibilityToggle';
import './HomeAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows, hint }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows ? (
        <textarea className="adm-input adm-textarea" name={name} value={value ?? ''} rows={rows} onChange={onChange} />
      ) : (
        <input className="adm-input" type={type} name={name} value={value ?? ''} onChange={onChange} />
      )}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function Row({ children }) {
  return <div className="adm-field-row">{children}</div>;
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved  && <span className="adm-saved-msg">✓ Saved</span>}
      {error  && <span className="adm-saved-msg" style={{ color: '#c0392b' }}>⚠ {error}</span>}
    </div>
  );
}

function useSave(apiFn) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const save = useCallback(async (data) => {
    setSaving(true); setSaved(false); setError('');
    try {
      await apiFn(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || 'Save failed — check server logs');
    } finally {
      setSaving(false);
    }
  }, [apiFn]);
  return { save, saving, saved, error };
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function imgSrc(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

function HeroImageUpload({ label, hint, currentUrl, uploadFn, onUploaded, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const ref = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const { url } = await uploadFn(file);
      onUploaded(url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const src = imgSrc(currentUrl);

  return (
    <div className="adm-field">
      {label && <label className="adm-label">{label}</label>}
      <div className="adm-photo-row">
        {src && (
          <img src={src} alt={label} style={{ maxHeight: '80px', maxWidth: '160px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input ref={ref} type="file" accept="image/*" className="adm-file" onChange={handle} />
            {src && onRemove && (
              <button
                className="adm-btn adm-btn-sm"
                style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5', whiteSpace: 'nowrap' }}
                onClick={onRemove}
                type="button"
              >
                Remove
              </button>
            )}
          </div>
          {uploading && <p className="adm-hint">Uploading…</p>}
          {error    && <p className="adm-hint" style={{ color: '#c0392b' }}>⚠ {error}</p>}
          {!uploading && !error && src  && <p className="adm-hint">✓ Custom image saved.</p>}
          {!uploading && !error && !src && <p className="adm-hint">{hint || 'No image uploaded — default asset is used.'}</p>}
        </div>
      </div>
    </div>
  );
}

function HeroTab() {
  const [form, setForm] = useState({
    mantra:'', eyebrow:'', title_line1:'', title_em:'', title_line3:'',
    subtitle:'', cta1_text:'', cta1_link:'', cta2_text:'', cta2_link:'',
    bg_image_url:'', bg_image_mob_url:'', animation_image_url:'', animation_image_mob_url:'',
    animation_html_desktop:'', animation_html_mobile:'',
    portrait_url:'', portrait_mob_url:'',
  });
  const { save, saving, saved, error } = useSave(api.updateHero);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/hero`)
      .then(r => r.json())
      .then(d => setForm(f => ({ ...f, ...d })))
      .catch(() => {});
  }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Banner</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="hero" />
      <p className="adm-hint">Controls the full-screen opening section with the canvas animation.</p>

      {/* ── Images ── */}
      <h3 className="adm-sub-title" style={{ marginTop: '1.25rem' }}>Images</h3>

      <HeroImageUpload
        label="Background Image (Desktop)"
        hint="Full-screen background photo on desktop. Recommended: wide landscape JPG, min 1920×1080px."
        currentUrl={form.bg_image_url}
        uploadFn={api.uploadHeroBg}
        onUploaded={url => set('bg_image_url', url)}
        onRemove={() => set('bg_image_url', '')}
      />

      <HeroImageUpload
        label="Background Image (Mobile)"
        hint="Background photo shown on mobile (≤ 900 px). Falls back to the desktop image if left empty. Recommended: portrait-crop JPG."
        currentUrl={form.bg_image_mob_url}
        uploadFn={api.uploadHeroBgMob}
        onUploaded={url => set('bg_image_mob_url', url)}
        onRemove={() => set('bg_image_mob_url', '')}
      />

      {/* ── Canvas Animation — Desktop ── */}
      <div className="adm-field">
        <label className="adm-label">Canvas Animation — Desktop</label>
        <p className="adm-hint" style={{ marginBottom: '0.5rem' }}>
          Paste SVG or HTML/CSS to replace the live canvas animation on desktop. Leave empty to keep the live animation.
        </p>
        <textarea
          className="adm-input adm-textarea adm-code-area"
          rows={10}
          spellCheck={false}
          placeholder={'<!-- Paste SVG, HTML, or <style> + markup here -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">\n  …\n</svg>'}
          value={form.animation_html_desktop}
          onChange={e => set('animation_html_desktop', e.target.value)}
        />
        <p className="adm-hint">
          Rendered verbatim inside the hero on desktop. Supports inline SVG, HTML with embedded <code>&lt;style&gt;</code>, and CSS animations. Clear the field to revert to the canvas animation.
        </p>
      </div>

      {/* ── Canvas Animation — Mobile ── */}
      <div className="adm-field">
        <label className="adm-label">Canvas Animation — Mobile</label>
        <p className="adm-hint" style={{ marginBottom: '0.5rem' }}>
          Paste SVG or HTML/CSS to replace the live canvas animation on mobile. Leave empty to keep the live animation.
        </p>
        <textarea
          className="adm-input adm-textarea adm-code-area"
          rows={10}
          spellCheck={false}
          placeholder={'<!-- Paste SVG, HTML, or <style> + markup here -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">\n  …\n</svg>'}
          value={form.animation_html_mobile}
          onChange={e => set('animation_html_mobile', e.target.value)}
        />
        <p className="adm-hint">
          Rendered verbatim inside the hero on mobile. Supports inline SVG, HTML with embedded <code>&lt;style&gt;</code>, and CSS animations. Clear the field to revert to the canvas animation.
        </p>
      </div>

      <HeroImageUpload
        label="Portrait / Banner Image (Desktop)"
        hint="Hero portrait shown on the right side on desktop. Recommended: transparent-bg PNG."
        currentUrl={form.portrait_url}
        uploadFn={api.uploadHeroPortrait}
        onUploaded={url => set('portrait_url', url)}
        onRemove={() => set('portrait_url', '')}
      />

      <HeroImageUpload
        label="Portrait / Banner Image (Mobile)"
        hint="Hero portrait shown on mobile. Recommended: transparent-bg PNG, portrait crop."
        currentUrl={form.portrait_mob_url}
        uploadFn={api.uploadHeroPortraitMob}
        onUploaded={url => set('portrait_mob_url', url)}
        onRemove={() => set('portrait_mob_url', '')}
      />

      <hr className="adm-divider" />

      {/* ── Text content ── */}
      <h3 className="adm-sub-title">Text Content</h3>
      <Field label="Sanskrit Mantra (use \n for line break)" name="mantra"      value={form.mantra}      onChange={h} rows={3} />
      <Field label="Eyebrow Text"                            name="eyebrow"     value={form.eyebrow}     onChange={h} />
      <Row>
        <Field label="Title Line 1 (plain)"  name="title_line1" value={form.title_line1} onChange={h} />
        <Field label="Title Line 2 (italic)" name="title_em"    value={form.title_em}    onChange={h} />
        <Field label="Title Line 3 (plain)"  name="title_line3" value={form.title_line3} onChange={h} />
      </Row>
      <Field label="Subtitle" name="subtitle" value={form.subtitle} onChange={h} rows={2} />
      <Row>
        <Field label="CTA 1 Text" name="cta1_text" value={form.cta1_text} onChange={h} />
        <Field label="CTA 1 Link" name="cta1_link" value={form.cta1_link} onChange={h} />
      </Row>
      <Row>
        <Field label="CTA 2 Text" name="cta2_text" value={form.cta2_text} onChange={h} />
        <Field label="CTA 2 Link" name="cta2_link" value={form.cta2_link} onChange={h} />
      </Row>
      <SectionStylePanel sectionKey="home:hero" />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Hero Style ───────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STYLE_DEFAULTS = {
  style_mantra_size: '', style_mantra_color: '',
  style_eyebrow_size: '', style_eyebrow_color: '',
  style_title_size: '', style_title_color: '', style_title_em_color: '',
  style_subtitle_size: '', style_subtitle_color: '',
  style_btn1_bg: '', style_btn1_color: '', style_btn1_hover_bg: '', style_btn1_hover_color: '',
  style_btn2_bg: '', style_btn2_border: '', style_btn2_color: '',
  style_btn2_hover_bg: '', style_btn2_hover_border: '', style_btn2_hover_color: '',
};

function ColorRow({ label, value, onChange, onReset, fallback }) {
  const safe = (value && /^#|^rgb|^hsl/.test(value)) ? value : (fallback || '#000000');
  return (
    <div className="adm-style-row">
      <span className="adm-style-label">{label}</span>
      <div className="adm-style-controls">
        <label className="adm-color-swatch-wrap" title={value || 'using default'}>
          <span className="adm-color-swatch" style={{ background: value || fallback || '#cccccc' }} />
          <input type="color" value={safe} onChange={e => onChange(e.target.value)} className="adm-color-hidden-inp" />
        </label>
        <span className="adm-style-val">{value || <em style={{ opacity: 0.45 }}>default</em>}</span>
        {value && <button className="adm-style-reset" onClick={onReset} title="Reset to default">↺</button>}
      </div>
    </div>
  );
}

function SizeRow({ label, value, onChange, placeholder }) {
  return (
    <div className="adm-style-row">
      <span className="adm-style-label">{label}</span>
      <div className="adm-style-controls">
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'default'}
          className="adm-input adm-input-sm adm-style-size-inp"
        />
        <span className="adm-style-unit">px</span>
        {value && <button className="adm-style-reset" onClick={() => onChange('')} title="Reset to default">↺</button>}
      </div>
    </div>
  );
}

function StyleGroup({ title, children }) {
  return (
    <div className="adm-style-group">
      <h3 className="adm-sub-title" style={{ marginBottom: '0.5rem' }}>{title}</h3>
      {children}
    </div>
  );
}

function HeroStyleTab() {
  const [form, setForm] = useState(STYLE_DEFAULTS);
  const { save, saving, saved, error } = useSave(api.updateHero);

  useEffect(() => {
    fetch(`${API_URL}/home/hero`)
      .then(r => r.json())
      .then(d => setForm(f => ({ ...f, ...Object.fromEntries(Object.keys(STYLE_DEFAULTS).map(k => [k, d[k] ?? ''])) })))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clr = (k)    => set(k, '');

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Banner — Style</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="hero" />
      <p className="adm-hint" style={{ marginBottom: '1.25rem' }}>
        Override font sizes and colors for each element in the hero banner. Leave a field empty to use the default theme value.
      </p>

      <StyleGroup title="Sanskrit Mantra">
        <SizeRow  label="Font Size"  value={form.style_mantra_size}  onChange={v => set('style_mantra_size', v)}  placeholder="15" />
        <ColorRow label="Color"      value={form.style_mantra_color} onChange={v => set('style_mantra_color', v)} onReset={() => clr('style_mantra_color')} fallback="#8b2e33" />
      </StyleGroup>

      <StyleGroup title="Eyebrow Text">
        <SizeRow  label="Font Size"  value={form.style_eyebrow_size}  onChange={v => set('style_eyebrow_size', v)}  placeholder="10" />
        <ColorRow label="Color"      value={form.style_eyebrow_color} onChange={v => set('style_eyebrow_color', v)} onReset={() => clr('style_eyebrow_color')} fallback="#d4670a" />
      </StyleGroup>

      <StyleGroup title="Title">
        <SizeRow  label="Font Size (overrides responsive clamp)" value={form.style_title_size}     onChange={v => set('style_title_size', v)}     placeholder="80" />
        <ColorRow label="Title Color"                            value={form.style_title_color}    onChange={v => set('style_title_color', v)}    onReset={() => clr('style_title_color')}    fallback="#1a1208" />
        <ColorRow label="Italic (em) Color"                     value={form.style_title_em_color} onChange={v => set('style_title_em_color', v)} onReset={() => clr('style_title_em_color')} fallback="#8b2e33" />
      </StyleGroup>

      <StyleGroup title="Subtitle">
        <SizeRow  label="Font Size"  value={form.style_subtitle_size}  onChange={v => set('style_subtitle_size', v)}  placeholder="19" />
        <ColorRow label="Color"      value={form.style_subtitle_color} onChange={v => set('style_subtitle_color', v)} onReset={() => clr('style_subtitle_color')} fallback="#1a2543" />
      </StyleGroup>

      <StyleGroup title="CTA Button 1 (Primary)">
        <ColorRow label="Background"       value={form.style_btn1_bg}          onChange={v => set('style_btn1_bg', v)}          onReset={() => clr('style_btn1_bg')}          fallback="#de7336" />
        <ColorRow label="Font Color"       value={form.style_btn1_color}       onChange={v => set('style_btn1_color', v)}       onReset={() => clr('style_btn1_color')}       fallback="#ffffff" />
        <ColorRow label="Hover Background" value={form.style_btn1_hover_bg}    onChange={v => set('style_btn1_hover_bg', v)}    onReset={() => clr('style_btn1_hover_bg')}    fallback="#c45e22" />
        <ColorRow label="Hover Font Color" value={form.style_btn1_hover_color} onChange={v => set('style_btn1_hover_color', v)} onReset={() => clr('style_btn1_hover_color')} fallback="#ffffff" />
      </StyleGroup>

      <StyleGroup title="CTA Button 2 (Secondary)">
        <ColorRow label="Background"        value={form.style_btn2_bg}           onChange={v => set('style_btn2_bg', v)}           onReset={() => clr('style_btn2_bg')}           fallback="transparent" />
        <ColorRow label="Border Color"      value={form.style_btn2_border}       onChange={v => set('style_btn2_border', v)}       onReset={() => clr('style_btn2_border')}       fallback="#de7336" />
        <ColorRow label="Font Color"        value={form.style_btn2_color}        onChange={v => set('style_btn2_color', v)}        onReset={() => clr('style_btn2_color')}        fallback="#1a2543" />
        <ColorRow label="Hover Background"  value={form.style_btn2_hover_bg}     onChange={v => set('style_btn2_hover_bg', v)}     onReset={() => clr('style_btn2_hover_bg')}     fallback="transparent" />
        <ColorRow label="Hover Border"      value={form.style_btn2_hover_border} onChange={v => set('style_btn2_hover_border', v)} onReset={() => clr('style_btn2_hover_border')} fallback="#c45e22" />
        <ColorRow label="Hover Font Color"  value={form.style_btn2_hover_color}  onChange={v => set('style_btn2_hover_color', v)}  onReset={() => clr('style_btn2_hover_color')}  fallback="#c45e22" />
      </StyleGroup>

      <SectionStylePanel sectionKey="home:hero" />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Marquee ──────────────────────────────────────────────────────────────

// ── Tiny colour + size helpers used only inside MarqueeTab ───────────────────

function MqColorField({ label, value, onChange }) {
  const safe = (value && /^#|^rgb|^hsl/.test(value)) ? value : '#000000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', borderBottom: '1px solid #ede8e0' }}>
      <span style={{ flex: 1, fontSize: '0.8rem', color: '#5a4e3a' }}>{label}</span>
      <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <span style={{
          display: 'inline-block', width: '28px', height: '28px', borderRadius: '4px',
          background: value || '#cccccc', border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }} />
        <input type="color" value={safe} onChange={e => onChange(e.target.value)}
          style={{ opacity: 0, position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} />
      </label>
      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#5a4e3a', minWidth: '72px' }}>
        {value || <em style={{ opacity: 0.4 }}>default</em>}
      </span>
      {value && (
        <button onClick={() => onChange('')} title="Reset"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#b09070' }}>
          ↺
        </button>
      )}
    </div>
  );
}

function MqSizeField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', borderBottom: '1px solid #ede8e0' }}>
      <span style={{ flex: 1, fontSize: '0.8rem', color: '#5a4e3a' }}>{label}</span>
      <input type="number" min="0" value={value} placeholder={placeholder || 'default'}
        onChange={e => onChange(e.target.value)}
        className="adm-input adm-input-sm"
        style={{ width: '70px', textAlign: 'right' }}
      />
      <span style={{ fontSize: '0.72rem', color: '#9a8a75' }}>px</span>
      {value && (
        <button onClick={() => onChange('')} title="Reset"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#b09070' }}>
          ↺
        </button>
      )}
    </div>
  );
}

function MarqueeTab() {
  const [items,   setItems]   = useState([]);
  const [newText, setNewText] = useState('');
  const [style,   setStyle]   = useState({ bg_color: '', height_px: '', font_color: '', font_size_px: '' });
  const [styleSaving, setStyleSaving] = useState(false);
  const [styleSaved,  setStyleSaved]  = useState(false);

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/marquee`)
      .then(r => r.json()).then(setItems).catch(() => {}), []);

  useEffect(() => {
    load();
    api.getMarqueeStyle()
      .then(d => setStyle(s => ({ ...s, ...d })))
      .catch(() => {});
  }, [load]);

  const setS = (k, v) => setStyle(s => ({ ...s, [k]: v }));

  const saveStyle = async () => {
    setStyleSaving(true);
    try {
      await api.updateMarqueeStyle(style);
      setStyleSaved(true);
      setTimeout(() => setStyleSaved(false), 2500);
    } catch (_) {}
    setStyleSaving(false);
  };

  const add = async () => {
    const text = newText.trim();
    if (!text) return;
    await api.addMarqueeItem({ item_text: text, sort_order: items.length + 1 });
    setNewText('');
    load();
  };

  const del = async (id) => {
    if (!confirm('Remove this item?')) return;
    await api.deleteMarqueeItem(id);
    load();
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Marquee Strip</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="marquee" />
      <p className="adm-hint">The scrolling text banner below the hero. Items display in order.</p>

      {/* ── Style ── */}
      <h3 className="adm-sub-title" style={{ marginTop: '1.25rem' }}>Appearance</h3>
      <div style={{ background: '#faf7f2', border: '1px solid #e8e0d4', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <MqColorField label="Background Color" value={style.bg_color}   onChange={v => setS('bg_color', v)} />
        <MqColorField label="Font Color"       value={style.font_color} onChange={v => setS('font_color', v)} />
        <MqSizeField  label="Font Size"        value={style.font_size_px} onChange={v => setS('font_size_px', v)} placeholder="10" />
        <MqSizeField  label="Height"           value={style.height_px}    onChange={v => setS('height_px', v)}    placeholder="auto" />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={saveStyle} disabled={styleSaving}>
          {styleSaving ? 'Saving…' : 'Save Appearance'}
        </button>
        {styleSaved && <span className="adm-saved-msg">✓ Saved</span>}
      </div>

      <hr className="adm-divider" />

      {/* ── Items ── */}
      <SectionStylePanel sectionKey="home:marquee" />
      <h3 className="adm-sub-title">Marquee Items</h3>
      <div className="adm-list">
        {items.map((item, i) => (
          <div key={item.id} className="adm-list-row">
            <span className="adm-list-num">{i + 1}</span>
            <span className="adm-list-text">{item.item_text}</span>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="adm-venue-add" style={{ marginTop: '1rem' }}>
        <input
          className="adm-input adm-input-sm"
          placeholder="Add new item…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

// ── Tab: About ────────────────────────────────────────────────────────────────

function AboutTab() {
  const [form,           setForm]          = useState({ heading1:'', heading_em:'', heading2:'', bio:'', quote:'', journey_btn_text:'' });
  const [tags,           setTags]          = useState([]);
  const [newTag,         setNewTag]        = useState('');
  const [mediaUrl,       setMediaUrl]      = useState('');
  const [localPreview,   setLocalPreview]  = useState(null);
  const [uploading,      setUploading]     = useState(false);
  const [uploadError,    setUploadError]   = useState('');
  const [pdfUrl,         setPdfUrl]        = useState('');
  const [pdfUploading,   setPdfUploading]  = useState(false);
  const [pdfUploadMsg,   setPdfUploadMsg]  = useState('');
  const { save, saving, saved, error }  = useSave(api.updateAbout);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const load = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/about`)
      .then(r => r.json())
      .then(d => {
        setForm({ heading1: d.heading1||'', heading_em: d.heading_em||'', heading2: d.heading2||'', bio: d.bio||'', quote: d.quote||'', journey_btn_text: d.journey_btn_text||'' });
        setTags(d.tags || []);
        setMediaUrl(d.media_url || '');
        setPdfUrl(d.journey_pdf_url || '');
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local blob preview immediately so the user can see what was selected
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setUploadError('');
    setUploading(true);

    try {
      const { media_url } = await api.uploadAboutMedia(file);
      setMediaUrl(media_url);    // server path confirmed
      setLocalPreview(null);     // server URL now takes over
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Upload failed — keep local preview visible but show the error
      setUploadError(
        'Upload failed. Make sure you have run the database migration: ' +
        'ALTER TABLE home_about ADD COLUMN IF NOT EXISTS media_url VARCHAR(500) NOT NULL DEFAULT \'\';'
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    setPdfUploadMsg('');
    try {
      const { pdf_url } = await api.uploadJourneyPdf(file);
      setPdfUrl(pdf_url);
      setPdfUploadMsg('success');
    } catch {
      setPdfUploadMsg('error');
    } finally {
      setPdfUploading(false);
    }
  };

  const addTag = async () => {
    const text = newTag.trim();
    if (!text) return;
    await api.addAboutTag({ tag_text: text, sort_order: tags.length + 1 });
    setNewTag('');
    load();
  };

  const delTag = async (id) => {
    if (!confirm('Remove tag?')) return;
    await api.deleteAboutTag(id);
    load();
  };

  // Priority: local blob preview (during/after failed upload) → server URL → nothing
  const displaySrc = localPreview
    || (mediaUrl ? (mediaUrl.startsWith('http') ? mediaUrl : `${SERVER}${mediaUrl}`) : null);

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">About Section</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="about" />

      {/* ── Media Image ── */}
      <div className="adm-photo-row">
        {displaySrc && (
          <img src={displaySrc} alt="About media" className="adm-photo-preview"
            style={{ width: '110px', height: '130px', objectFit: 'cover' }} />
        )}
        <div>
          <label className="adm-label">About Media Image</label>
          <input type="file" accept="image/*" className="adm-file" onChange={handleMediaUpload} />
          {uploading && <p className="adm-hint">Uploading…</p>}
          {uploadError && (
            <p className="adm-hint" style={{ color: '#c0392b', marginTop: '0.4rem' }}>
              ⚠ {uploadError}
            </p>
          )}
          {!uploading && !uploadError && mediaUrl && (
            <p className="adm-hint">✓ Saved: {mediaUrl}</p>
          )}
          {!uploading && !uploadError && !mediaUrl && (
            <p className="adm-hint">No image uploaded — the bundled default photo is used.</p>
          )}
        </div>
      </div>

      {/* ── Journey PDF ── */}
      <div className="adm-photo-row" style={{ marginTop: '1.25rem' }}>
        <div>
          <label className="adm-label">Journey PDF ("Explore Vinay's Journey" modal)</label>
          <input type="file" accept="application/pdf" className="adm-file" onChange={handlePdfUpload} />
          {pdfUploading && <p className="adm-hint">Uploading…</p>}
          {!pdfUploading && pdfUploadMsg === 'success' && <p className="adm-hint">✓ PDF uploaded: {pdfUrl}</p>}
          {!pdfUploading && pdfUploadMsg === 'error'   && <p className="adm-hint" style={{ color:'#c0392b' }}>⚠ Upload failed.</p>}
          {!pdfUploading && !pdfUploadMsg && pdfUrl    && <p className="adm-hint">Current: {pdfUrl}</p>}
          {!pdfUploading && !pdfUploadMsg && !pdfUrl   && <p className="adm-hint">No PDF uploaded — the bundled default is used.</p>}
        </div>
      </div>

      <Field
        label="Journey Button Text"
        name="journey_btn_text"
        value={form.journey_btn_text}
        onChange={h}
        hint={`Label shown on the button below the photo. Default: "Explore Vinay's Journey"`}
      />

      <hr className="adm-divider" />

      <Row>
        <Field label="Heading (plain)"  name="heading1"   value={form.heading1}   onChange={h} />
        <Field label="Heading (italic)" name="heading_em" value={form.heading_em} onChange={h} />
        <Field label="Heading Line 2"   name="heading2"   value={form.heading2}   onChange={h} />
      </Row>
      <Field label="Biography" name="bio"   value={form.bio}   onChange={h} rows={6} />
      <Field label="Quote"     name="quote" value={form.quote} onChange={h} rows={3} />
      <SectionStylePanel sectionKey="home:about" />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Tags</h3>
      <div className="adm-tags-wrap">
        {tags.map(t => (
          <span key={t.id} className="adm-tag-chip">
            {t.tag_text}
            <button onClick={() => delTag(t.id)}>×</button>
          </span>
        ))}
      </div>
      <div className="adm-venue-add" style={{ marginTop: '0.75rem' }}>
        <input className="adm-input adm-input-sm" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
        <button className="adm-btn adm-btn-sm" onClick={addTag}>Add</button>
      </div>
    </div>
  );
}

// ── Tab: Articles ─────────────────────────────────────────────────────────────

const EMPTY_ARTICLE = { featured: 0, category: '', title: '', excerpt: '', pub_date: '', url: '', sort_order: 0 };

function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [editId,   setEditId]   = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [newA,     setNewA]     = useState(EMPTY_ARTICLE);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/articles`)
      .then(r => r.json()).then(setArticles).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async (a) => { await api.updateArticle(a.id, a); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete article?')) return; await api.deleteArticle(id); load(); };
  const saveNew  = async () => { await api.addArticle(newA); setNewA(EMPTY_ARTICLE); setAdding(false); load(); };
  // Return the server response so ArticleEditBlock can sync form.image_url immediately.
  const uploadImg = async (id, file) => { const result = await api.uploadArticleImage(id, file); load(); return result; };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Articles</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Article'}</button>
      </div>
      <SectionVisibilityToggle pageSlug="home" sectionKey="articles" />
      <SectionStylePanel sectionKey="home:articles" />

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Article</h3>
          <ArticleForm form={newA} setForm={setNewA} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {articles.map(a => (
        <div key={a.id} className="adm-card-block">
          <div className="adm-card-header">
            {a.featured ? <span className="adm-badge-pill">Featured</span> : null}
            <span className="adm-card-title">{a.title}</span>
            <span className="adm-hint">{a.pub_date}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === a.id ? null : a.id)}>{editId === a.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(a.id)}>Delete</button>
          </div>
          {editId === a.id && (
            <div className="adm-card-edit-form">
              <ArticleEditBlock article={a} onSave={saveEdit} onCancel={() => setEditId(null)} onImageUpload={uploadImg} serverBase={SERVER} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ArticleForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Category"    name="category"   value={form.category}   onChange={h} />
        <Field label="Date"        name="pub_date"   value={form.pub_date}   onChange={h} />
        <Field label="Sort Order"  name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Title"   name="title"   value={form.title}   onChange={h} />
      <Field label="Excerpt" name="excerpt" value={form.excerpt} onChange={h} rows={3} />
      <Field label="URL"     name="url"     value={form.url}     onChange={h} type="url" />
      <div className="adm-field">
        <label className="adm-label">Featured</label>
        <select className="adm-input" name="featured" value={form.featured} onChange={e => setForm(f => ({ ...f, featured: Number(e.target.value) }))}>
          <option value={0}>No</option>
          <option value={1}>Yes</option>
        </select>
      </div>
    </>
  );
}

function ArticleEditBlock({ article, onSave, onCancel, onImageUpload, serverBase }) {
  const [form, setForm] = useState({ ...article });

  // Keep form.image_url in sync when the parent refreshes the article prop after upload.
  useEffect(() => {
    setForm(f => ({ ...f, image_url: article.image_url }));
  }, [article.image_url]);

  const imgSrc = form.image_url
    ? (form.image_url.startsWith('http') ? form.image_url : `${serverBase}${form.image_url}`)
    : null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImageUpload(article.id, file);
    // Sync form immediately so Save sends the correct image_url.
    if (result?.image_url) setForm(f => ({ ...f, image_url: result.image_url }));
  };

  return (
    <>
      <ArticleForm form={form} setForm={setForm} />
      <div className="adm-field">
        <label className="adm-label">Featured Image</label>
        {imgSrc && <img src={imgSrc} alt="" className="adm-article-img-preview" />}
        <input type="file" accept="image/*" className="adm-file" onChange={handleImageChange} />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Themes ───────────────────────────────────────────────────────────────

const EMPTY_THEME = { theme_key: '', devanagari: '', name: '', description: '', count: 0, sort_order: 0 };

function ThemesTab() {
  const [themes,       setThemes]       = useState([]);
  const [editId,       setEditId]       = useState(null);
  const [adding,       setAdding]       = useState(false);
  const [newT,         setNewT]         = useState(EMPTY_THEME);
  const [newIconFile,  setNewIconFile]  = useState(null);
  const [newIconPreview, setNewIconPreview] = useState(null);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/themes`)
      .then(r => r.json()).then(setThemes).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit   = async (t) => { await api.updateTheme(t.id, t); setEditId(null); load(); };
  const del        = async (id) => { if (!confirm('Delete theme?')) return; await api.deleteTheme(id); load(); };
  const saveNew    = async () => {
    const created = await api.addTheme(newT);
    if (newIconFile && created?.id) await api.uploadThemeIcon(created.id, newIconFile);
    setNewT(EMPTY_THEME);
    setNewIconFile(null);
    setNewIconPreview(null);
    setAdding(false);
    load();
  };
  // Return result so ThemeEditBlock can sync form.icon_url immediately (avoids Save overwriting it).
  const uploadIcon = async (id, file) => { const result = await api.uploadThemeIcon(id, file); load(); return result; };

  const handleNewIcon = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewIconFile(file);
    setNewIconPreview(URL.createObjectURL(file));
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Themes</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewIconFile(null); setNewIconPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Theme'}
        </button>
      </div>
      <SectionVisibilityToggle pageSlug="home" sectionKey="themes" />
      <SectionStylePanel sectionKey="home:themes" />
      <p className="adm-hint">
        Built-in SVG icons display automatically for the keys: <strong>dharma, iks, education, psychology</strong>.
        Upload a custom icon (SVG, PNG, WEBP) to override any theme's icon.
      </p>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Theme</h3>
          <ThemeForm form={newT} setForm={setNewT} />
          <div className="adm-field">
            <label className="adm-label">Theme Icon (SVG, PNG, WEBP — optional)</label>
            <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
              {newIconPreview && (
                <img src={newIconPreview} alt="Icon preview"
                  style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#f3b33e', borderRadius: '50%', padding: '8px', flexShrink: 0 }} />
              )}
              <div>
                <input type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" className="adm-file" onChange={handleNewIcon} />
                <p className="adm-hint">Leave empty to use the built-in SVG for the theme key above.</p>
              </div>
            </div>
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {themes.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{t.theme_key}</span>
            <span className="adm-card-title">{t.devanagari} {t.name}</span>
            <span className="adm-hint">{t.count} articles</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === t.id ? null : t.id)}>{editId === t.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <ThemeEditBlock
                theme={t}
                onSave={saveEdit}
                onCancel={() => setEditId(null)}
                onIconUpload={uploadIcon}
                serverBase={SERVER}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThemeForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Theme Key (e.g. dharma)" name="theme_key"  value={form.theme_key}  onChange={h} />
        <Field label="Devanagari"               name="devanagari" value={form.devanagari} onChange={h} />
        <Field label="Article Count"            name="count"      value={form.count}      onChange={h} type="number" />
      </Row>
      <Field label="Name"        name="name"        value={form.name}        onChange={h} />
      <Field label="Description" name="description" value={form.description} onChange={h} rows={3} />
      <Field label="Card Link URL" name="link_url" value={form.link_url || ''} onChange={h}
        hint='Internal path (e.g. /articles?category=Dharma) or external URL. Leave empty to use the built-in category mapping.' />
      <Field label="Sort Order"  name="sort_order"  value={form.sort_order}  onChange={h} type="number" />
    </>
  );
}

function ThemeEditBlock({ theme, onSave, onCancel, onIconUpload, serverBase }) {
  const [form, setForm] = useState({ ...theme });

  // Keep form.icon_url in sync if the parent refreshes after upload.
  useEffect(() => {
    setForm(f => ({ ...f, icon_url: theme.icon_url }));
  }, [theme.icon_url]);

  const iconSrc = form.icon_url
    ? (form.icon_url.startsWith('http') ? form.icon_url : `${serverBase}${form.icon_url}`)
    : null;

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onIconUpload(theme.id, file);
    if (result?.icon_url) setForm(f => ({ ...f, icon_url: result.icon_url }));
  };

  return (
    <>
      <ThemeForm form={form} setForm={setForm} />

      <div className="adm-field">
        <label className="adm-label">Theme Icon (SVG, PNG, WEBP)</label>
        <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
          {iconSrc && (
            <img src={iconSrc} alt="Icon preview"
              style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#f3b33e', borderRadius: '50%', padding: '8px', flexShrink: 0 }} />
          )}
          <div>
            <input type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" className="adm-file" onChange={handleIconChange} />
            {iconSrc
              ? <p className="adm-hint">✓ Custom icon saved — will override the built-in SVG.</p>
              : <p className="adm-hint">No custom icon — the built-in SVG for key <strong>{theme.theme_key}</strong> is used.</p>
            }
          </div>
        </div>
      </div>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Quote ────────────────────────────────────────────────────────────────

function QuoteTab() {
  const [form, setForm] = useState({ quote_text:'', quote_attr:'', quote_mark_url:'', ornament_url:'', bg_image_url:'' });
  const { save, saving, saved, error } = useSave(api.updateQuote);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/quote`)
      .then(r => r.json()).then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const resolveUrl = url => url ? (url.startsWith('http') ? url : `${SERVER}${url}`) : '';

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Quote Section</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="quote" />
      <Field label="Quote Text"  name="quote_text" value={form.quote_text} onChange={h} rows={4} />
      <Field label="Attribution" name="quote_attr"  value={form.quote_attr} onChange={h} />

      <HeroImageUpload
        label="Background Image"
        hint="Full-width background image for the quote section. If none is uploaded, the default image is used."
        currentUrl={resolveUrl(form.bg_image_url)}
        uploadFn={api.uploadQuoteBg}
        onUploaded={url => setForm(f => ({ ...f, bg_image_url: url }))}
        onRemove={() => setForm(f => ({ ...f, bg_image_url: '' }))}
      />

      <HeroImageUpload
        label="Quote Mark Image"
        hint="Small decorative image shown above the quote text (e.g. an ornamental quotation mark). SVG or PNG recommended."
        currentUrl={resolveUrl(form.quote_mark_url)}
        uploadFn={api.uploadQuoteMark}
        onUploaded={url => setForm(f => ({ ...f, quote_mark_url: url }))}
        onRemove={() => setForm(f => ({ ...f, quote_mark_url: '' }))}
      />

      <HeroImageUpload
        label="Ornament Image"
        hint="Decorative divider shown below the quote text. SVG or PNG recommended."
        currentUrl={resolveUrl(form.ornament_url)}
        uploadFn={api.uploadQuoteOrnament}
        onUploaded={url => setForm(f => ({ ...f, ornament_url: url }))}
        onRemove={() => setForm(f => ({ ...f, ornament_url: '' }))}
      />

      <SectionStylePanel sectionKey="home:quote" />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Talks ────────────────────────────────────────────────────────────────

const EMPTY_TALK = { label: '', title: '', youtube_id: '', sort_order: 0 };

function TalksTab() {
  const [talks,          setTalks]         = useState([]);
  const [editId,         setEditId]        = useState(null);
  const [adding,         setAdding]        = useState(false);
  const [newT,           setNewT]          = useState(EMPTY_TALK);
  const [newThumbFile,   setNewThumbFile]  = useState(null);
  const [newThumbPreview, setNewThumbPreview] = useState(null);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/talks`)
      .then(r => r.json()).then(setTalks).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit    = async (t) => { await api.updateTalk(t.id, t); setEditId(null); load(); };
  const del         = async (id) => { if (!confirm('Delete talk?')) return; await api.deleteTalk(id); load(); };
  const saveNew     = async () => {
    const created = await api.addTalk(newT);
    if (newThumbFile && created?.id) await api.uploadTalkThumb(created.id, newThumbFile);
    setNewT(EMPTY_TALK);
    setNewThumbFile(null);
    setNewThumbPreview(null);
    setAdding(false);
    load();
  };
  const uploadThumb = async (id, file) => { const result = await api.uploadTalkThumb(id, file); await load(); return result; };

  const handleNewThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewThumbFile(file);
    setNewThumbPreview(URL.createObjectURL(file));
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Talks &amp; Videos</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewThumbFile(null); setNewThumbPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Talk'}
        </button>
      </div>
      <SectionVisibilityToggle pageSlug="home" sectionKey="talks" />
      <SectionStylePanel sectionKey="home:talks" />
      <p className="adm-hint">Thumbnails fall back to the YouTube auto-thumbnail when no image is uploaded.</p>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Talk</h3>
          <TalkForm form={newT} setForm={setNewT} />
          <div className="adm-field">
            <label className="adm-label">Thumbnail (optional)</label>
            <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
              {newThumbPreview && (
                <img src={newThumbPreview} alt="Thumbnail preview"
                  style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div>
                <input type="file" accept="image/*" className="adm-file" onChange={handleNewThumb} />
                <p className="adm-hint">Leave empty to use the YouTube auto-thumbnail.</p>
              </div>
            </div>
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {talks.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{t.label}</span>
            <span className="adm-card-title">{t.title}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === t.id ? null : t.id)}>{editId === t.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <TalkEditBlock talk={t} onSave={saveEdit} onCancel={() => setEditId(null)} onThumbUpload={uploadThumb} serverBase={SERVER} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TalkForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Label (e.g. Keynote)" name="label"      value={form.label}      onChange={h} />
        <Field label="YouTube Video ID"      name="youtube_id" value={form.youtube_id} onChange={h} hint="e.g. G3rH4FztvYQ" />
        <Field label="Sort Order"            name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Title" name="title" value={form.title} onChange={h} rows={2} />
    </>
  );
}

function TalkEditBlock({ talk, onSave, onCancel, onThumbUpload, serverBase }) {
  const [form, setForm] = useState({ ...talk });

  // Sync form.thumb_url when parent refreshes after upload, so Save doesn't overwrite it.
  useEffect(() => {
    setForm(f => ({ ...f, thumb_url: talk.thumb_url }));
  }, [talk.thumb_url]);

  const thumbSrc = form.thumb_url
    ? (form.thumb_url.startsWith('http') ? form.thumb_url : `${serverBase}${form.thumb_url}`)
    : `https://img.youtube.com/vi/${form.youtube_id}/hqdefault.jpg`;

  const handleThumbChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onThumbUpload(talk.id, file);
    if (result?.thumb_url) setForm(f => ({ ...f, thumb_url: result.thumb_url }));
  };

  return (
    <>
      <TalkForm form={form} setForm={setForm} />
      <div className="adm-field">
        <label className="adm-label">Thumbnail</label>
        <img src={thumbSrc} alt="" className="adm-talk-thumb-preview" />
        <input type="file" accept="image/*" className="adm-file" onChange={handleThumbChange} />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Connect ──────────────────────────────────────────────────────────────

function ConnectTab() {
  const [desc,    setDesc]    = useState('');
  const [links,   setLinks]   = useState([]);
  const [newLink, setNewLink] = useState({ href:'', icon:'', label:'' });
  const [editId,  setEditId]  = useState(null);
  const { save, saving, saved, error } = useSave((data) => api.updateConnect({ description: data }));

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/home/connect`)
      .then(r => r.json()).then(d => { setDesc(d.description || ''); setLinks(d.links || []); }).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const addLink = async () => {
    if (!newLink.href) return;
    await api.addConnectLink({ ...newLink, sort_order: links.length + 1 });
    setNewLink({ href:'', icon:'', label:'' });
    load();
  };
  const delLink = async (id) => { if (!confirm('Remove link?')) return; await api.deleteConnectLink(id); load(); };
  const saveLink = async (link) => { await api.updateConnectLink(link.id, link); setEditId(null); load(); };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Connect Section</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="connect" />
      <Field label="Description" name="description" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
      <SectionStylePanel sectionKey="home:connect" />
      <SaveBar onSave={() => save(desc)} saving={saving} saved={saved} error={error} />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Social / External Links</h3>
      <p className="adm-hint">The "Book a Session" button is always shown and is not editable here.</p>

      {links.map(link => (
        <div key={link.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{link.icon}</span>
            <span className="adm-card-title">{link.label}</span>
            <span className="adm-hint" style={{ flex:1 }}>{link.href}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === link.id ? null : link.id)}>{editId === link.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => delLink(link.id)}>Remove</button>
          </div>
          {editId === link.id && <ConnectLinkEditBlock link={link} onSave={saveLink} onCancel={() => setEditId(null)} />}
        </div>
      ))}

      <div className="adm-card-block" style={{ marginTop: '0.75rem' }}>
        <h3 className="adm-sub-title">Add New Link</h3>
        <Row>
          <Field label="Icon (e.g. in, 𝕏, ✉)" name="icon"  value={newLink.icon}  onChange={e => setNewLink(l => ({ ...l, icon:  e.target.value }))} />
          <Field label="Label"                  name="label" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} />
        </Row>
        <Field label="URL" name="href" value={newLink.href} onChange={e => setNewLink(l => ({ ...l, href: e.target.value }))} type="url" />
        <div className="adm-save-bar">
          <button className="adm-btn adm-btn-primary" onClick={addLink}>Add Link</button>
        </div>
      </div>
    </div>
  );
}

function ConnectLinkEditBlock({ link, onSave, onCancel }) {
  const [form, setForm] = useState({ ...link });
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-card-edit-form">
      <Row>
        <Field label="Icon" name="icon"  value={form.icon}  onChange={h} />
        <Field label="Label" name="label" value={form.label} onChange={h} />
      </Row>
      <Field label="URL" name="href" value={form.href} onChange={h} type="url" />
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Tab: What We Do ───────────────────────────────────────────────────────────

const EMPTY_WWD_CARD = { title: '', description: '', link_text: 'Learn More', link_url: '#', sort_order: 0 };

function WhatWeDoCardForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Card Title"   name="title"      value={form.title}      onChange={h} />
        <Field label="Sort Order"   name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Description" name="description" value={form.description} onChange={h} rows={3} />
      <Row>
        <Field label="Link Text" name="link_text" value={form.link_text} onChange={h} />
        <Field label="Link URL"  name="link_url"  value={form.link_url}  onChange={h} />
      </Row>
    </>
  );
}

function WhatWeDoCardEditBlock({ card, onSave, onCancel, onIconUpload, serverBase }) {
  const [form, setForm] = useState({ ...card });

  useEffect(() => {
    setForm(f => ({ ...f, icon_url: card.icon_url }));
  }, [card.icon_url]);

  const iconSrc = form.icon_url
    ? (form.icon_url.startsWith('http') ? form.icon_url : `${serverBase}${form.icon_url}`)
    : null;

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const result = await onIconUpload(card.id, file);
    if (result?.icon_url) setForm(f => ({ ...f, icon_url: result.icon_url }));
  };

  return (
    <>
      <WhatWeDoCardForm form={form} setForm={setForm} />
      <div className="adm-field">
        <label className="adm-label">Card Icon (optional — SVG, PNG, WEBP)</label>
        {iconSrc && (
          <img src={iconSrc} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.5rem', display: 'block' }} />
        )}
        <input type="file" accept="image/svg+xml,image/png,image/webp" className="adm-file" onChange={handleIconChange} />
        <p className="adm-hint">Leave empty to use the default icon.</p>
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

function WhatWeDoTab() {
  const [section,  setSection]  = useState({ eyebrow: '', heading: '', heading_em: '', lede: '' });
  const [cards,    setCards]    = useState([]);
  const [editId,   setEditId]   = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [newCard,  setNewCard]  = useState(EMPTY_WWD_CARD);
  const { save, saving, saved, error } = useSave(api.updateWhatWeDo);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  const load = useCallback(() =>
    api.getWhatWeDo()
      .then(d => {
        setSection(s => ({ ...s, ...(d.section || {}) }));
        setCards(d.cards || []);
      })
      .catch(() => {}), []);

  useEffect(() => { load(); }, [load]);

  const h = e => setSection(s => ({ ...s, [e.target.name]: e.target.value }));

  const saveCard    = async (c) => { await api.updateWhatWeDoCard(c.id, c); setEditId(null); load(); };
  const deleteCard  = async (id) => { if (!confirm('Delete card?')) return; await api.deleteWhatWeDoCard(id); load(); };
  const saveNewCard = async () => {
    await api.addWhatWeDoCard(newCard);
    setNewCard(EMPTY_WWD_CARD);
    setAdding(false);
    load();
  };
  const uploadIcon = async (id, file) => { const r = await api.uploadWhatWeDoIcon(id, file); load(); return r; };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">What We Do</h2>
      <SectionVisibilityToggle pageSlug="home" sectionKey="whatwedo" />
      <p className="adm-hint">Section that appears after the About section on the home page.</p>

      <h3 className="adm-sub-title" style={{ marginTop: '1rem' }}>Section Header</h3>
      <Field label="Eyebrow Label"    name="eyebrow"    value={section.eyebrow}    onChange={h} hint='Short label above the heading, e.g. "What We Do".' />
      <Row>
        <Field label="Heading (plain)" name="heading"    value={section.heading}    onChange={h} />
        <Field label="Heading (italic)" name="heading_em" value={section.heading_em} onChange={h} />
      </Row>
      <Field label="Lead Paragraph" name="lede" value={section.lede} onChange={h} rows={3} />
      <SectionStylePanel sectionKey="home:whatwedo" />
      <SaveBar onSave={() => save(section)} saving={saving} saved={saved} error={error} />

      <hr className="adm-divider" />

      <div className="adm-section-header">
        <h3 className="adm-sub-title">Cards</h3>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Card'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h4 className="adm-sub-title">New Card</h4>
          <WhatWeDoCardForm form={newCard} setForm={setNewCard} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNewCard}>Add Card</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {cards.map(card => (
        <div key={card.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">#{card.sort_order || card.id}</span>
            <span className="adm-card-title">{card.title || '(untitled)'}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === card.id ? null : card.id)}>
              {editId === card.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => deleteCard(card.id)}>
              Remove
            </button>
          </div>
          {editId === card.id && (
            <WhatWeDoCardEditBlock
              card={card}
              onSave={saveCard}
              onCancel={() => setEditId(null)}
              onIconUpload={uploadIcon}
              serverBase={SERVER}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main HomeAdmin ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',       label: 'Hero',             Component: HeroTab      },
  { id: 'hero_style', label: 'Hero Style',       Component: HeroStyleTab },
  { id: 'marquee',    label: 'Marquee',          Component: MarqueeTab   },
  { id: 'about',      label: 'About',            Component: AboutTab     },
  { id: 'whatwedo',   label: 'What We Do',       Component: WhatWeDoTab  },
  { id: 'articles',   label: 'Articles',         Component: ArticlesTab  },
  { id: 'themes',     label: 'Themes',           Component: ThemesTab    },
  { id: 'quote',      label: 'Quote',            Component: QuoteTab     },
  { id: 'talks',      label: 'Talks',            Component: TalksTab     },
  { id: 'connect',    label: 'Connect',          Component: ConnectTab   },
  { id: 'extra',    label: 'Extra Sections',   Component: () => <SiteBlocksTab pageSlug="home" /> },
  { id: 'order',    label: 'Section Order',      Component: () => <SectionOrderTab pageSlug="home" /> },
  { id: 'seo',      label: 'SEO',                Component: () => <SeoTab pageSlug="home" /> },
];

function HomeAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TABS.find(t => t.id === active)?.Component;

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Home</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="home" />
          <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
        </div>
      </div>

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
        {ActiveTab && <ActiveTab />}
      </div>
    </div>
  );
}

export default HomeAdmin;
