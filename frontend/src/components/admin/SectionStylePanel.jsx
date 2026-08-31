import { useState, useEffect } from 'react';
import { getSectionStyle, updateSectionStyle } from '../../services/sectionStylesApi';
import './SectionStylePanel.css';

const EMPTY = { bg_color: '', height_px: '', font_color: '', font_size_px: '', title_font_color: '', title_font_size_px: '' };

function ColorRow({ label, value, onChange }) {
  const safe = (value && /^#|^rgb|^hsl/.test(value)) ? value : '#000000';
  return (
    <div className="ssp-row">
      <span className="ssp-label">{label}</span>
      <label className="ssp-swatch-wrap" title={value || 'default'}>
        <span className="ssp-swatch" style={{ background: value || '#cccccc' }} />
        <input type="color" value={safe} onChange={e => onChange(e.target.value)} className="ssp-color-hidden" />
      </label>
      <span className="ssp-val">{value || <em style={{ opacity: 0.4 }}>default</em>}</span>
      {value && <button className="ssp-reset" onClick={() => onChange('')} title="Reset">↺</button>}
    </div>
  );
}

function SizeRow({ label, value, onChange, placeholder }) {
  return (
    <div className="ssp-row">
      <span className="ssp-label">{label}</span>
      <input
        type="number" min="0" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'default'}
        className="adm-input adm-input-sm ssp-size-inp"
      />
      <span className="ssp-unit">px</span>
      {value && <button className="ssp-reset" onClick={() => onChange('')} title="Reset">↺</button>}
    </div>
  );
}

export function SectionStylePanel({ sectionKey }) {
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getSectionStyle(sectionKey)
      .then(d => setForm(f => ({ ...f, ...d })))
      .catch(() => {});
  }, [sectionKey]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      await updateSectionStyle(sectionKey, form);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ssp-panel">
      <h3 className="ssp-title">Section Appearance</h3>
      <p className="adm-hint" style={{ marginBottom: '0.6rem' }}>
        Override the default background, text colour, and font size for this section.
      </p>
      <div className="ssp-fields">
        <ColorRow label="Background Color"  value={form.bg_color}           onChange={v => set('bg_color', v)} />
        <ColorRow label="Font Color"        value={form.font_color}         onChange={v => set('font_color', v)} />
        <SizeRow  label="Font Size"         value={form.font_size_px}       onChange={v => set('font_size_px', v)} placeholder="default" />
        <ColorRow label="Title Font Color"  value={form.title_font_color}   onChange={v => set('title_font_color', v)} />
        <SizeRow  label="Title Font Size"   value={form.title_font_size_px} onChange={v => set('title_font_size_px', v)} placeholder="default" />
        <SizeRow  label="Min Height"        value={form.height_px}          onChange={v => set('height_px', v)} placeholder="auto" />
      </div>
      <div className="adm-save-bar" style={{ marginTop: '0.75rem' }}>
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Appearance'}
        </button>
        {saved && <span className="adm-saved-msg">✓ Applied</span>}
        {error && <span className="adm-saved-msg" style={{ color: '#c0392b' }}>⚠ {error}</span>}
      </div>
    </div>
  );
}
