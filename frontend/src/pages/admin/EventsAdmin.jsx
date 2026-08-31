import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/eventsApi';
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

// [{icon, text}] pairs — used for upcoming event meta items
function DynamicMetaPairs({ items, onChange }) {
  const add    = () => onChange([...items, { icon: '◎', text: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));

  const ICONS = ['◎', '◈', '✦', '●', '▸', '—'];

  return (
    <div className="adm-field">
      <label className="adm-label">Meta Info Items</label>
      <p className="adm-hint">Each item shows as an icon + text in the event card (location, duration, speaker…).</p>
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
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add Item</button>
    </div>
  );
}

// Plain string list — used for completed event meta items
function DynamicList({ label, placeholder, items, onChange }) {
  const add    = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it));
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <input className="adm-input adm-input-sm" style={{ flex: 1 }} placeholder={placeholder}
            value={item} onChange={e => update(i, e.target.value)} />
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add</button>
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
      <p className="adm-hint">Controls the banner at the top of the Events page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={handle} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={handle} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={handle} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={handle} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={handle} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Upcoming Events ──────────────────────────────────────────────────────

const EMPTY_UPCOMING = {
  featured: false, day: '', month: '', year: '',
  type: '', title: '', description: '',
  meta: [], register_label: 'Register',
  spots_percent: null, spots_label: '', url: '', sort_order: 0,
};

function UpcomingTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newEv,  setNewEv]  = useState(EMPTY_UPCOMING);

  const load = useCallback(() => api.getUpcoming().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createUpcoming(newEv);
    setNewEv(EMPTY_UPCOMING); setAdding(false); load();
  };

  const saveEdit = async (ev) => {
    await api.updateUpcoming(ev.id, ev);
    setEditId(null); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this upcoming event?')) return;
    await api.deleteUpcoming(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Upcoming Events ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Upcoming Event</h3>
          <UpcomingForm form={newEv} setForm={setNewEv} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(ev => (
        <div key={ev.id} className="adm-card-block">
          <div className="adm-card-header">
            {ev.featured && <span className="adm-card-num">Featured</span>}
            <span className="adm-card-num">{ev.day} {ev.month} {ev.year}</span>
            <span className="adm-card-title">{ev.title}</span>
            <span className="adm-hint" style={{ flexShrink: 0 }}>{ev.type}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === ev.id ? null : ev.id)}>
              {editId === ev.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(ev.id)}>Delete</button>
          </div>
          {editId === ev.id && (
            <div className="adm-card-edit-form">
              <UpcomingForm
                form={ev}
                setForm={(updater) =>
                  setItems(items.map(it =>
                    it.id === ev.id
                      ? (typeof updater === 'function' ? updater(it) : updater)
                      : it
                  ))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveEdit(items.find(it => it.id === ev.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UpcomingForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const [showSpots, setShowSpots] = useState(form.spots_percent != null);

  return (
    <>
      <div className="adm-field">
        <label className="adm-label">Featured (spans full width)?</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: '#3a2e1e', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.featured}
            onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
          Yes — display as the large featured card
        </label>
      </div>

      <div className="adm-field-row">
        <Field label="Day"   name="day"   value={form.day}   onChange={handle} hint='e.g. "18"' />
        <Field label="Month" name="month" value={form.month} onChange={handle} hint='e.g. "Jul"' />
        <Field label="Year"  name="year"  value={form.year}  onChange={handle} hint='e.g. "2026"' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>

      <Field label="Event Type / Category" name="type" value={form.type} onChange={handle}
        hint='e.g. "Certificate Course · Open Enrolment"' />
      <Field label="Title" name="title" value={form.title} onChange={handle} />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={3} />

      <div className="adm-field-row">
        <Field label="Button Label" name="register_label" value={form.register_label} onChange={handle}
          hint='Displayed on the button — e.g. "Register", "Enquire". Clicking always opens the Send a Message form.' />
        <Field label="More Info URL (optional)" name="url" value={form.url} onChange={handle} type="url"
          hint="Stored for reference / future external link. The button itself now opens the contact form." />
      </div>

      <DynamicMetaPairs
        items={form.meta || []}
        onChange={v => setForm(f => ({ ...f, meta: v }))}
      />

      <div className="adm-field">
        <label className="adm-label">Show Availability Bar?</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: '#3a2e1e', cursor: 'pointer' }}>
          <input type="checkbox" checked={showSpots}
            onChange={e => {
              setShowSpots(e.target.checked);
              if (!e.target.checked) setForm(f => ({ ...f, spots_percent: null, spots_label: '' }));
              else setForm(f => ({ ...f, spots_percent: 50, spots_label: 'Limited seats' }));
            }} />
          Yes — show seats-remaining progress bar
        </label>
      </div>

      {showSpots && (
        <div className="adm-field-row">
          <div className="adm-field">
            <label className="adm-label">Filled % (0–100)</label>
            <input className="adm-input" type="number" min="0" max="100"
              name="spots_percent" value={form.spots_percent ?? 50}
              onChange={e => setForm(f => ({ ...f, spots_percent: parseInt(e.target.value) || 0 }))} />
            <p className="adm-hint">Width of the filled bar. E.g. 65 = 65% of seats taken.</p>
          </div>
          <Field label="Spots Label" name="spots_label" value={form.spots_label} onChange={handle}
            hint='e.g. "Limited seats · 35% remaining"' />
        </div>
      )}
    </>
  );
}

// ── Tab: Completed Events ─────────────────────────────────────────────────────

const EMPTY_COMPLETED = {
  day: '', month: '', type: '', title: '', meta: [], url: '', sort_order: 0,
};

function CompletedTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newEv,  setNewEv]  = useState(EMPTY_COMPLETED);

  const load = useCallback(() => api.getCompleted().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createCompleted(newEv);
    setNewEv(EMPTY_COMPLETED); setAdding(false); load();
  };

  const saveEdit = async (ev) => {
    await api.updateCompleted(ev.id, ev);
    setEditId(null); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this completed event?')) return;
    await api.deleteCompleted(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Completed Events ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Completed Event</h3>
          <CompletedForm form={newEv} setForm={setNewEv} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(ev => (
        <div key={ev.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{ev.day} {ev.month}</span>
            <span className="adm-card-title">{ev.title}</span>
            <span className="adm-hint" style={{ flexShrink: 0 }}>{ev.type}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === ev.id ? null : ev.id)}>
              {editId === ev.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(ev.id)}>Delete</button>
          </div>
          {editId === ev.id && (
            <div className="adm-card-edit-form">
              <CompletedForm
                form={ev}
                setForm={(updater) =>
                  setItems(items.map(it =>
                    it.id === ev.id
                      ? (typeof updater === 'function' ? updater(it) : updater)
                      : it
                  ))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveEdit(items.find(it => it.id === ev.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CompletedForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <Field label="Day"  name="day"   value={form.day}   onChange={handle} hint='e.g. "31"' />
        <Field label="Month / Year Label" name="month" value={form.month} onChange={handle}
          hint='e.g. "Jan 2026"' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
      <Field label="Event Type / Category" name="type" value={form.type} onChange={handle} />
      <Field label="Title" name="title" value={form.title} onChange={handle} />
      <Field label="Link URL" name="url" value={form.url} onChange={handle} type="url" />
      <DynamicList
        label="Meta Lines (venue, platform, notes…)"
        placeholder='e.g. "Chanakya University · Bengaluru"'
        items={form.meta || []}
        onChange={v => setForm(f => ({ ...f, meta: v }))}
      />
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',      label: 'Hero' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'extra',     label: 'Extra Sections' },
  { id: 'order',     label: 'Section Order' },
  { id: 'seo',       label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:      HeroTab,
  upcoming:  UpcomingTab,
  completed: CompletedTab,
  extra:     () => <SiteBlocksTab pageSlug="events" />,
  order:     () => <SectionOrderTab pageSlug="events" />,
  seo:       () => <SeoTab pageSlug="events" />,
};

function EventsAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Events</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="events" />
          <a href="/events" target="_blank" rel="noreferrer" className="bio-adm-view-link">
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

export default EventsAdmin;
