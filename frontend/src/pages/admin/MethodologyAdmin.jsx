import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/methodologyApi';
import { SeoTab }          from './SeoTab';
import { SiteBlocksTab }   from './SiteBlocksTab';
import { SectionOrderTab } from './SectionOrderTab';
import { PublishToggle }   from '../../components/admin/PublishToggle';
import { GraphicField }    from '../../components/admin/GraphicField';
import './BiographyAdmin.css';

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, rows, hint, placeholder }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows
        ? <textarea className="adm-input adm-textarea" name={name} value={value || ''} rows={rows} onChange={onChange} placeholder={placeholder} />
        : <input className="adm-input" type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} />
      }
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span className="adm-saved-msg">✓ Saved</span>}
      {error && <span style={{ color: '#c0392b', fontSize: '0.85rem', marginLeft: '1rem' }}>{error}</span>}
    </div>
  );
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form,   setForm]   = useState({ eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getMethodologyHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveMethodologyHero(form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Methodology page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={handle} placeholder="e.g. Methodology" />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={handle} placeholder="e.g. Our" />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={handle} placeholder="e.g. Frameworks" />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={handle} rows={3} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={handle} placeholder="e.g. Methodology" />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Framework form (add / edit) ───────────────────────────────────────────────

const IMAGE_KEYS = [
  { value: 'dharmic_enterprise',  label: 'Dharmic Enterprise (triangle + circle)' },
  { value: 'dharmic_innovation',  label: 'Dharmic Innovation (concentric circles)' },
  { value: 'dharmic_design',      label: 'Dharmic Design (grid + square)' },
  { value: 'dharmic_leadership',  label: 'Dharmic Leadership (person silhouette)' },
];

function parseChecklist(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function checklistToText(items) {
  return items.map(i => `${i.title} :: ${i.desc || ''}`).join('\n');
}

function textToChecklist(text) {
  return text.split('\n').map(line => {
    const [title, ...rest] = line.split('::');
    return { title: (title || '').trim(), desc: rest.join('::').trim() };
  }).filter(i => i.title);
}

function FrameworkForm({ initial, frameworkId, onSave, onCancel, saving, onGraphicUploaded }) {
  const [form, setForm] = useState({
    label: initial.label || '',
    title: initial.title || '',
    body: initial.body || '',
    checklistText: checklistToText(parseChecklist(initial.checklist)),
    image_key: initial.image_key || 'dharmic_enterprise',
    bg: initial.bg || 'white',
    layout_reverse: initial.layout_reverse ? '1' : '0',
    graphic_type: initial.graphic_type || 'svg_preset',
    graphic_url:  initial.graphic_url  || '',
    graphic_svg:  initial.graphic_svg  || '',
    graphic_html: initial.graphic_html || '',
  });

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const patchGraphic = patch => setForm(f => ({ ...f, ...patch }));

  const handleGraphicUpload = async (file) => {
    if (!frameworkId) throw new Error('Save the framework first, then upload a graphic.');
    const result = await api.uploadFrameworkGraphic(frameworkId, file);
    patchGraphic({ graphic_type: 'image', graphic_url: result.url });
    onGraphicUploaded?.();
    return result;
  };

  const submit = () => {
    onSave({
      label: form.label,
      title: form.title,
      body: form.body,
      checklist: JSON.stringify(textToChecklist(form.checklistText)),
      image_key: form.image_key,
      bg: form.bg,
      layout_reverse: Number(form.layout_reverse),
      graphic_type: form.graphic_type,
      graphic_url:  form.graphic_url,
      graphic_svg:  form.graphic_svg,
      graphic_html: form.graphic_html,
    });
  };

  return (
    <div className="adm-section" style={{ background: '#fdf9f4', border: '1px solid rgba(184,146,42,0.2)', borderRadius: '6px', padding: '1.25rem', marginBottom: '1rem' }}>
      <Field label="Framework Label (e.g. Framework 01)" name="label" value={form.label} onChange={handle} placeholder="Framework 01" />
      <Field label="Title *"       name="title" value={form.title} onChange={handle} />
      <Field label="Body Text"     name="body"  value={form.body}  onChange={handle} rows={4} />
      <Field
        label="Checklist Items (one per line, format: Title :: Description)"
        name="checklistText"
        value={form.checklistText}
        onChange={handle}
        rows={5}
        hint='Leave empty for no checklist. Example: "Profit with purpose :: A core purpose beyond profit."'
      />

      {/* Graphic */}
      <GraphicField
        label="Framework Graphic (shown alongside the text)"
        presetLabel="Built-in decorative SVG (selected below)"
        form={form}
        onChange={patchGraphic}
        onUpload={handleGraphicUpload}
        uploadNote={!frameworkId ? 'Save the framework first, then upload a graphic.' : undefined}
      />

      {/* Only show image_key picker when using the preset */}
      {(form.graphic_type === 'svg_preset' || form.graphic_type === '') && (
        <div className="adm-field">
          <label className="adm-label">Preset SVG Style</label>
          <select className="adm-input" name="image_key" value={form.image_key} onChange={handle}>
            {IMAGE_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
      )}

      <div className="adm-field">
        <label className="adm-label">Background</label>
        <select className="adm-input" name="bg" value={form.bg} onChange={handle}>
          <option value="white">White / Cream</option>
          <option value="gray">Gray / Parchment</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="adm-field">
        <label className="adm-label">Layout</label>
        <select className="adm-input" name="layout_reverse" value={form.layout_reverse} onChange={handle}>
          <option value="0">Text left, Image right</option>
          <option value="1">Image left, Text right</option>
        </select>
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={submit} disabled={saving || !form.title}>
          {saving ? 'Saving…' : 'Save Framework'}
        </button>
        <button className="adm-btn" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Tab: Frameworks ───────────────────────────────────────────────────────────

function FrameworksTab() {
  const [frameworks, setFrameworks] = useState([]);
  const [adding,     setAdding]     = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const load = useCallback(() => {
    api.getMethodologyFrameworks().then(setFrameworks).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (form) => {
    setSaving(true); setError('');
    try {
      await api.createMethodologyFramework({ ...form, sort_order: frameworks.length + 1 });
      setAdding(false); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const update = async (form) => {
    if (!editing) { setError('Cannot save: framework has no ID. Please reload the page.'); return; }
    setSaving(true); setError('');
    try {
      await api.updateMethodologyFramework(editing, form);
      setEditing(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this framework?')) return;
    try { await api.deleteMethodologyFramework(id); load(); }
    catch (e) { setError(e.message); }
  };

  const BG_LABEL = { white: 'Cream', gray: 'Parchment', dark: 'Dark' };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Frameworks</h2>
      <p className="adm-hint">Manage the framework sections displayed on the page.</p>
      {error && <p style={{ color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}

      {frameworks.map(fw => (
        <div key={fw.id}>
          {editing === fw.id ? (
            <FrameworkForm initial={fw} frameworkId={fw.id} onSave={update} onCancel={() => setEditing(null)} saving={saving} onGraphicUploaded={load} />
          ) : (
            <div style={{ border: '1px solid rgba(184,146,42,0.2)', borderRadius: '4px', padding: '1rem 1.25rem', marginBottom: '0.75rem', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                {fw.label && <div style={{ fontSize: '0.72rem', fontFamily: 'Josefin Sans,sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4670a', marginBottom: '0.3rem' }}>{fw.label}</div>}
                <div style={{ fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: '#1a1208', marginBottom: '0.25rem' }}>{fw.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#7a6a55' }}>
                  BG: {BG_LABEL[fw.bg] || fw.bg} · Layout: {Number(fw.layout_reverse) ? 'Image left' : 'Text left'} · {fw.image_key}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="adm-btn" onClick={() => setEditing(fw.id)}>Edit</button>
                <button className="adm-btn" style={{ color: '#c0392b' }} onClick={() => remove(fw.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <FrameworkForm
          initial={{ label: `Framework 0${frameworks.length + 1}`, title: '', body: '', checklist: '[]', image_key: 'dharmic_enterprise', bg: 'white', layout_reverse: 0, graphic_type: 'svg_preset', graphic_url: '', graphic_svg: '', graphic_html: '' }}
          frameworkId={null}
          onSave={add}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      ) : (
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(true)} style={{ marginTop: '0.5rem' }}>
          + Add Framework
        </button>
      )}
    </div>
  );
}

// ── Tab: Explainer ────────────────────────────────────────────────────────────

function ExplainerTab() {
  const [form,   setForm]   = useState({
    h1: '', lede: '', h2: '', tagline: '', bullets: '',
    image_url: '', graphic_type: '', graphic_url: '', graphic_svg: '', graphic_html: '',
    h3_confession: '', body_confession: '', h3_quote: '', quote: '', body_quote: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getMethodologySection('explainer').then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const patchGraphic = patch => setForm(f => ({ ...f, ...patch }));

  const [legacyUploading, setLegacyUploading] = useState(false);
  const [legacyUploadError, setLegacyUploadError] = useState('');

  const handleImageUpload = async (file) => {
    const result = await api.uploadExplainerImage(file);
    patchGraphic({ graphic_type: 'image', graphic_url: result.url });
    return result;
  };

  const handleLegacyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLegacyUploading(true); setLegacyUploadError('');
    try {
      const { url } = await api.uploadExplainerImage(file);
      setForm(f => ({ ...f, image_url: url }));
    } catch (err) {
      setLegacyUploadError(err.message);
    } finally {
      setLegacyUploading(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveMethodologySection('explainer', form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Methodology Explainer</h2>
      <p className="adm-hint">The long-form text section below the framework rows.</p>
      <Field label="Main Heading (h1)"    name="h1"              value={form.h1}              onChange={handle} />
      <Field label="Lede / Intro"         name="lede"            value={form.lede}            onChange={handle} rows={3} />
      <Field label="Sub-heading (h2)"     name="h2"              value={form.h2}              onChange={handle} />
      <Field label="Tagline (italic)"     name="tagline"         value={form.tagline}         onChange={handle} rows={2} />
      <Field
        label="Bullet Points (one per line)"
        name="bullets"
        value={form.bullets}
        onChange={handle}
        rows={7}
        hint="Each line becomes a list item."
      />
      <GraphicField
        label="Section Image / Graphic (shown below the bullet list)"
        form={form}
        onChange={patchGraphic}
        onUpload={handleImageUpload}
      />
      {/* Legacy image field — shown only when graphic_type is empty (old / default records) */}
      {(!form.graphic_type || form.graphic_type === '') && (
        <div className="adm-field">
          <label className="adm-label">Legacy Image</label>
          {form.image_url && (
            <img
              src={form.image_url}
              alt="preview"
              style={{ display: 'block', maxWidth: 220, maxHeight: 140, objectFit: 'contain',
                       marginBottom: '0.5rem', border: '1px solid #e5d9c4', borderRadius: 4, background: '#fff' }}
            />
          )}
          <input
            className="adm-input"
            type="text"
            name="image_url"
            value={form.image_url || ''}
            onChange={handle}
            placeholder="https://… or upload below"
            style={{ marginBottom: '0.4rem' }}
          />
          <input type="file" accept="image/*" onChange={handleLegacyUpload} disabled={legacyUploading} />
          {legacyUploading   && <p className="adm-hint">Uploading…</p>}
          {legacyUploadError && <p className="adm-hint" style={{ color: '#c0392b' }}>{legacyUploadError}</p>}
          <p className="adm-hint">
            Paste an external URL or upload a file — both set the image source. To use SVG or HTML instead, switch the type selector above to a different option.
          </p>
        </div>
      )}
      <Field label="Section Heading 1 (h3)" name="h3_confession" value={form.h3_confession}  onChange={handle} placeholder="Confession time:" />
      <Field label="Body Text 1"          name="body_confession" value={form.body_confession} onChange={handle} rows={5} />
      <Field label="Section Heading 2 (h3)" name="h3_quote"     value={form.h3_quote}        onChange={handle} placeholder="Favorite quote:" />
      <Field label="Pull Quote"           name="quote"           value={form.quote}           onChange={handle} />
      <Field label="Body Text 2"          name="body_quote"      value={form.body_quote}      onChange={handle} rows={5} />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: CTA Band ─────────────────────────────────────────────────────────────

function CtaTab() {
  const [form,   setForm]   = useState({ heading: '', desc: '', btn1_text: '', btn1_link: '', btn2_text: '', btn2_link: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getMethodologySection('cta').then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveMethodologySection('cta', form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">CTA Band</h2>
      <p className="adm-hint">The dark closing banner at the bottom of the page.</p>
      <Field label="Heading"       name="heading"   value={form.heading}   onChange={handle} rows={2} />
      <Field label="Description"   name="desc"      value={form.desc}      onChange={handle} rows={2} />
      <Field label="Button 1 Text" name="btn1_text" value={form.btn1_text} onChange={handle} placeholder="Book a Discovery Session" />
      <Field label="Button 1 Link" name="btn1_link" value={form.btn1_link} onChange={handle} placeholder="/connect" />
      <Field label="Button 2 Text" name="btn2_text" value={form.btn2_text} onChange={handle} placeholder="See the Services" />
      <Field label="Button 2 Link" name="btn2_link" value={form.btn2_link} onChange={handle} placeholder="/services" />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PAGE_TABS = [
  { id: 'hero',       label: 'Hero Section'  },
  { id: 'frameworks', label: 'Frameworks'    },
  { id: 'explainer',  label: 'Explainer'     },
  { id: 'cta',        label: 'CTA Band'      },
  { id: 'seo',        label: 'SEO'           },
  { id: 'blocks',     label: 'Blocks'        },
  { id: 'order',      label: 'Section Order' },
];

function MethodologyAdmin() {
  const [active, setActive] = useState('hero');

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Methodology</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="methodology" />
          <a href="/methodology" target="_blank" rel="noreferrer" className="bio-adm-view-link">
            ↗ View Page
          </a>
        </div>
      </div>

      <div className="bio-adm-tabs" role="tablist">
        {PAGE_TABS.map(t => (
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
        {active === 'hero'       && <HeroTab />}
        {active === 'frameworks' && <FrameworksTab />}
        {active === 'explainer'  && <ExplainerTab />}
        {active === 'cta'        && <CtaTab />}
        {active === 'seo'        && <SeoTab pageSlug="methodology" />}
        {active === 'blocks'     && <SiteBlocksTab page="methodology" />}
        {active === 'order'      && <SectionOrderTab pageSlug="methodology" />}
      </div>
    </div>
  );
}

export default MethodologyAdmin;
