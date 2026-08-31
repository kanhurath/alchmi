import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/workshopsApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import './BiographyAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows, hint }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows
        ? <textarea className="adm-input adm-textarea" name={name} value={value || ''} rows={rows} onChange={onChange} />
        : <input   className="adm-input" type={type} name={name} value={value || ''} onChange={onChange} />
      }
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function SaveBar({ onSave, saving, saved }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span className="adm-saved-msg">✓ Saved</span>}
    </div>
  );
}

// [{icon, text}] pairs for workshop card specs
function DynamicSpecPairs({ items, onChange }) {
  const ICONS = ['◎', '◈', '✦', '△', '●', '▸'];
  const add    = () => onChange([...items, { icon: '◎', text: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
  return (
    <div className="adm-field">
      <label className="adm-label">Spec Items (icon + text)</label>
      <p className="adm-hint">Displayed as icon–text rows inside the card (location, duration, capacity…).</p>
      {items.map((item, i) => (
        <div key={i} className="adm-field-row" style={{ marginBottom: '0.4rem' }}>
          <div className="adm-field" style={{ maxWidth: '90px', flex: 'none' }}>
            <select className="adm-input adm-input-sm" value={item.icon || '◎'}
              onChange={e => update(i, 'icon', e.target.value)}>
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
          <input className="adm-input adm-input-sm" style={{ flex: 1 }}
            placeholder="e.g. Online · Zoom"
            value={item.text || ''}
            onChange={e => update(i, 'text', e.target.value)} />
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add Spec</button>
    </div>
  );
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm]     = useState({ eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { api.getHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateHero(form); setSaved(true); } finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Workshops page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={handle} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={handle} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={handle} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={handle} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={handle} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Intro Band ───────────────────────────────────────────────────────────

function IntroTab() {
  const [form, setForm]     = useState({ eyebrow: '', title: '', title_em: '', description: '', btn_label: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { api.getIntro().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateIntro(form); setSaved(true); } finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Intro Band</h2>
      <p className="adm-hint">The introductory block that appears directly below the hero.</p>
      <Field label="Eyebrow / Label" name="eyebrow"     value={form.eyebrow}     onChange={handle}
        hint='e.g. "Learning by Doing"' />
      <Field label="Title (plain)"   name="title"       value={form.title}       onChange={handle} />
      <Field label="Title (italic)"  name="title_em"    value={form.title_em}    onChange={handle} />
      <Field label="Description"     name="description" value={form.description} onChange={handle} rows={4} />
      <Field label="Button Label"    name="btn_label"   value={form.btn_label}   onChange={handle}
        hint='e.g. "Book a Session"' />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Filters ──────────────────────────────────────────────────────────────

const EMPTY_FILTER = { key: '', label: '', sort_order: 0 };

function FiltersTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newF,   setNewF]   = useState(EMPTY_FILTER);

  const load = useCallback(() => api.getFilters().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createFilter(newF); setNewF(EMPTY_FILTER); setAdding(false); load();
  };
  const saveEdit = async (f) => {
    await api.updateFilter(f.id, { key: f.key_name, label: f.label, sort_order: f.sort_order });
    setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this filter? Cards using this key will still work but won\'t match any filter button.')) return;
    await api.deleteFilter(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Filter Buttons</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Filter'}
        </button>
      </div>
      <p className="adm-hint">
        The "All Programs" button is always shown first. Add the other category buttons here.
        Each filter's <strong>Key</strong> must match the category keys on program cards (e.g. <code>corporate</code>, <code>iks</code>).
      </p>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Filter</h3>
          <div className="adm-field-row">
            <Field label="Key (lowercase, no spaces)" name="key" value={newF.key}
              onChange={e => setNewF(f => ({ ...f, key: e.target.value }))}
              hint='e.g. "corporate" — must match card category keys' />
            <Field label="Display Label" name="label" value={newF.label}
              onChange={e => setNewF(f => ({ ...f, label: e.target.value }))}
              hint='e.g. "Corporate"' />
            <Field label="Sort Order" name="sort_order" value={newF.sort_order} type="number"
              onChange={e => setNewF(f => ({ ...f, sort_order: e.target.value }))} />
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(f => (
        <div key={f.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{f.key_name}</span>
            <span className="adm-card-title">{f.label}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === f.id ? null : f.id)}>
              {editId === f.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(f.id)}>Delete</button>
          </div>
          {editId === f.id && (
            <div className="adm-card-edit-form">
              <div className="adm-field-row">
                <Field label="Key" name="key_name" value={f.key_name}
                  onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, key_name: e.target.value } : it))} />
                <Field label="Display Label" name="label" value={f.label}
                  onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, label: e.target.value } : it))} />
                <Field label="Sort Order" name="sort_order" value={f.sort_order} type="number"
                  onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, sort_order: e.target.value } : it))} />
              </div>
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(f)}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Program Cards ────────────────────────────────────────────────────────

