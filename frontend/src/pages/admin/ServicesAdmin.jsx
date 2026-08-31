import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/servicesApi';
import { SeoTab }         from './SeoTab';
import { SiteBlocksTab }  from './SiteBlocksTab';
import { SectionOrderTab } from './SectionOrderTab';
import { PublishToggle }  from '../../components/admin/PublishToggle';
import { GraphicField }   from '../../components/admin/GraphicField';
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
    api.getServicesHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveServicesHero(form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Services page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={handle} placeholder="e.g. Services" />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={handle} placeholder="e.g. What We" />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={handle} placeholder="e.g. Offer" />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={handle} rows={3} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={handle} placeholder="e.g. Services" />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Service Cards ────────────────────────────────────────────────────────

function CardForm({ initial, cardId, onSave, onCancel, saving, onIconUploaded }) {
  const [form,         setForm]         = useState(initial);
  const [iconUploading, setIconUploading] = useState(false);
  const [iconError,    setIconError]    = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleIconFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !cardId) return;
    setIconUploading(true); setIconError('');
    try {
      const { url } = await api.uploadServiceCardIcon(cardId, file);
      setForm(f => ({ ...f, icon_type: 'image', icon_url: url, icon_svg: '' }));
      onIconUploaded?.();
    } catch (err) { setIconError(err.message); }
    finally { setIconUploading(false); }
  };

  return (
    <div className="adm-section" style={{ background: '#fdf9f4', border: '1px solid rgba(184,146,42,0.2)', borderRadius: '6px', padding: '1.25rem', marginBottom: '1rem' }}>
      <Field label="Card Title *"       name="title"        value={form.title}        onChange={handle} />
      <Field label="Description"        name="description"  value={form.description}  onChange={handle} rows={3} />
      <Field label="Discuss Link (URL)" name="discuss_link" value={form.discuss_link} onChange={handle} placeholder="/connect" />

      {/* Icon */}
      <div className="adm-field">
        <label className="adm-label">Icon Type</label>
        <select className="adm-input" name="icon_type" value={form.icon_type || 'none'}
          onChange={e => setForm(f => ({ ...f, icon_type: e.target.value }))}>
          <option value="none">None (default check icon)</option>
          <option value="image">Image Upload</option>
          <option value="svg">SVG Code</option>
        </select>
      </div>

      {form.icon_type === 'image' && (
        <div className="adm-field">
          <label className="adm-label">Icon Image</label>
          {form.icon_url && (
            <div style={{ marginBottom: '0.5rem' }}>
              <img src={form.icon_url} alt="icon preview" style={{ width: 48, height: 48, objectFit: 'contain', border: '1px solid #e5d9c4', borderRadius: 4, background: '#fff' }} />
            </div>
          )}
          {cardId
            ? <input type="file" accept="image/*" onChange={handleIconFile} disabled={iconUploading} />
            : <p className="adm-hint" style={{ color: '#8b4c0c' }}>Save the card first, then upload an icon.</p>
          }
          {iconUploading && <p className="adm-hint">Uploading…</p>}
          {iconError    && <p className="adm-hint" style={{ color: '#c0392b' }}>{iconError}</p>}
        </div>
      )}

      {form.icon_type === 'svg' && (
        <div className="adm-field">
          <label className="adm-label">SVG Code</label>
          <textarea className="adm-input adm-textarea" name="icon_svg" value={form.icon_svg || ''}
            rows={6} onChange={handle} placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">…</svg>' />
          <p className="adm-hint">Paste full SVG markup. It will be rendered inline on the card.</p>
        </div>
      )}

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)} disabled={saving || !form.title}>
          {saving ? 'Saving…' : 'Save Card'}
        </button>
        <button className="adm-btn" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
      </div>
    </div>
  );
}

