import { useState, useEffect, useRef } from 'react';
import * as api from '../../services/customizerApi';
import { SeoTab } from './SeoTab';
import { PublishToggle } from '../../components/admin/PublishToggle';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

const DEF = {
  logoUrl:          '',
  siteName:         'Vinay Kulkarni',
  accentColor:      '#d4670a',
  sidebarBg:        '#1a1208',
  pageBg:           '#f0ece4',
  topbarBg:         '#ffffff',
  sidebarFontColor: '',
  sidebarFontSize:  '',
};

// ── tiny helpers ──────────────────────────────────────────────────────────────

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_ROOT}${url}`;
}

function applyAdminVars(s) {
  const root = document.documentElement;
  root.style.setProperty('--adm-sidebar-bg', s.sidebarBg   || '#1a1208');
  root.style.setProperty('--adm-accent',     s.accentColor || '#d4670a');
  root.style.setProperty('--adm-page-bg',    s.pageBg      || '#f0ece4');
  root.style.setProperty('--adm-topbar-bg',  s.topbarBg    || '#ffffff');
}

function ColorRow({ label, value, onChange, fallback }) {
  const safe = (value && /^#|^rgb|^hsl/.test(value)) ? value : (fallback || '#000000');
  return (
    <div className="ws-color-row">
      <span className="ws-color-label">{label}</span>
      <label className="ws-swatch-wrap" title={value || 'default'}>
        <span className="ws-swatch" style={{ background: value || fallback || '#ccc' }} />
        <input
          type="color"
          value={safe}
          onChange={e => onChange(e.target.value)}
          className="ws-color-hidden"
        />
      </label>
      <span className="ws-color-val">{value || <em style={{ opacity: 0.4 }}>default</em>}</span>
      {value && value !== fallback && (
        <button className="ws-reset-btn" onClick={() => onChange(fallback || '')} title="Reset">↺</button>
      )}
    </div>
  );
}

function SizeRow({ label, value, onChange, placeholder }) {
  return (
    <div className="ws-color-row">
      <span className="ws-color-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input
          type="number"
          min="8"
          max="24"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'default'}
          className="adm-input adm-input-sm"
          style={{ width: '64px', textAlign: 'right' }}
        />
        <span className="ws-color-val" style={{ minWidth: 'auto' }}>px</span>
        {value && (
          <button className="ws-reset-btn" onClick={() => onChange('')} title="Reset">↺</button>
        )}
      </div>
    </div>
  );
}

// ── Branding tab ──────────────────────────────────────────────────────────────

function BrandingTab() {
  const [form,      setForm]      = useState(DEF);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getAdminSettings()
      .then(d => setForm(f => ({ ...f, ...d })))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { logoUrl } = await api.uploadAdminLogo(file);
      set('logoUrl', logoUrl);
      // immediately reflect in the running layout
      const resolved = resolveUrl(logoUrl);
      document.querySelectorAll('.adm-brand-logo, .login-brand-logo')
        .forEach(img => { img.src = resolved; });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.saveCustomizerSection('admin-settings', form);
      applyAdminVars(form);
      // Notify AdminLayout (and any other mounted listeners) to reflect new values
      window.dispatchEvent(new CustomEvent('adm-settings-change', { detail: form }));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = resolveUrl(form.logoUrl);

  return (
    <div className="ws-panel">
      {/* Logo */}
      <div className="ws-section">
        <h3 className="ws-section-title">Admin Logo</h3>
        <p className="ws-hint">Displayed in the sidebar and login page. Recommended: PNG with transparent background on a dark surface.</p>
        <div className="ws-logo-preview-wrap">
          {logoSrc
            ? <img src={logoSrc} alt="Admin logo" className="ws-logo-preview" />
            : <div className="ws-logo-placeholder">No custom logo — using bundled default</div>
          }
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              onClick={() => set('logoUrl', '')}
            >
              Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
        {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</p>}
      </div>

      {/* Site Name */}
      <div className="ws-section">
        <h3 className="ws-section-title">Site Name</h3>
        <input
          className="adm-inp"
          value={form.siteName}
          onChange={e => set('siteName', e.target.value)}
          placeholder="Vinay Kulkarni"
        />
        <p className="ws-hint">Used as the alt text for the admin logo and throughout the admin interface.</p>
      </div>

      {/* Admin Colors */}
      <div className="ws-section">
        <h3 className="ws-section-title">Admin Interface Colors</h3>
        <p className="ws-hint">Customize the admin panel's color scheme. Changes apply immediately on save.</p>
        <ColorRow label="Sidebar Background" value={form.sidebarBg}   onChange={v => set('sidebarBg', v)}   fallback={DEF.sidebarBg} />
        <ColorRow label="Accent Color"       value={form.accentColor} onChange={v => set('accentColor', v)} fallback={DEF.accentColor} />
        <ColorRow label="Page Background"    value={form.pageBg}      onChange={v => set('pageBg', v)}      fallback={DEF.pageBg} />
        <ColorRow label="Topbar Background"  value={form.topbarBg}    onChange={v => set('topbarBg', v)}    fallback={DEF.topbarBg} />
      </div>

      {/* Sidebar Typography */}
      <div className="ws-section">
        <h3 className="ws-section-title">Sidebar Navigation Typography</h3>
        <p className="ws-hint">Font color and size for sidebar navigation links. Leave size empty to use the default.</p>
        <ColorRow
          label="Nav Link Font Color"
          value={form.sidebarFontColor}
          onChange={v => set('sidebarFontColor', v)}
          fallback="#7a6e5a"
        />
        <SizeRow
          label="Nav Link Font Size"
          value={form.sidebarFontSize}
          onChange={v => set('sidebarFontSize', v)}
          placeholder="12"
        />
      </div>

      {/* Save */}
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved  && <span className="adm-saved-msg">✓ Applied</span>}
        {error && !saving && <span className="adm-saved-msg" style={{ color: '#c0392b' }}>⚠ {error}</span>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'branding', label: 'Admin Branding' },
  { id: 'seo',      label: 'Home Page SEO'  },
];

function WebsiteSettingsAdmin() {
  const [active, setActive] = useState('branding');

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Admin</span>
          <h1 className="bio-adm-title">Website Settings</h1>
        </div>
        <div className="bio-adm-header-actions">
          <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Site</a>
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
        {active === 'branding' && <BrandingTab />}
        {active === 'seo'      && (
          <div style={{ padding: '1.5rem' }}>
            <h2 className="adm-section-title" style={{ marginBottom: '0.5rem' }}>Home Page SEO</h2>
            <p className="adm-hint" style={{ marginBottom: '1.25rem' }}>
              SEO metadata for the public home page — title, description, keywords, Open Graph image, and JSON-LD schema.
            </p>
            <SeoTab pageSlug="home" />
          </div>
        )}
      </div>
    </div>
  );
}

export default WebsiteSettingsAdmin;