const EMPTY_CARD = {
  featured: false, cat_keys: '', glyph: '', format: '',
  tag: '', title: '', description: '', specs: [],
  audience: '', cta_label: 'Enquire', url: '', sort_order: 0,
};

function CardsTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newC,   setNewC]   = useState(EMPTY_CARD);

  const load = useCallback(() => api.getCards().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createCard(newC); setNewC(EMPTY_CARD); setAdding(false); load();
  };
  const saveEdit = async (c) => {
    await api.updateCard(c.id, c); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this program card?')) return;
    await api.deleteCard(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Program Cards ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Program'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Program Card</h3>
          <CardForm form={newC} setForm={setNewC} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(c => (
        <div key={c.id} className="adm-card-block">
          <div className="adm-card-header">
            {c.featured && <span className="adm-card-num">Featured</span>}
            <span className="adm-card-num" style={{ fontFamily: 'Noto Serif Devanagari, serif' }}>{c.glyph}</span>
            <span className="adm-card-title">{c.title}</span>
            <span className="adm-hint" style={{ flexShrink: 0 }}>{c.format}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === c.id ? null : c.id)}>
              {editId === c.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(c.id)}>Delete</button>
          </div>
          {editId === c.id && (
            <div className="adm-card-edit-form">
              <CardForm
                form={c}
                setForm={(updater) =>
                  setItems(items.map(it =>
                    it.id === c.id
                      ? (typeof updater === 'function' ? updater(it) : updater)
                      : it
                  ))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveEdit(items.find(it => it.id === c.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CardForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field">
        <label className="adm-label">Featured (full-width card)?</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: '#3a2e1e', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.featured}
            onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
          Yes — display as the wide featured card at the top
        </label>
      </div>

      <div className="adm-field-row">
        <Field label="Glyph (Devanagari)" name="glyph"  value={form.glyph}  onChange={handle}
          hint='e.g. "ज्ञान", "धर्म"' />
        <Field label="Format Label"       name="format" value={form.format} onChange={handle}
          hint='e.g. "Certificate Course"' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>

      <Field label="Category Keys (space-separated, must match filter keys)"
        name="cat_keys" value={form.cat_keys} onChange={handle}
        hint='e.g. "iks open" — each word must match a filter key from the Filters tab' />

      <Field label="Tag Line" name="tag" value={form.tag} onChange={handle}
        hint='e.g. "IKS Education · Open Enrolment"' />
      <Field label="Title" name="title" value={form.title} onChange={handle} />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={4} />

      <div className="adm-field-row">
        <Field label="Audience" name="audience" value={form.audience} onChange={handle}
          hint='e.g. "For CXOs · Senior Leadership"' />
        <Field label="CTA Button Label" name="cta_label" value={form.cta_label} onChange={handle}
          hint='Displayed on the button — e.g. "Register Now", "Enquire". Clicking always opens the Send a Message form.' />
        <Field label="More Info URL (optional)" name="url" value={form.url} onChange={handle} type="url"
          hint="Stored for reference / future external link. The CTA button itself now opens the contact form." />
      </div>

      <DynamicSpecPairs
        items={form.specs || []}
        onChange={v => setForm(f => ({ ...f, specs: v }))}
      />
    </>
  );
}

// ── Tab: Retreats ─────────────────────────────────────────────────────────────

const EMPTY_RETREAT = { numeral: '', title: '', sub: '', description: '', footer: '', sort_order: 0 };

function RetreatsTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newR,   setNewR]   = useState(EMPTY_RETREAT);

  const load = useCallback(() => api.getRetreats().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createRetreat(newR); setNewR(EMPTY_RETREAT); setAdding(false); load();
  };
  const saveEdit = async (r) => {
    await api.updateRetreat(r.id, r); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this retreat?')) return;
    await api.deleteRetreat(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Residential Retreats ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Retreat'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Retreat</h3>
          <RetreatForm form={newR} setForm={setNewR} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(r => (
        <div key={r.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{r.numeral}</span>
            <span className="adm-card-title">{r.title}</span>
            <span className="adm-hint" style={{ flexShrink: 0 }}>{r.sub}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === r.id ? null : r.id)}>
              {editId === r.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(r.id)}>Delete</button>
          </div>
          {editId === r.id && (
            <div className="adm-card-edit-form">
              <RetreatForm
                form={r}
                setForm={(updater) =>
                  setItems(items.map(it =>
                    it.id === r.id
                      ? (typeof updater === 'function' ? updater(it) : updater)
                      : it
                  ))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveEdit(items.find(it => it.id === r.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RetreatForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <Field label="Numeral" name="numeral" value={form.numeral} onChange={handle}
          hint='e.g. "i.", "ii."' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
      <Field label="Title"       name="title"       value={form.title}       onChange={handle} />
      <Field label="Sub-heading" name="sub"         value={form.sub}         onChange={handle}
        hint='e.g. "For CXOs & Boards · 2–5 Days"' />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={3} />
      <Field label="Footer Note" name="footer"      value={form.footer}      onChange={handle}
        hint='e.g. "Annual offering · Limited to 18 participants"' />
    </>
  );
}

// ── Tab: Testimonials ─────────────────────────────────────────────────────────

const EMPTY_TESTIMONIAL = { quote: '', name: '', role: '', sort_order: 0 };

function TestimonialsTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newT,   setNewT]   = useState(EMPTY_TESTIMONIAL);

  const load = useCallback(() => api.getTestimonials().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createTestimonial(newT); setNewT(EMPTY_TESTIMONIAL); setAdding(false); load();
  };
  const saveEdit = async (t) => {
    await api.updateTestimonial(t.id, t); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    await api.deleteTestimonial(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Testimonials ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Testimonial'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Testimonial</h3>
          <TestimonialForm form={newT} setForm={setNewT} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-title">{t.name}</span>
            <span className="adm-hint" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.quote?.slice(0, 80)}…
            </span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === t.id ? null : t.id)}>
              {editId === t.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <TestimonialForm
                form={t}
                setForm={(updater) =>
                  setItems(items.map(it =>
                    it.id === t.id
                      ? (typeof updater === 'function' ? updater(it) : updater)
                      : it
                  ))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveEdit(items.find(it => it.id === t.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TestimonialForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Field label="Quote" name="quote" value={form.quote} onChange={handle} rows={4} />
      <div className="adm-field-row">
        <Field label="Name"       name="name"       value={form.name}       onChange={handle} />
        <Field label="Role / Institution" name="role" value={form.role} onChange={handle} />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',         label: 'Hero' },
  { id: 'intro',        label: 'Intro' },
  { id: 'filters',      label: 'Filters' },
  { id: 'cards',        label: 'Programs' },
  { id: 'retreats',     label: 'Retreats' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'extra',        label: 'Extra Sections' },
  { id: 'order',        label: 'Section Order' },
  { id: 'seo',          label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:         HeroTab,
  intro:        IntroTab,
  filters:      FiltersTab,
  cards:        CardsTab,
  retreats:     RetreatsTab,
  testimonials: TestimonialsTab,
  extra:        () => <SiteBlocksTab pageSlug="workshops" />,
  order:        () => <SectionOrderTab pageSlug="workshops" />,
  seo:          () => <SeoTab pageSlug="workshops" />,
};

function WorkshopsAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Workshops &amp; Retreats</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="workshops" />
          <a href="/workshops" target="_blank" rel="noreferrer" className="bio-adm-view-link">
          ↗ View Page
        </a>
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

export default WorkshopsAdmin;