function ServiceCardsTab() {
  const [cards,   setCards]   = useState([]);
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    api.getServicesCards().then(setCards).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (form) => {
    setSaving(true); setError('');
    try {
      await api.createServicesCard({ ...form, sort_order: cards.length });
      setAdding(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const update = async (form) => {
    setSaving(true); setError('');
    try {
      await api.updateServicesCard(editing, form);
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this service card?')) return;
    try { await api.deleteServicesCard(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Service Cards</h2>
      <p className="adm-hint">Manage the grid of service cards shown at the top of the Services page.</p>
      {error && <p style={{ color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}

      {cards.map(card => (
        <div key={card.id}>
          {editing === card.id ? (
            <CardForm
              initial={{ title: card.title, description: card.description, discuss_link: card.discuss_link, icon_type: card.icon_type || 'none', icon_url: card.icon_url || '', icon_svg: card.icon_svg || '' }}
              cardId={card.id}
              onSave={update}
              onCancel={() => setEditing(null)}
              saving={saving}
              onIconUploaded={load}
            />
          ) : (
            <div style={{ border: '1px solid rgba(184,146,42,0.2)', borderRadius: '4px', padding: '1rem 1.25rem', marginBottom: '0.75rem', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {/* Icon preview */}
                {card.icon_type === 'image' && card.icon_url && (
                  <img src={card.icon_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, marginTop: 2 }} />
                )}
                {card.icon_type === 'svg' && card.icon_svg && (
                  <div style={{ width: 36, height: 36, flexShrink: 0, color: '#d4670a' }}
                    dangerouslySetInnerHTML={{ __html: card.icon_svg }} />
                )}
                {(!card.icon_type || card.icon_type === 'none') && (
                  <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8a84b', fontSize: '1.2rem' }}>✓</div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: '#1a1208', marginBottom: '0.3rem' }}>{card.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#7a6a55', lineHeight: 1.5, maxWidth: '60ch' }}>{card.description}</div>
                  {card.discuss_link && card.discuss_link !== '#' && (
                    <div style={{ fontSize: '0.75rem', color: '#d4670a', marginTop: '0.25rem' }}>{card.discuss_link}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="adm-btn" onClick={() => setEditing(card.id)}>Edit</button>
                <button className="adm-btn" style={{ color: '#c0392b' }} onClick={() => remove(card.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <CardForm
          initial={{ title: '', description: '', discuss_link: '/connect', icon_type: 'none', icon_url: '', icon_svg: '' }}
          cardId={null}
          onSave={add}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      ) : (
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(true)} style={{ marginTop: '0.5rem' }}>
          + Add Service Card
        </button>
      )}
    </div>
  );
}

// ── Generic section tab (facilitation / workshops / retreats / industries) ────

function SectionTab({ sectionKey, title, pillsHint, withGraphic }) {
  const [form,   setForm]   = useState({ eyebrow: '', title: '', description: '', pills: '',
    graphic_type: '', graphic_url: '', graphic_svg: '', graphic_html: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getServicesSection(sectionKey).then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, [sectionKey]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const patchGraphic = patch => setForm(f => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveServicesSection(sectionKey, form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">{title}</h2>
      <Field label="Eyebrow Label" name="eyebrow"     value={form.eyebrow}     onChange={handle} />
      <Field label="Section Title" name="title"       value={form.title}       onChange={handle} />
      <Field label="Description"   name="description" value={form.description} onChange={handle} rows={3} />
      <Field
        label="Pills / Tags (one per line)"
        name="pills"
        value={form.pills}
        onChange={handle}
        rows={8}
        hint={pillsHint || 'Enter each tag on a new line.'}
      />
      {withGraphic && (
        <GraphicField
          label="Section Graphic (shown to the right of the text)"
          form={form}
          onChange={patchGraphic}
          onUpload={file => api.uploadSectionGraphic(sectionKey, file)}
        />
      )}
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Services Intro (replaces Long-form) ─────────────────────────────────

function IntroTab() {
  const [form,   setForm]   = useState({
    eyebrow: '', h1: '', lead_quote: '', h2: '',
    body1: '', body2: '', pull_out: '', body3: '', body4: '', closing_line: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getServicesSection('longform').then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveServicesSection('longform', form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Services Intro</h2>
      <p className="adm-hint">The prose section below the service category pills.</p>
      <Field label="Eyebrow Label"                    name="eyebrow"      value={form.eyebrow}      onChange={handle} placeholder="Services" />
      <Field label='Heading (h1 — e.g. "services")'  name="h1"           value={form.h1}           onChange={handle} />
      <Field label="Lead Quote (italic, left border)" name="lead_quote"   value={form.lead_quote}   onChange={handle} rows={3} hint='Shown with a saffron left border in italic. Include quotation marks if needed.' />
      <Field label='Sub-heading (h2)'                 name="h2"           value={form.h2}           onChange={handle} placeholder='how can we help you?' />
      <Field label="Body 1 (emphasis — darker, larger)" name="body1"      value={form.body1}        onChange={handle} rows={3} />
      <Field label="Body 2"                           name="body2"        value={form.body2}        onChange={handle} rows={4} />
      <Field label="Pull-out Quote (italic box)"      name="pull_out"     value={form.pull_out}     onChange={handle} rows={3} hint="Displayed in a highlighted italic box between paragraphs." />
      <Field label="Body 3"                           name="body3"        value={form.body3}        onChange={handle} rows={4} />
      <Field label="Body 4"                           name="body4"        value={form.body4}        onChange={handle} rows={3} />
      <Field label="Closing Line (below rule)"        name="closing_line" value={form.closing_line} onChange={handle} hint="Shown below a horizontal divider line." />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: C-Growth ─────────────────────────────────────────────────────────────

function CGrowthTab() {
  const [form, setForm] = useState({
    eyebrow: '', heading: '', desc: '',
    def_items: '',
    cta_text: '', cta_btn: '', cta_link: '',
    gluttons_eyebrow: '', gluttons_title: '', gluttons_tagline: '',
    gluttons_btn: '', gluttons_btn_link: '',
    graphic_type: '', graphic_url: '', graphic_svg: '', graphic_html: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getServicesSection('cgrowth').then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const patchGraphic = patch => setForm(f => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveServicesSection('cgrowth', form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">C-Growth Section</h2>
      <p className="adm-hint">The C-Growth wheel diagram and surrounding content. By default the built-in SVG wheel is shown — replace via the graphic field below.</p>

      <GraphicField
        label="Diagram Graphic (default: built-in SVG wheel)"
        form={form}
        onChange={patchGraphic}
        onUpload={file => api.uploadSectionGraphic('cgrowth', file)}
      />

      <Field label="Eyebrow Label"    name="eyebrow"  value={form.eyebrow}  onChange={handle} placeholder="Our framework" />
      <Field label="Heading (h3)"     name="heading"  value={form.heading}  onChange={handle} />
      <Field label="Description"      name="desc"     value={form.desc}     onChange={handle} rows={2} />

      <Field
        label="Definition Items (one per line: Letter :: Title :: Description)"
        name="def_items"
        value={form.def_items}
        onChange={handle}
        rows={10}
        hint="Format: C :: Customers :: Short description. The last item spans the full width and gets the accent badge colour."
      />

      <Field label="CTA Text (above button)"   name="cta_text" value={form.cta_text} onChange={handle} />
      <Field label="CTA Button Label"          name="cta_btn"  value={form.cta_btn}  onChange={handle} placeholder="Request the C-Growth Analysis™" />
      <Field label="CTA Button Link"           name="cta_link" value={form.cta_link} onChange={handle} placeholder="/connect" />

      <Field label="Closing Card Eyebrow"  name="gluttons_eyebrow"  value={form.gluttons_eyebrow}  onChange={handle} placeholder="Gluttons for problem solving" />
      <Field label="Closing Card Title"    name="gluttons_title"    value={form.gluttons_title}    onChange={handle} rows={2} />
      <Field label="Closing Card Tagline"  name="gluttons_tagline"  value={form.gluttons_tagline}  onChange={handle} />
      <Field label="Closing Button Label"  name="gluttons_btn"      value={form.gluttons_btn}      onChange={handle} placeholder="Start the conversation" />
      <Field label="Closing Button Link"   name="gluttons_btn_link" value={form.gluttons_btn_link} onChange={handle} placeholder="/connect" />

      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: CTA Band ─────────────────────────────────────────────────────────────

function CtaTab() {
  const [form,   setForm]   = useState({ eyebrow: '', heading: '', btn1_text: '', btn1_link: '', btn2_text: '', btn2_link: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getServicesSection('cta').then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try { await api.saveServicesSection('cta', form); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">CTA Band</h2>
      <p className="adm-hint">The dark closing banner at the bottom of the page.</p>
      <Field label="Eyebrow"        name="eyebrow"   value={form.eyebrow}   onChange={handle} placeholder="Not sure where to start?" />
      <Field label="Heading"        name="heading"   value={form.heading}   onChange={handle} rows={2} />
      <Field label="Button 1 Text"  name="btn1_text" value={form.btn1_text} onChange={handle} placeholder="Book a Discovery Session" />
      <Field label="Button 1 Link"  name="btn1_link" value={form.btn1_link} onChange={handle} placeholder="/connect" />
      <Field label="Button 2 Text"  name="btn2_text" value={form.btn2_text} onChange={handle} placeholder="Sign up for a 3C Analysis" />
      <Field label="Button 2 Link"  name="btn2_link" value={form.btn2_link} onChange={handle} placeholder="/connect" />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PAGE_TABS = [
  { id: 'hero',          label: 'Hero Section'    },
  { id: 'cards',         label: 'Service Cards'   },
  { id: 'facilitation',  label: 'Facilitation'    },
  { id: 'workshops',     label: 'Workshops'       },
  { id: 'retreats',      label: 'Retreats'        },
  { id: 'industries',    label: 'Industries'      },
  { id: 'longform',      label: 'Services Intro'  },
  { id: 'cgrowth',       label: 'C-Growth'        },
  { id: 'cta',           label: 'CTA Band'        },
  { id: 'seo',           label: 'SEO'             },
  { id: 'blocks',        label: 'Blocks'          },
  { id: 'order',         label: 'Section Order'   },
];

function ServicesAdmin() {
  const [active, setActive] = useState('hero');

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Services</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="services" />
          <a href="/services" target="_blank" rel="noreferrer" className="bio-adm-view-link">
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
        {active === 'hero'         && <HeroTab />}
        {active === 'cards'        && <ServiceCardsTab />}
        {active === 'facilitation' && <SectionTab sectionKey="facilitation" title="Facilitation Section" pillsHint="List the types of facilitation — one per line." withGraphic />}
        {active === 'workshops'    && <SectionTab sectionKey="workshops" title="Workshops Section" pillsHint="List workshop topics — one per line." />}
        {active === 'retreats'     && <SectionTab sectionKey="retreats" title="Retreats Section" pillsHint="List retreat themes — one per line." />}
        {active === 'industries'   && <SectionTab sectionKey="industries" title="Industries Section" pillsHint="List industries served — one per line." />}
        {active === 'longform'     && <IntroTab />}
        {active === 'cgrowth'      && <CGrowthTab />}
        {active === 'cta'          && <CtaTab />}
        {active === 'seo'          && <SeoTab pageSlug="services" />}
        {active === 'blocks'       && <SiteBlocksTab page="services" />}
        {active === 'order'        && <SectionOrderTab pageSlug="services" />}
      </div>
    </div>
  );
}

export default ServicesAdmin;
