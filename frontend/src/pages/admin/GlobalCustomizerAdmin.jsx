import { useState, useEffect, useRef } from 'react';
import * as api from '../../services/customizerApi';
import { applyCustomizerSettings } from '../../hooks/useGlobalCustomizer';
import './GlobalCustomizerAdmin.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Google Fonts list ─────────────────────────────────────────────────────────

const GOOGLE_FONTS = [
  'Cormorant Garamond',
  'Josefin Sans',
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Merriweather',
  'Playfair Display',
  'Source Sans 3',
  'Nunito',
  'Raleway',
  'Ubuntu',
  'Work Sans',
  'DM Sans',
  'Noto Sans',
  'EB Garamond',
  'Libre Baskerville',
  'Crimson Text',
  'Noto Serif',
  'PT Serif',
  'PT Sans',
  'Mulish',
  'Quicksand',
  'Karla',
  'Rubik',
  'Oswald',
  'Cabin',
  'Titillium Web',
];

// ── FontSelect — searchable dropdown ─────────────────────────────────────────

function FontSelect({ value, onChange }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  const filtered = query.trim()
    ? GOOGLE_FONTS.filter(f => f.toLowerCase().includes(query.toLowerCase()))
    : GOOGLE_FONTS;

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (font) => {
    onChange(font);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="gc-font-select" ref={ref}>
      <div className="gc-font-select-trigger" onClick={() => setOpen(o => !o)}>
        <span className="gc-font-select-value" style={{ fontFamily: `'${value}', sans-serif` }}>
          {value || 'Select a font…'}
        </span>
        <span className="gc-font-select-arrow">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="gc-font-select-dropdown">
          <input
            className="gc-font-select-search"
            placeholder="Search fonts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="gc-font-select-list">
            {filtered.length === 0 && (
              <li className="gc-font-select-empty">No fonts found</li>
            )}
            {filtered.map(font => (
              <li
                key={font}
                className={`gc-font-select-item${font === value ? ' selected' : ''}`}
                onClick={() => select(font)}
                style={{ fontFamily: `'${font}', sans-serif` }}
              >
                {font}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FONT_PRESETS = [
  { label: 'Classic',    heading: 'Cormorant Garamond', body: 'Josefin Sans' },
  { label: 'Elegant',    heading: 'Playfair Display',   body: 'Raleway' },
  { label: 'Editorial',  heading: 'Merriweather',       body: 'Lato' },
  { label: 'Academic',   heading: 'EB Garamond',        body: 'Montserrat' },
  { label: 'Traditional',heading: 'Libre Baskerville',  body: 'Source Sans Pro' },
  { label: 'Literary',   heading: 'Crimson Text',       body: 'Open Sans' },
];

const COLOR_PALETTES = [
  {
    label: 'Warm Earth',
    swatches: ['#d4670a','#b8922a','#1a1208','#8a7d6b','#faf6ee','#f5edd8','#8b1a1a','rgba(184,146,42,0.25)'],
    settings: { accent:'#d4670a', links:'#d4670a', headings:'#1a1208', bodyText:'#1a1208', borders:'rgba(184,146,42,0.25)', siteBackground:'#faf6ee', contentBackground:'#f5edd8' },
  },
  {
    label: 'Ocean Blue',
    swatches: ['#2563eb','#1d4ed8','#1e3a5f','#475569','#f0f4ff','#e8edf8','#0c4a6e','rgba(37,99,235,0.2)'],
    settings: { accent:'#2563eb', links:'#2563eb', headings:'#1e3a5f', bodyText:'#1e293b', borders:'rgba(37,99,235,0.2)', siteBackground:'#f0f4ff', contentBackground:'#e8edf8' },
  },
  {
    label: 'Forest',
    swatches: ['#16803a','#15803d','#14532d','#4b7c5e','#f0fdf4','#dcfce7','#052e16','rgba(22,128,58,0.2)'],
    settings: { accent:'#16803a', links:'#16803a', headings:'#14532d', bodyText:'#1c3826', borders:'rgba(22,128,58,0.2)', siteBackground:'#f0fdf4', contentBackground:'#dcfce7' },
  },
];

const BUTTON_PRESETS = [
  { textColor:'#fff',    bgColor:'#1a1208',     borderColor:'transparent',  borderRadiusTop:'2',   borderRadiusRight:'2',   borderRadiusBottom:'2',   borderRadiusLeft:'2'  },
  { textColor:'#fff',    bgColor:'#3d3529',     borderColor:'transparent',  borderRadiusTop:'6',   borderRadiusRight:'6',   borderRadiusBottom:'6',   borderRadiusLeft:'6'  },
  { textColor:'#fff',    bgColor:'#5a4e3a',     borderColor:'transparent',  borderRadiusTop:'999', borderRadiusRight:'999', borderRadiusBottom:'999', borderRadiusLeft:'999'},
  { textColor:'#1a1208', bgColor:'transparent', borderColor:'#1a1208',      borderRadiusTop:'2',   borderRadiusRight:'2',   borderRadiusBottom:'2',   borderRadiusLeft:'2'  },
  { textColor:'#3d3529', bgColor:'transparent', borderColor:'#3d3529',      borderRadiusTop:'6',   borderRadiusRight:'6',   borderRadiusBottom:'6',   borderRadiusLeft:'6'  },
  { textColor:'#5a4e3a', bgColor:'transparent', borderColor:'#5a4e3a',      borderRadiusTop:'999', borderRadiusRight:'999', borderRadiusBottom:'999', borderRadiusLeft:'999'},
];

const CONTAINER_LAYOUTS = [
  { value: 'standard', label: 'Standard', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="4" y="4" width="72" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="12" y="12" width="56" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="12" y="24" width="56" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="12" y="32" width="40" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
  { value: 'wide', label: 'Wide', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="1" y="4" width="78" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="12" width="72" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="4" y="24" width="72" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="4" y="32" width="50" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
  { value: 'narrow', label: 'Narrow', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="16" y="4" width="48" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="22" y="12" width="36" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="22" y="24" width="36" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="22" y="32" width="24" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
];

const H_LEVELS = ['h1','h2','h3','h4','h5','h6'];
const SIZES_DEFAULT = { h1:'3.5',h2:'2.5',h3:'2.0',h4:'1.5',h5:'1.25',h6:'1.0' };

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEF_TYPOGRAPHY  = { bodyFont:'Cormorant Garamond', headingFont:'Josefin Sans', h1Size:'3.5', h1Unit:'rem', h2Size:'2.5', h2Unit:'rem', h3Size:'2.0', h3Unit:'rem', h4Size:'1.5', h4Unit:'rem', h5Size:'1.25', h5Unit:'rem', h6Size:'1.0', h6Unit:'rem', paragraphMarginBottom:'1', paragraphMarginUnit:'em' };
const DEF_COLORS      = { accent:'#d4670a', links:'#d4670a', headings:'#1a1208', bodyText:'#1a1208', borders:'rgba(184,146,42,0.25)', siteBackground:'#faf6ee', contentBackground:'#f5edd8', darkBgEyebrow:'#ffffff', darkBgTitle:'#ffffff', darkBgDesc:'rgba(255,255,255,0.85)', darkBgLink:'rgba(255,255,255,0.75)', darkBgBtn:'#ffffff', darkBgMuted:'rgba(255,255,255,0.6)', darkBgTitleEm:'rgba(255,255,255,0.75)', darkBgBtnBg:'#ffffff', darkBgBtnColor:'#1a1208', darkBgBtnHoverBg:'#f5e8d0', darkBgBtnHoverColor:'#1a1208' };
const DEF_CONTAINER   = { layout:'standard', style:'unboxed', containerWidth:1200, narrowWidth:750 };
const DEF_BUTTONS     = { textColor:'#ffffff', bgColor:'#d4670a', borderColor:'transparent', font:'Josefin Sans', paddingTop:'12', paddingRight:'28', paddingBottom:'12', paddingLeft:'28', paddingUnit:'px', borderWidthTop:'0', borderWidthRight:'0', borderWidthBottom:'0', borderWidthLeft:'0', borderRadiusTop:'3', borderRadiusRight:'3', borderRadiusBottom:'3', borderRadiusLeft:'3', borderRadiusUnit:'px' };
const DEF_PROTECTION  = { frontendProtection: false, adminProtection: false };

// ── Shared tiny components ────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return <div className="gc-divider"><span>{label}</span></div>;
}

function ColorSwatch({ value, onChange, label, onReset }) {
  const displayVal = (value && value !== 'transparent' && !value.startsWith('rgba')) ? value : '#ffffff';
  return (
    <div className="gc-color-row">
      <span className="gc-color-label">{label}</span>
      <div className="gc-color-controls">
        {onReset && <button className="gc-icon-btn" onClick={onReset} title="Reset to default">↺</button>}
        <label className="gc-swatch-wrap" title={value}>
          <span className="gc-swatch" style={{ background: value || '#ccc' }} />
          <input type="color" value={displayVal} onChange={e => onChange(e.target.value)} className="gc-color-hidden" />
        </label>
      </div>
    </div>
  );
}

function SaveBar({ onSave, saving, saved }) {
  return (
    <div className="gc-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span className="gc-saved-msg">✓ Applied to site</span>}
    </div>
  );
}

// ── TYPOGRAPHY TAB ─────────────────────────────────────────────────────────────

function TypographyTab() {
  const [form,   setForm]   = useState(DEF_TYPOGRAPHY);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('typography').then(d => setForm({ ...DEF_TYPOGRAPHY, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (p) => setForm(f => ({ ...f, bodyFont: p.body, headingFont: p.heading }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('typography', form);
      applyCustomizerSettings({ typography: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Font Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Presets</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_TYPOGRAPHY)} title="Reset all">↺</button>
        </div>
        <div className="gc-font-presets">
          {FONT_PRESETS.map(p => (
            <button
              key={p.label}
              className={`gc-font-preset${form.headingFont === p.heading && form.bodyFont === p.body ? ' active' : ''}`}
              onClick={() => applyPreset(p)}
            >
              <span className="gc-preset-heading" style={{ fontFamily: `'${p.heading}', serif` }}>Heading</span>
              <span className="gc-preset-body" style={{ fontFamily: `'${p.body}', sans-serif` }}>{p.body}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Base Font */}
      <SectionDivider label="Base Font" />
      <div className="gc-section">
        {[['Body Font','bodyFont'],['Headings Font','headingFont']].map(([lbl, key]) => (
          <div key={key} className="gc-font-row">
            <span className="gc-font-row-label">{lbl}</span>
            <FontSelect value={form[key] || ''} onChange={v => set(key, v)} />
            <span className="gc-font-preview" style={{ fontFamily: `'${form[key]}', sans-serif` }}>Aa</span>
          </div>
        ))}
      </div>

      {/* Heading Sizes */}
      <SectionDivider label="Heading Font Sizes" />
      <div className="gc-section">
        {H_LEVELS.map(h => (
          <div key={h} className="gc-font-row">
            <span className="gc-font-row-label" style={{ textTransform:'uppercase', fontSize:'0.7rem', fontWeight:700 }}>{h} Size</span>
            <div className="gc-size-row">
              <input
                type="number"
                className="gc-size-inp"
                value={form[`${h}Size`] ?? SIZES_DEFAULT[h]}
                min="0.5" step="0.1"
                onChange={e => set(`${h}Size`, e.target.value)}
              />
              <select className="gc-unit-sel" value={form[`${h}Unit`] || 'rem'} onChange={e => set(`${h}Unit`, e.target.value)}>
                <option value="rem">rem</option>
                <option value="em">em</option>
                <option value="px">px</option>
                <option value="vw">vw</option>
              </select>
            </div>
            <span className="gc-font-preview" style={{ fontFamily: `'${form.headingFont}', sans-serif`, fontSize: `${Math.min(+form[`${h}Size`] || 1, 2.5) * 8}px` }}>Aa</span>
          </div>
        ))}
      </div>

      {/* Paragraph Margin */}
      <SectionDivider label="Paragraph Spacing" />
      <div className="gc-section">
        <div className="gc-slider-group">
          <div className="gc-slider-head">
            <span className="gc-slider-label">Paragraph Margin Bottom</span>
            <div className="gc-unit-tabs">
              {['em','rem','px'].map(u => (
                <button key={u} className={`gc-unit-tab${form.paragraphMarginUnit === u ? ' active' : ''}`}
                  onClick={() => set('paragraphMarginUnit', u)}>{u.toUpperCase()}</button>
              ))}
              <button className="gc-icon-btn" onClick={() => { set('paragraphMarginBottom','1'); set('paragraphMarginUnit','em'); }} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="0" max="4" step="0.1"
              value={+form.paragraphMarginBottom || 1}
              onChange={e => set('paragraphMarginBottom', e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="0" step="0.1"
              value={form.paragraphMarginBottom || '1'}
              onChange={e => set('paragraphMarginBottom', e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── COLORS TAB ────────────────────────────────────────────────────────────────

function ColorsTab() {
  const [form,       setForm]       = useState(DEF_COLORS);
  const [typography, setTypography] = useState(DEF_TYPOGRAPHY);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    api.getCustomizerSection('colors').then(d => setForm({ ...DEF_COLORS, ...d })).catch(() => {});
    api.getCustomizerSection('typography').then(d => setTypography(t => ({ ...t, ...d }))).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPalette = (p) => setForm(f => ({ ...f, ...p.settings }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('colors', form);
      applyCustomizerSettings({ colors: form, typography });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Global Palette Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Global Palette</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_COLORS)} title="Reset">↺</button>
        </div>
        <div className="gc-palette-presets">
          {COLOR_PALETTES.map(p => (
            <button
              key={p.label}
              className="gc-palette-card"
              onClick={() => applyPalette(p)}
              title={`Apply ${p.label} palette`}
            >
              <div className="gc-palette-swatches">
                {p.swatches.slice(0,5).map((s, i) => (
                  <div key={i} className="gc-palette-swatch-block" style={{ background: s }} />
                ))}
              </div>
              <span className="gc-palette-label">{p.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
        {/* Current palette dot row */}
        <div className="gc-palette-dots">
          {[form.accent, form.links, form.headings, form.bodyText, '#ffffff', form.siteBackground, form.contentBackground, form.borders].map((c, i) => (
            <span key={i} className="gc-palette-dot" style={{ background: c, border: c === '#ffffff' ? '1px solid #e0d8cc' : undefined }} />
          ))}
        </div>
      </div>

      {/* Theme Colors */}
      <SectionDivider label="Theme Color" />
      <div className="gc-section">
        <ColorSwatch label="Accent"          value={form.accent}    onChange={v => set('accent', v)}    onReset={() => set('accent', DEF_COLORS.accent)} />
        <ColorSwatch label="Links"           value={form.links}     onChange={v => set('links', v)}     onReset={() => set('links', DEF_COLORS.links)} />
        <ColorSwatch label="Heading (H1–H6)" value={form.headings}  onChange={v => set('headings', v)}  onReset={() => set('headings', DEF_COLORS.headings)} />
        <ColorSwatch label="Body Text"       value={form.bodyText}  onChange={v => set('bodyText', v)}  onReset={() => set('bodyText', DEF_COLORS.bodyText)} />
        <ColorSwatch label="Borders"         value={form.borders}   onChange={v => set('borders', v)}   onReset={() => set('borders', DEF_COLORS.borders)} />
      </div>

      {/* Surface Colors */}
      <SectionDivider label="Surface Color" />
      <div className="gc-section">
        <ColorSwatch label="Site Background"    value={form.siteBackground}    onChange={v => set('siteBackground', v)}    onReset={() => set('siteBackground', DEF_COLORS.siteBackground)} />
        <ColorSwatch label="Content Background" value={form.contentBackground} onChange={v => set('contentBackground', v)} onReset={() => set('contentBackground', DEF_COLORS.contentBackground)} />
      </div>

      {/* Dark Background Font Colors */}
      <SectionDivider label="Dark Background Font Color" />
      <div className="gc-section">
        <ColorSwatch label="Eyebrow / Header Label" value={form.darkBgEyebrow} onChange={v => set('darkBgEyebrow', v)} onReset={() => set('darkBgEyebrow', DEF_COLORS.darkBgEyebrow)} />
        <ColorSwatch label="Title"                  value={form.darkBgTitle}   onChange={v => set('darkBgTitle', v)}   onReset={() => set('darkBgTitle', DEF_COLORS.darkBgTitle)} />
        <ColorSwatch label="Description"            value={form.darkBgDesc}    onChange={v => set('darkBgDesc', v)}    onReset={() => set('darkBgDesc', DEF_COLORS.darkBgDesc)} />
        <ColorSwatch label="Link"                   value={form.darkBgLink}    onChange={v => set('darkBgLink', v)}    onReset={() => set('darkBgLink', DEF_COLORS.darkBgLink)} />
        <ColorSwatch label="Button"                 value={form.darkBgBtn}     onChange={v => set('darkBgBtn', v)}     onReset={() => set('darkBgBtn', DEF_COLORS.darkBgBtn)} />
        <ColorSwatch label="Muted / Secondary Text" value={form.darkBgMuted}   onChange={v => set('darkBgMuted', v)}   onReset={() => set('darkBgMuted', DEF_COLORS.darkBgMuted)} />
        <ColorSwatch label="Title <em> Color"         value={form.darkBgTitleEm}      onChange={v => set('darkBgTitleEm', v)}      onReset={() => set('darkBgTitleEm', DEF_COLORS.darkBgTitleEm)} />
        <ColorSwatch label="Button Background"         value={form.darkBgBtnBg}        onChange={v => set('darkBgBtnBg', v)}        onReset={() => set('darkBgBtnBg', DEF_COLORS.darkBgBtnBg)} />
        <ColorSwatch label="Button Font Color"         value={form.darkBgBtnColor}     onChange={v => set('darkBgBtnColor', v)}     onReset={() => set('darkBgBtnColor', DEF_COLORS.darkBgBtnColor)} />
        <ColorSwatch label="Button Hover Background"   value={form.darkBgBtnHoverBg}   onChange={v => set('darkBgBtnHoverBg', v)}   onReset={() => set('darkBgBtnHoverBg', DEF_COLORS.darkBgBtnHoverBg)} />
        <ColorSwatch label="Button Hover Font Color"   value={form.darkBgBtnHoverColor} onChange={v => set('darkBgBtnHoverColor', v)} onReset={() => set('darkBgBtnHoverColor', DEF_COLORS.darkBgBtnHoverColor)} />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── CONTAINER TAB ─────────────────────────────────────────────────────────────

function ContainerTab() {
  const [form,   setForm]   = useState(DEF_CONTAINER);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('container').then(d => setForm({ ...DEF_CONTAINER, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('container', form);
      applyCustomizerSettings({ container: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Container Layout */}
      <div className="gc-section">
        <span className="gc-section-label">Container Layout</span>
        <div className="gc-layout-opts">
          {CONTAINER_LAYOUTS.map(l => (
            <button
              key={l.value}
              className={`gc-layout-opt${form.layout === l.value ? ' active' : ''}`}
              onClick={() => set('layout', l.value)}
            >
              {l.icon}
              <span className="gc-layout-opt-label">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Container Style */}
      <SectionDivider label="Container Style" />
      <div className="gc-section">
        <div className="gc-toggle-row">
          <button className={`gc-toggle-btn${form.style === 'unboxed' ? ' active' : ''}`} onClick={() => set('style','unboxed')}>Unboxed</button>
          <button className={`gc-toggle-btn${form.style === 'boxed'   ? ' active' : ''}`} onClick={() => set('style','boxed')}>Boxed</button>
        </div>
        <p className="gc-hint">
          {form.style === 'boxed' ? 'Page content is centered in a max-width box with a subtle shadow.' : 'Content spans the full viewport width with no outer boundary.'}
        </p>
      </div>

      {/* Container Width */}
      <SectionDivider label="Container Width" />
      <div className="gc-section">
        <div className="gc-slider-group">
          <div className="gc-slider-head">
            <span className="gc-slider-label">Container Width</span>
            <div className="gc-unit-tabs">
              <span className="gc-unit-tab active">PX</span>
              <button className="gc-icon-btn" onClick={() => set('containerWidth', 1200)} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="600" max="1800" step="10"
              value={form.containerWidth || 1200}
              onChange={e => set('containerWidth', +e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="600" max="1800"
              value={form.containerWidth || 1200}
              onChange={e => set('containerWidth', +e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>

        <div className="gc-slider-group" style={{ marginTop: '1.25rem' }}>
          <div className="gc-slider-head">
            <span className="gc-slider-label">Narrow Container Width</span>
            <div className="gc-unit-tabs">
              <span className="gc-unit-tab active">PX</span>
              <button className="gc-icon-btn" onClick={() => set('narrowWidth', 750)} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="400" max="1200" step="10"
              value={form.narrowWidth || 750}
              onChange={e => set('narrowWidth', +e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="400" max="1200"
              value={form.narrowWidth || 750}
              onChange={e => set('narrowWidth', +e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── BUTTONS TAB ───────────────────────────────────────────────────────────────

function FourFields({ label, keys, form, setForm, unit, unitKey, unitOptions }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const linked = keys.every(k => form[k] === form[keys[0]]);
  const [lock, setLock] = useState(linked);

  const update = (k, v) => {
    if (lock) {
      const upd = {};
      keys.forEach(key => { upd[key] = v; });
      setForm(f => ({ ...f, ...upd }));
    } else {
      set(k, v);
    }
  };

  const subLabels = ['TOP','RIGHT','BOTTOM','LEFT'];
  return (
    <div className="gc-4fields-group">
      <div className="gc-4fields-head">
        <span className="gc-slider-label">{label}</span>
        <div className="gc-unit-tabs">
          {unitOptions?.map(u => (
            <button key={u} className={`gc-unit-tab${(form[unitKey]||unitOptions[0])===u?' active':''}`}
              onClick={() => set(unitKey, u)}>{u.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div className="gc-4fields-row">
        {keys.map((k, i) => (
          <div key={k} className="gc-4field-cell">
            <input type="number" className="gc-4field-inp"
              value={form[k] || '0'}
              onChange={e => update(k, e.target.value)} />
            <span className="gc-4field-label">{subLabels[i]}</span>
          </div>
        ))}
        <button
          className={`gc-link-btn${lock ? ' active' : ''}`}
          onClick={() => setLock(l => !l)}
          title={lock ? 'Unlink values' : 'Link all values'}
        >
          {lock ? '⛓' : '⛓︎'}
        </button>
      </div>
    </div>
  );
}

function ButtonsTab() {
  const [form,   setForm]   = useState(DEF_BUTTONS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('buttons').then(d => setForm({ ...DEF_BUTTONS, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (p) => setForm(f => ({ ...f, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('buttons', form);
      applyCustomizerSettings({ buttons: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  // Live preview button style
  const previewStyle = {
    color: form.textColor,
    background: form.bgColor,
    border: `${form.borderWidthTop||0}px ${form.borderWidthRight||0}px ${form.borderWidthBottom||0}px ${form.borderWidthLeft||0}px solid ${form.borderColor}`,
    borderStyle: 'solid',
    padding: `${form.paddingTop||12}${form.paddingUnit||'px'} ${form.paddingRight||28}${form.paddingUnit||'px'} ${form.paddingBottom||12}${form.paddingUnit||'px'} ${form.paddingLeft||28}${form.paddingUnit||'px'}`,
    borderRadius: `${form.borderRadiusTop||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusRight||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusBottom||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusLeft||3}${form.borderRadiusUnit||'px'}`,
    fontFamily: form.font ? `'${form.font}', sans-serif` : undefined,
    cursor: 'default',
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const displayColor = (v) => (v && v !== 'transparent' && !v.startsWith('rgba')) ? v : '#cccccc';

  return (
    <div className="gc-tab-body">
      {/* Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Button Presets</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_BUTTONS)} title="Reset">↺</button>
        </div>
        <div className="gc-btn-presets">
          {BUTTON_PRESETS.map((p, i) => (
            <button key={i}
              className="gc-btn-preset"
              onClick={() => applyPreset(p)}
              style={{
                color: p.textColor,
                background: p.bgColor === 'transparent' ? 'transparent' : p.bgColor,
                border: `1.5px solid ${p.borderColor === 'transparent' ? p.textColor : p.borderColor}`,
                borderRadius: `${p.borderRadiusTop}px`,
              }}
            >
              Button
            </button>
          ))}
        </div>
        {/* Live preview */}
        <div className="gc-btn-preview-wrap">
          <span className="gc-hint-label">Preview</span>
          <button style={previewStyle}>Button</button>
        </div>
      </div>

      {/* Colors */}
      <SectionDivider label="Colors" />
      <div className="gc-section">
        <div className="gc-color-row">
          <span className="gc-color-label">Text Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('textColor', DEF_BUTTONS.textColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.textColor }} />
              <input type="color" value={displayColor(form.textColor)} onChange={e => set('textColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
        <div className="gc-color-row">
          <span className="gc-color-label">Background Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('bgColor', DEF_BUTTONS.bgColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.bgColor }} />
              <input type="color" value={displayColor(form.bgColor)} onChange={e => set('bgColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
        <div className="gc-color-row">
          <span className="gc-color-label">Border Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('borderColor', DEF_BUTTONS.borderColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.borderColor === 'transparent' ? '#eee' : form.borderColor, border: form.borderColor === 'transparent' ? '1px dashed #ccc' : undefined }} />
              <input type="color" value={displayColor(form.borderColor)} onChange={e => set('borderColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Font */}
      <SectionDivider label="Font" />
      <div className="gc-section">
        <div className="gc-font-row">
          <span className="gc-font-row-label">Button Font</span>
          <input className="gc-font-inp" value={form.font || ''} onChange={e => set('font', e.target.value)} placeholder="e.g. Josefin Sans" />
          <span className="gc-font-preview" style={{ fontFamily: `'${form.font}', sans-serif` }}>Aa</span>
        </div>
      </div>

      {/* Padding */}
      <SectionDivider label="Padding" />
      <div className="gc-section">
        <FourFields
          label="Padding"
          keys={['paddingTop','paddingRight','paddingBottom','paddingLeft']}
          form={form}
          setForm={setForm}
          unitKey="paddingUnit"
          unitOptions={['px','em','%']}
        />
      </div>

      {/* Border Width */}
      <SectionDivider label="Border Width" />
      <div className="gc-section">
        <FourFields
          label="Border Width"
          keys={['borderWidthTop','borderWidthRight','borderWidthBottom','borderWidthLeft']}
          form={form}
          setForm={setForm}
          unitKey={null}
          unitOptions={null}
        />
      </div>

      {/* Border Radius */}
      <SectionDivider label="Border Radius" />
      <div className="gc-section">
        <FourFields
          label="Border Radius"
          keys={['borderRadiusTop','borderRadiusRight','borderRadiusBottom','borderRadiusLeft']}
          form={form}
          setForm={setForm}
          unitKey="borderRadiusUnit"
          unitOptions={['px','em','%']}
        />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── SECURITY TAB ──────────────────────────────────────────────────────────────

function ProtectionBlock({ label, fieldKey, form, setForm, hint }) {
  const enabled = !!form[fieldKey];
  return (
    <div className="gc-section">
      <div className="gc-section-head">
        <span className="gc-section-label">{label}</span>
      </div>

      <div className="gc-protection-status" data-active={String(enabled)}>
        <span className="gc-protection-dot" />
        <span className="gc-protection-status-text">
          {enabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      <div className="gc-toggle-row" style={{ marginTop: '0.75rem' }}>
        <button
          className={`gc-toggle-btn${enabled ? ' active' : ''}`}
          onClick={() => setForm(f => ({ ...f, [fieldKey]: true }))}
        >
          Enable
        </button>
        <button
          className={`gc-toggle-btn${!enabled ? ' active' : ''}`}
          onClick={() => setForm(f => ({ ...f, [fieldKey]: false }))}
        >
          Disable
        </button>
      </div>

      <p className="gc-hint" style={{ marginTop: '0.75rem' }}>{hint}</p>
    </div>
  );
}

function SecurityTab() {
  const [form,   setForm]   = useState(DEF_PROTECTION);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('site-protection')
      .then(d => setForm({ ...DEF_PROTECTION, ...d }))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('site-protection', form);
      applyCustomizerSettings({ 'site-protection': form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">

      <ProtectionBlock
        label="Frontend Protection"
        fieldKey="frontendProtection"
        form={form}
        setForm={setForm}
        hint="Applies to all public-facing pages only. Disables text selection, blocks right-click and copy shortcuts (Ctrl/Cmd + C, X, S, P, A), and shows a black overlay on Print Screen or window blur. The Admin panel is never affected by this toggle."
      />

      <SectionDivider label="Admin Panel Protection" />

      <ProtectionBlock
        label="Admin Protection"
        fieldKey="adminProtection"
        form={form}
        setForm={setForm}
        hint="Applies only within the Admin CMS. Disables text selection, blocks right-click and copy shortcuts, and shows a black overlay on Print Screen or window blur inside the admin interface. The public-facing website is never affected by this toggle."
      />

      <div className="gc-section" style={{ borderTop: '1px solid #f0ece4', paddingTop: '1rem' }}>
        <p className="gc-hint" style={{ margin: 0 }}>
          Both toggles are fully independent. Each stores its state separately and
          applies protection only to its own context. No browser-based method can
          block all screen-capture tools.
        </p>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── HEADER TAB ────────────────────────────────────────────────────────────────

const DEF_HEADER = {
  logoUrl:             '',
  logoWidth:           '',
  logoHeight:          '60',
  logoAlt:             'Vinay Kulkarni',
  tagline:             'Dharayati Iti Dharmaha',
  ctaText:             'Book a Session',
  ctaAction:           'modal',
  ctaLink:             '',
  // nav default state
  navFontColor:        '',
  navHoverColor:       '',
  navActiveBarColor:   '',
  navActiveBarHeight:  '',
  // sticky state
  stickyBg:            '',
  stickyFontColor:     '',
  stickyHoverColor:    '',
  // cta default state
  ctaBg:               '',
  ctaBorder:           '',
  ctaTextColor:        '',
  // cta hover state
  ctaHoverBg:          '',
  ctaHoverBorder:      '',
  ctaHoverTextColor:   '',
  // submenu / dropdown
  dropdownBg:          '',
  dropdownFontColor:   '',
  dropdownHoverBg:     '',
  dropdownHoverColor:  '',
};

function HeaderTab() {
  const [form,        setForm]        = useState(DEF_HEADER);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getCustomizerSection('header').then(d => setForm({ ...DEF_HEADER, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { logoUrl } = await api.uploadCustomizerLogo('header', file);
      setForm(f => ({ ...f, logoUrl }));
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('header', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  const logoSrc = form.logoUrl
    ? (form.logoUrl.startsWith('http') ? form.logoUrl : `${API_BASE.replace('/api', '')}${form.logoUrl}`)
    : null;

  return (
    <div className="gc-tab-body">
      {/* Logo */}
      <div className="gc-section" style={{ borderRadius: '8px 8px 0 0', borderTop: '1px solid #e8e0d4' }}>
        <div className="gc-section-head">
          <span className="gc-section-label">Header Logo</span>
        </div>
        <div className="gc-logo-preview-wrap">
          {logoSrc ? (
            <img src={logoSrc} alt="Header logo" className="gc-logo-preview" />
          ) : (
            <div className="gc-logo-placeholder">No logo uploaded — using default</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="adm-btn adm-btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </button>
          {form.logoUrl && (
            <button
              className="adm-btn"
              style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5' }}
              onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
            >
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
        {uploadError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
          <div className="gc-font-row" style={{ flex: 1 }}>
            <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Width (px)</span>
            <input
              type="number"
              className="gc-size-inp"
              value={form.logoWidth}
              min="0"
              placeholder="auto"
              onChange={e => set('logoWidth', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
          <div className="gc-font-row" style={{ flex: 1 }}>
            <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Height (px)</span>
            <input
              type="number"
              className="gc-size-inp"
              value={form.logoHeight}
              min="0"
              placeholder="auto"
              onChange={e => set('logoHeight', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        </div>
        <div className="gc-font-row" style={{ marginTop: '0.25rem' }}>
          <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Alt Text</span>
          <input
            className="adm-inp"
            value={form.logoAlt}
            onChange={e => set('logoAlt', e.target.value)}
            placeholder="e.g. Vinay Kulkarni"
            style={{ flex: 1 }}
          />
        </div>
        <p className="gc-hint">Recommended: PNG with transparent background. Leave a dimension blank to scale proportionally.</p>
      </div>

      {/* Tagline */}
      <SectionDivider label="Mobile Menu Tagline" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: 0 }}>Shown below the site name in the mobile navigation drawer.</p>
        <input
          className="adm-inp"
          value={form.tagline}
          onChange={e => set('tagline', e.target.value)}
          placeholder="e.g. Dharayati Iti Dharmaha"
        />
      </div>

      {/* CTA Button */}
      <SectionDivider label="CTA Button" />
      <div className="gc-section">
        <div className="gc-font-row">
          <span className="gc-font-row-label">Button Label</span>
          <input
            className="adm-inp"
            value={form.ctaText}
            onChange={e => set('ctaText', e.target.value)}
            placeholder="e.g. Book a Session"
            style={{ flex: 1 }}
          />
        </div>
        <div className="gc-font-row" style={{ marginTop: '0.25rem' }}>
          <span className="gc-font-row-label">Action</span>
          <div className="gc-toggle-row">
            <button
              className={`gc-toggle-btn${form.ctaAction === 'modal' ? ' active' : ''}`}
              onClick={() => set('ctaAction', 'modal')}
            >
              Open Booking Modal
            </button>
            <button
              className={`gc-toggle-btn${form.ctaAction === 'url' ? ' active' : ''}`}
              onClick={() => set('ctaAction', 'url')}
            >
              Go to URL
            </button>
          </div>
        </div>
        {form.ctaAction === 'url' && (
          <div className="gc-font-row" style={{ marginTop: '0.25rem' }}>
            <span className="gc-font-row-label">URL</span>
            <input
              className="adm-inp"
              value={form.ctaLink}
              onChange={e => set('ctaLink', e.target.value)}
              placeholder="https://… or /page"
              style={{ flex: 1 }}
            />
          </div>
        )}
        <p className="gc-hint">Controls the primary call-to-action button in the top navigation bar.</p>
      </div>

      {/* Nav Font Color + Hover + Active Bar */}
      <SectionDivider label="Navigation Font Colors" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Default (non-sticky) header navigation link colors and active indicator.</p>
        <ColorSwatch
          label="Default Color"
          value={form.navFontColor || '#1a2543'}
          onChange={v => set('navFontColor', v)}
          onReset={() => set('navFontColor', '')}
        />
        <ColorSwatch
          label="Hover Color"
          value={form.navHoverColor || '#8b2e33'}
          onChange={v => set('navHoverColor', v)}
          onReset={() => set('navHoverColor', '')}
        />
        <ColorSwatch
          label="Active Bar Color"
          value={form.navActiveBarColor || '#de7336'}
          onChange={v => set('navActiveBarColor', v)}
          onReset={() => set('navActiveBarColor', '')}
        />
        <div className="gc-font-row" style={{ marginTop: '0.25rem' }}>
          <span className="gc-font-row-label">Bar Height (px)</span>
          <input
            type="number"
            className="gc-size-inp"
            value={form.navActiveBarHeight}
            min="1"
            max="8"
            placeholder="2"
            onChange={e => set('navActiveBarHeight', e.target.value)}
            style={{ width: '70px' }}
          />
        </div>
        <p className="gc-hint">Active bar is the underline shown on hover and on the current page link.</p>
      </div>

      {/* Sticky Nav Colors */}
      <SectionDivider label="Sticky Navigation Colors" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Colors applied when the navbar sticks to the top after scrolling.</p>
        <ColorSwatch
          label="Background"
          value={form.stickyBg || 'rgba(243,179,62,0.96)'}
          onChange={v => set('stickyBg', v)}
          onReset={() => set('stickyBg', '')}
        />
        <ColorSwatch
          label="Font Color"
          value={form.stickyFontColor || '#1a2543'}
          onChange={v => set('stickyFontColor', v)}
          onReset={() => set('stickyFontColor', '')}
        />
        <ColorSwatch
          label="Hover Font Color"
          value={form.stickyHoverColor || '#8b2e33'}
          onChange={v => set('stickyHoverColor', v)}
          onReset={() => set('stickyHoverColor', '')}
        />
      </div>

      {/* CTA Button Colors */}
      <SectionDivider label="CTA Button Colors" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Appearance of the navigation call-to-action button.</p>
        <ColorSwatch
          label="Background"
          value={form.ctaBg || 'transparent'}
          onChange={v => set('ctaBg', v)}
          onReset={() => set('ctaBg', '')}
        />
        <ColorSwatch
          label="Border"
          value={form.ctaBorder || '#de7336'}
          onChange={v => set('ctaBorder', v)}
          onReset={() => set('ctaBorder', '')}
        />
        <ColorSwatch
          label="Text Color"
          value={form.ctaTextColor || '#1a2543'}
          onChange={v => set('ctaTextColor', v)}
          onReset={() => set('ctaTextColor', '')}
        />
        <ColorSwatch
          label="Hover Background"
          value={form.ctaHoverBg || '#de7336'}
          onChange={v => set('ctaHoverBg', v)}
          onReset={() => set('ctaHoverBg', '')}
        />
        <ColorSwatch
          label="Hover Border"
          value={form.ctaHoverBorder || '#de7336'}
          onChange={v => set('ctaHoverBorder', v)}
          onReset={() => set('ctaHoverBorder', '')}
        />
        <ColorSwatch
          label="Hover Text Color"
          value={form.ctaHoverTextColor || '#ffffff'}
          onChange={v => set('ctaHoverTextColor', v)}
          onReset={() => set('ctaHoverTextColor', '')}
        />
      </div>

      {/* Submenu / Dropdown */}
      <SectionDivider label="Submenu / Dropdown" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Desktop dropdown panel that appears when hovering a parent nav item.</p>
        <ColorSwatch
          label="Background"
          value={form.dropdownBg || 'rgba(243,179,62,0.98)'}
          onChange={v => set('dropdownBg', v)}
          onReset={() => set('dropdownBg', '')}
        />
        <ColorSwatch
          label="Font Color"
          value={form.dropdownFontColor || '#1a2543'}
          onChange={v => set('dropdownFontColor', v)}
          onReset={() => set('dropdownFontColor', '')}
        />
        <ColorSwatch
          label="Hover Background"
          value={form.dropdownHoverBg || 'rgba(255,255,255,0.30)'}
          onChange={v => set('dropdownHoverBg', v)}
          onReset={() => set('dropdownHoverBg', '')}
        />
        <ColorSwatch
          label="Hover Font Color"
          value={form.dropdownHoverColor || '#8b2e33'}
          onChange={v => set('dropdownHoverColor', v)}
          onReset={() => set('dropdownHoverColor', '')}
        />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── FOOTER TAB ────────────────────────────────────────────────────────────────

const DEF_FOOTER = {
  logoUrl:          '',
  logoWidth:        '',
  logoHeight:       '80',
  logoAlt:          'Vinay Kulkarni',
  copyrightText:    '© 2026 Vinay Kulkarni · All Rights Reserved',
  footerBg:         '',
  navFontColor:     '',
  navHoverColor:    '',
};

function FooterTab() {
  const [form,        setForm]        = useState(DEF_FOOTER);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getCustomizerSection('footer').then(d => setForm({ ...DEF_FOOTER, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { logoUrl } = await api.uploadCustomizerLogo('footer', file);
      setForm(f => ({ ...f, logoUrl }));
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('footer', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  const logoSrc = form.logoUrl
    ? (form.logoUrl.startsWith('http') ? form.logoUrl : `${API_BASE.replace('/api', '')}${form.logoUrl}`)
    : null;

  return (
    <div className="gc-tab-body">
      {/* Logo */}
      <div className="gc-section" style={{ borderRadius: '8px 8px 0 0', borderTop: '1px solid #e8e0d4' }}>
        <div className="gc-section-head">
          <span className="gc-section-label">Footer Logo</span>
        </div>
        <div className="gc-logo-preview-wrap">
          {logoSrc ? (
            <img src={logoSrc} alt="Footer logo" className="gc-logo-preview" style={{ background: '#2a2218' }} />
          ) : (
            <div className="gc-logo-placeholder">No logo uploaded — using default</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="adm-btn adm-btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </button>
          {form.logoUrl && (
            <button
              className="adm-btn"
              style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5' }}
              onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
            >
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
        {uploadError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
          <div className="gc-font-row" style={{ flex: 1 }}>
            <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Width (px)</span>
            <input
              type="number"
              className="gc-size-inp"
              value={form.logoWidth}
              min="0"
              placeholder="auto"
              onChange={e => set('logoWidth', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
          <div className="gc-font-row" style={{ flex: 1 }}>
            <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Height (px)</span>
            <input
              type="number"
              className="gc-size-inp"
              value={form.logoHeight}
              min="0"
              placeholder="auto"
              onChange={e => set('logoHeight', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        </div>
        <div className="gc-font-row" style={{ marginTop: '0.25rem' }}>
          <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Alt Text</span>
          <input
            className="adm-inp"
            value={form.logoAlt}
            onChange={e => set('logoAlt', e.target.value)}
            placeholder="e.g. Vinay Kulkarni"
            style={{ flex: 1 }}
          />
        </div>
        <p className="gc-hint">Recommended: PNG with transparent background, shown on a dark footer. Leave a dimension blank to scale proportionally. Footer navigation links are managed under Admin → Navigation.</p>
      </div>

      {/* Copyright */}
      <SectionDivider label="Copyright Text" />
      <div className="gc-section">
        <input
          className="adm-inp"
          value={form.copyrightText}
          onChange={e => set('copyrightText', e.target.value)}
          placeholder="© 2026 Your Name · All Rights Reserved"
        />
        <p className="gc-hint">Displayed at the bottom of the footer on every page.</p>
      </div>

      {/* Footer Background */}
      <SectionDivider label="Footer Background" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Background color of the entire footer strip.</p>
        <ColorSwatch
          label="Background"
          value={form.footerBg || '#8b2e33'}
          onChange={v => set('footerBg', v)}
          onReset={() => set('footerBg', '')}
        />
      </div>

      {/* Footer Navigation Colors */}
      <SectionDivider label="Navigation Font Colors" />
      <div className="gc-section">
        <p className="gc-hint" style={{ margin: '0 0 0.5rem' }}>Color of footer navigation links in their default and hovered states.</p>
        <ColorSwatch
          label="Default Color"
          value={form.navFontColor || 'rgba(255,255,255,0.6)'}
          onChange={v => set('navFontColor', v)}
          onReset={() => set('navFontColor', '')}
        />
        <ColorSwatch
          label="Hover Color"
          value={form.navHoverColor || '#ffffff'}
          onChange={v => set('navHoverColor', v)}
          onReset={() => set('navHoverColor', '')}
        />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── LOADER & FAVICON TAB ─────────────────────────────────────────────────────

const DEF_LOADER = {
  bgColor:    '#8b2e33',
  iconType:   'text',
  iconText:   'ॐ',
  iconColor:  '#ffea00',
  iconUrl:    '',
  iconWidth:  '',
  iconHeight: '',
  lineColor:  '#ffea00',
};

const DEF_FAVICON = { faviconUrl: '' };

function LoaderFaviconTab() {
  const [loader,        setLoader]        = useState(DEF_LOADER);
  const [favicon,       setFavicon]       = useState(DEF_FAVICON);
  const [savingLoader,  setSavingLoader]  = useState(false);
  const [savedLoader,   setSavedLoader]   = useState(false);
  const [savingFavicon, setSavingFavicon] = useState(false);
  const [savedFavicon,  setSavedFavicon]  = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconError,     setIconError]     = useState('');
  const [uploadingFav,  setUploadingFav]  = useState(false);
  const [favError,      setFavError]      = useState('');
  const iconRef = useRef(null);
  const favRef  = useRef(null);

  useEffect(() => {
    api.getCustomizerSection('loader').then(d => setLoader(s => ({ ...DEF_LOADER, ...d }))).catch(() => {});
    api.getCustomizerSection('favicon').then(d => setFavicon(s => ({ ...DEF_FAVICON, ...d }))).catch(() => {});
  }, []);

  const setL = (k, v) => setLoader(f => ({ ...f, [k]: v }));

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true); setIconError('');
    try {
      const { iconUrl } = await api.uploadLoaderIcon(file);
      setLoader(f => ({ ...f, iconUrl, iconType: 'image' }));
    } catch (err) { setIconError(err.message || 'Upload failed'); }
    finally { setUploadingIcon(false); if (iconRef.current) iconRef.current.value = ''; }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFav(true); setFavError('');
    try {
      const { faviconUrl } = await api.uploadFavicon(file);
      setFavicon({ faviconUrl });
    } catch (err) { setFavError(err.message || 'Upload failed'); }
    finally { setUploadingFav(false); if (favRef.current) favRef.current.value = ''; }
  };

  const saveLoader = async () => {
    setSavingLoader(true);
    try {
      await api.saveCustomizerSection('loader', loader);
      // Update cache so next page load shows new settings immediately
      try { localStorage.setItem('vk_loader_settings', JSON.stringify(loader)); } catch {}
      setSavedLoader(true); setTimeout(() => setSavedLoader(false), 3000);
    } catch (_) {}
    setSavingLoader(false);
  };

  const saveFavicon = async () => {
    setSavingFavicon(true);
    try {
      await api.saveCustomizerSection('favicon', favicon);
      // Apply favicon immediately in the admin too
      if (favicon.faviconUrl) {
        const root = API_BASE.replace('/api', '');
        const href = favicon.faviconUrl.startsWith('http') ? favicon.faviconUrl : `${root}${favicon.faviconUrl}`;
        const link = document.querySelector("link[rel='icon']") || (() => {
          const l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); return l;
        })();
        link.href = href;
      }
      setSavedFavicon(true); setTimeout(() => setSavedFavicon(false), 3000);
    } catch (_) {}
    setSavingFavicon(false);
  };

  const iconSrc = loader.iconUrl
    ? (loader.iconUrl.startsWith('http') ? loader.iconUrl : `${API_BASE.replace('/api', '')}${loader.iconUrl}`)
    : null;

  const favSrc = favicon.faviconUrl
    ? (favicon.faviconUrl.startsWith('http') ? favicon.faviconUrl : `${API_BASE.replace('/api', '')}${favicon.faviconUrl}`)
    : null;

  const displayColor = v => (v && v !== 'transparent' && !v.startsWith('rgba')) ? v : '#cccccc';

  return (
    <div className="gc-tab-body">

      {/* ── Loading Screen ── */}
      <div className="gc-section" style={{ borderRadius: '8px 8px 0 0', borderTop: '1px solid #e8e0d4' }}>
        <div className="gc-section-head">
          <span className="gc-section-label">Loading Screen</span>
          <button className="gc-icon-btn" onClick={() => setLoader(DEF_LOADER)} title="Reset to defaults">↺</button>
        </div>

        {/* Live mini-preview */}
        <div className="gc-loader-preview" style={{ background: loader.bgColor }}>
          {loader.iconType === 'image' && iconSrc ? (
            <img
              src={iconSrc}
              alt="Loader icon"
              style={{
                height: loader.iconHeight ? `${loader.iconHeight}px` : '48px',
                width:  loader.iconWidth  ? `${loader.iconWidth}px`  : undefined,
                objectFit: 'contain',
                opacity: 0.9,
              }}
            />
          ) : (
            <span style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: '2.5rem', color: loader.iconColor }}>
              {loader.iconText || 'ॐ'}
            </span>
          )}
          <div style={{ width: '80px', height: '1px', background: loader.lineColor, marginTop: '0.6rem', opacity: 0.85 }} />
        </div>
      </div>

      {/* Background Color */}
      <SectionDivider label="Background Color" />
      <div className="gc-section">
        <ColorSwatch
          label="Background"
          value={loader.bgColor}
          onChange={v => setL('bgColor', v)}
          onReset={() => setL('bgColor', DEF_LOADER.bgColor)}
        />
      </div>

      {/* Icon */}
      <SectionDivider label="Loader Icon" />
      <div className="gc-section">
        <div className="gc-toggle-row">
          <button className={`gc-toggle-btn${loader.iconType === 'text' ? ' active' : ''}`} onClick={() => setL('iconType', 'text')}>Text / Symbol</button>
          <button className={`gc-toggle-btn${loader.iconType === 'image' ? ' active' : ''}`} onClick={() => setL('iconType', 'image')}>Image</button>
        </div>

        {loader.iconType === 'text' ? (
          <>
            <div className="gc-font-row">
              <span className="gc-font-row-label">Symbol / Text</span>
              <input
                className="adm-inp"
                value={loader.iconText}
                onChange={e => setL('iconText', e.target.value)}
                placeholder="ॐ"
                style={{ flex: 1, fontSize: '1.4rem' }}
              />
            </div>
            <ColorSwatch label="Icon Color" value={loader.iconColor} onChange={v => setL('iconColor', v)} onReset={() => setL('iconColor', DEF_LOADER.iconColor)} />
          </>
        ) : (
          <>
            <div className="gc-logo-preview-wrap">
              {iconSrc
                ? <img src={iconSrc} alt="Loader icon" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                : <div className="gc-logo-placeholder">No icon uploaded</div>
              }
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="adm-btn adm-btn-secondary" onClick={() => iconRef.current?.click()} disabled={uploadingIcon}>
                {uploadingIcon ? 'Uploading…' : 'Upload Icon'}
              </button>
              {loader.iconUrl && (
                <button className="adm-btn" style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5' }}
                  onClick={() => setLoader(f => ({ ...f, iconUrl: '' }))}>Remove</button>
              )}
              <input ref={iconRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
            </div>
            {iconError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{iconError}</p>}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="gc-font-row" style={{ flex: 1 }}>
                <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Width (px)</span>
                <input type="number" className="gc-size-inp" value={loader.iconWidth} min="0" placeholder="auto"
                  onChange={e => setL('iconWidth', e.target.value)} style={{ width: '80px' }} />
              </div>
              <div className="gc-font-row" style={{ flex: 1 }}>
                <span className="gc-font-row-label" style={{ minWidth: '3.5rem' }}>Height (px)</span>
                <input type="number" className="gc-size-inp" value={loader.iconHeight} min="0" placeholder="120"
                  onChange={e => setL('iconHeight', e.target.value)} style={{ width: '80px' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Line Color */}
      <SectionDivider label="Animated Line" />
      <div className="gc-section" style={{ borderRadius: '0 0 8px 8px' }}>
        <ColorSwatch label="Line Color" value={loader.lineColor} onChange={v => setL('lineColor', v)} onReset={() => setL('lineColor', DEF_LOADER.lineColor)} />
      </div>

      <SaveBar onSave={saveLoader} saving={savingLoader} saved={savedLoader} />

      {/* ── Favicon ── */}
      <SectionDivider label="Favicon" />
      <div className="gc-section" style={{ borderRadius: '8px 8px 0 0', borderTop: '1px solid #e8e0d4' }}>
        <div className="gc-section-head">
          <span className="gc-section-label">Browser Favicon</span>
        </div>
        <div className="gc-logo-preview-wrap" style={{ minHeight: '60px' }}>
          {favSrc
            ? <img src={favSrc} alt="Favicon" style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated' }} />
            : <div className="gc-logo-placeholder">No favicon uploaded — using default <code>/logo-icon.png</code></div>
          }
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="adm-btn adm-btn-secondary" onClick={() => favRef.current?.click()} disabled={uploadingFav}>
            {uploadingFav ? 'Uploading…' : 'Upload Favicon'}
          </button>
          {favicon.faviconUrl && (
            <button className="adm-btn" style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5' }}
              onClick={() => setFavicon({ faviconUrl: '' })}>Remove</button>
          )}
          <input ref={favRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={handleFaviconUpload} />
        </div>
        {favError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{favError}</p>}
        <p className="gc-hint">Recommended: 32×32 or 64×64 PNG or ICO. Shown in the browser tab and bookmarks.</p>
      </div>

      <div className="gc-section" style={{ borderRadius: '0 0 8px 8px' }}>
        <SaveBar onSave={saveFavicon} saving={savingFavicon} saved={savedFavicon} />
      </div>

    </div>
  );
}

// ── INNER HERO TAB ────────────────────────────────────────────────────────────

const DEF_INNER_HERO = {
  bgColor: '', bgImage: '', mandalaImage: '', afterColor: '', afterImage: '',
  eyebrowColor: '', eyebrowSize: '', eyebrowMobileSize: '',
  h1Color: '',     h1Size: '',     h1MobileSize: '',
  h1EmColor: '',   h1EmSize: '',   h1EmMobileSize: '',
  subColor: '',    subSize: '',    subMobileSize: '',
};
const SERVER_ORIGIN  = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
const ihResolve = (u) => u ? (u.startsWith('http') ? u : `${SERVER_ORIGIN}${u}`) : '';

function ImageUploadRow({ label, hint, value, fieldKey, endpoint, onUploaded, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const ref = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const result = await api.uploadInnerHeroImage(endpoint, file);
      onUploaded(result.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const src = ihResolve(value);

  return (
    <div className="gc-section">
      <div className="gc-section-head"><span className="gc-section-label">{label}</span></div>
      {hint && <p className="gc-hint" style={{ marginBottom: '0.6rem' }}>{hint}</p>}
      {src && (
        <img src={src} alt={label} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'cover', borderRadius: '4px', display: 'block', marginBottom: '0.5rem' }} />
      )}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button className="adm-btn adm-btn-secondary" onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : (src ? 'Replace Image' : 'Upload Image')}
        </button>
        {src && (
          <button className="adm-btn" style={{ color: '#c0392b', border: '1px solid #e8d5d0', background: '#fff5f5' }} onClick={onRemove}>
            Remove
          </button>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
      </div>
      {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{error}</p>}
    </div>
  );
}

function InnerHeroTab() {
  const [form,   setForm]   = useState(DEF_INNER_HERO);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('inner-hero')
      .then(d => setForm({ ...DEF_INNER_HERO, ...d }))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('inner-hero', form);
      applyCustomizerSettings({ 'inner-hero': form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      <p className="gc-hint" style={{ margin: '0 0 1rem' }}>
        Customise the hero banner shown at the top of all inner pages (Articles, Biography, Talks, etc.).
        Leave a field empty to use the default style.
      </p>

      {/* Background */}
      <SectionDivider label="Background" />
      <div className="gc-section">
        <ColorSwatch
          label="Background Color"
          value={form.bgColor || '#f3b33e'}
          onChange={v => set('bgColor', v)}
          onReset={() => set('bgColor', '')}
        />
        <p className="gc-hint">Replaces the default saffron-to-orange gradient. Set a solid colour or leave empty to keep the gradient.</p>
      </div>

      <ImageUploadRow
        label="Background Image"
        hint="Overlays the background colour/gradient. Use a wide landscape image (min 1400 px wide)."
        value={form.bgImage}
        endpoint="bg-image"
        onUploaded={url => set('bgImage', url)}
        onRemove={() => set('bgImage', '')}
      />

      {/* Mandala */}
      <SectionDivider label="Mandala / Decorative Element" />
      <ImageUploadRow
        label="Hero Mandala Image"
        hint="Replaces the default geometric mandala SVG on the right side. Transparent PNG or SVG recommended."
        value={form.mandalaImage}
        endpoint="mandala-image"
        onUploaded={url => set('mandalaImage', url)}
        onRemove={() => set('mandalaImage', '')}
      />

      {/* After overlay (OM glyph) */}
      <SectionDivider label="OM Glyph Overlay (::after)" />
      <div className="gc-section">
        <ColorSwatch
          label="Glyph Color"
          value={form.afterColor || 'rgba(139,46,51,0.08)'}
          onChange={v => set('afterColor', v)}
          onReset={() => set('afterColor', '')}
        />
        <p className="gc-hint">Colour of the large semi-transparent OM (ॐ) watermark on the right side of the hero.</p>
      </div>

      <ImageUploadRow
        label="Overlay Image (replaces OM glyph)"
        hint="Upload a custom image to replace the OM watermark. Use a transparent PNG. Leave empty to keep the OM glyph."
        value={form.afterImage}
        endpoint="after-image"
        onUploaded={url => set('afterImage', url)}
        onRemove={() => set('afterImage', '')}
      />

      {/* Typography */}
      <SectionDivider label="Typography" />
      <p className="gc-hint" style={{ margin: '-0.25rem 0 0.75rem 0' }}>
        Set font colour and size (px) for each text element in the inner page hero. Leave empty to use the theme default.
      </p>
      {[
        { label: 'Eyebrow / Label',  colorKey: 'eyebrowColor', sizeKey: 'eyebrowSize', mobileKey: 'eyebrowMobileSize' },
        { label: 'H1 Title',         colorKey: 'h1Color',      sizeKey: 'h1Size',      mobileKey: 'h1MobileSize' },
        { label: 'H1 <em> (italic)', colorKey: 'h1EmColor',    sizeKey: 'h1EmSize',    mobileKey: 'h1EmMobileSize' },
        { label: 'Subtitle / Sub',   colorKey: 'subColor',     sizeKey: 'subSize',     mobileKey: 'subMobileSize' },
      ].map(({ label, colorKey, sizeKey, mobileKey }) => (
        <div key={colorKey} className="gc-section" style={{ marginBottom: '0.5rem' }}>
          <div className="gc-section-head" style={{ marginBottom: '0.6rem' }}>
            <span className="gc-section-label">{label}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
            {/* Color */}
            <div style={{ minWidth: '160px' }}>
              <ColorSwatch
                label="Font Color"
                value={form[colorKey] || '#ffffff'}
                onChange={v => set(colorKey, v)}
                onReset={() => set(colorKey, '')}
              />
            </div>
            {/* Desktop size */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7a6a55', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Desktop Size (px)
              </div>
              <div className="gc-size-row">
                <input
                  type="number"
                  className="gc-size-inp"
                  value={form[sizeKey] || ''}
                  min="8" max="200" step="1"
                  placeholder="—"
                  onChange={e => set(sizeKey, e.target.value)}
                  style={{ width: '70px' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#999' }}>px</span>
              </div>
            </div>
            {/* Mobile size */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7a6a55', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mobile Size (px)
              </div>
              <div className="gc-size-row">
                <input
                  type="number"
                  className="gc-size-inp"
                  value={form[mobileKey] || ''}
                  min="8" max="200" step="1"
                  placeholder="—"
                  onChange={e => set(mobileKey, e.target.value)}
                  style={{ width: '70px' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#999' }}>px</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="gc-section" style={{ borderRadius: '0 0 8px 8px' }}>
        <SaveBar onSave={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'typography',  label: 'Typography' },
  { id: 'colors',      label: 'Colors' },
  { id: 'container',   label: 'Container' },
  { id: 'buttons',     label: 'Buttons' },
  { id: 'header',      label: 'Header' },
  { id: 'footer',      label: 'Footer' },
  { id: 'inner-hero',  label: 'Inner Page Hero' },
  { id: 'loader',      label: 'Loader & Favicon' },
  { id: 'security',    label: 'Security' },
];

function GlobalCustomizerAdmin() {
  const [active, setActive] = useState('typography');

  return (
    <div className="bio-adm-root gc-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Global Settings</span>
          <h1 className="bio-adm-title">Customizer</h1>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Site</a>
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

      <div className="gc-content">
        {active === 'typography'  && <TypographyTab />}
        {active === 'colors'      && <ColorsTab />}
        {active === 'container'   && <ContainerTab />}
        {active === 'buttons'     && <ButtonsTab />}
        {active === 'header'      && <HeaderTab />}
        {active === 'footer'      && <FooterTab />}
        {active === 'inner-hero'  && <InnerHeroTab />}
        {active === 'loader'      && <LoaderFaviconTab />}
        {active === 'security'    && <SecurityTab />}
      </div>
    </div>
  );
}

export default GlobalCustomizerAdmin;
