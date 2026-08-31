import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/testimonialsApi';
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

function Row({ children }) { return <div className="adm-field-row">{children}</div>; }

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

function useSave(apiFn) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const save = useCallback(async (data) => {
    setSaving(true); setSaved(false);
    try { await apiFn(data); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    finally { setSaving(false); }
  }, [apiFn]);
  return { save, saving, saved };
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({ eyebrow:'', title:'', title_em:'', subtitle:'', breadcrumb:'' });
  const { save, saving, saved } = useSave(api.updateHero);

  useEffect(() => { api.getHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Testimonials page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={h} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={h} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={h} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={h} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={h} />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Filters ──────────────────────────────────────────────────────────────

const EMPTY_FILTER = { key_name:'', label:'', sort_order: 0 };

function FiltersTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newF,   setNewF]   = useState(EMPTY_FILTER);

  const load = useCallback(() => api.getFilters().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew  = async () => { await api.createFilter(newF); setNewF(EMPTY_FILTER); setAdding(false); load(); };
  const saveEdit = async (f) => { await api.updateFilter(f.id, f); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete filter?')) return; await api.deleteFilter(id); load(); };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Filter Buttons ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Filter'}</button>
      </div>
      <p className="adm-hint">The "All" button is always shown first. Add the other category buttons here. Each <strong>Key</strong> must match the category keys on testimonial cards (e.g. <code>iks</code>, <code>corporate</code>).</p>

      {adding && (
        <div className="adm-card-block">
          <Row>
            <Field label="Key (lowercase)"  name="key_name"   value={newF.key_name}   onChange={e => setNewF(f => ({ ...f, key_name: e.target.value }))} hint='e.g. "iks"' />
            <Field label="Display Label"    name="label"      value={newF.label}      onChange={e => setNewF(f => ({ ...f, label: e.target.value }))} hint='e.g. "IKS Course"' />
            <Field label="Sort Order"       name="sort_order" value={newF.sort_order} onChange={e => setNewF(f => ({ ...f, sort_order: e.target.value }))} type="number" />
          </Row>
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
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === f.id ? null : f.id)}>{editId === f.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(f.id)}>Delete</button>
          </div>
          {editId === f.id && (
            <div className="adm-card-edit-form">
              <Row>
                <Field label="Key"           name="key_name"   value={f.key_name}   onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, key_name: e.target.value } : it))} />
                <Field label="Display Label" name="label"      value={f.label}      onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, label: e.target.value } : it))} />
                <Field label="Sort Order"    name="sort_order" value={f.sort_order} onChange={e => setItems(items.map(it => it.id === f.id ? { ...it, sort_order: e.target.value } : it))} type="number" />
              </Row>
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

// ── Tab: Featured Quote ───────────────────────────────────────────────────────

function FeaturedTab() {
  const [form, setForm] = useState({ quote:'', author:'', role:'', program:'' });
  const { save, saving, saved } = useSave(api.updateFeatured);

  useEffect(() => { api.getFeatured().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Featured Quote</h2>
      <p className="adm-hint">The large pull quote displayed above the testimonial cards grid.</p>
      <Field label="Quote Text"   name="quote"   value={form.quote}   onChange={h} rows={4} />
      <Row>
        <Field label="Author Name" name="author"  value={form.author}  onChange={h} />
        <Field label="Role / Title" name="role"   value={form.role}    onChange={h} />
        <Field label="Program Label" name="program" value={form.program} onChange={h} />
      </Row>
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Testimonial Cards ────────────────────────────────────────────────────

const EMPTY_CARD = { cat_keys:'', large: false, avatar:'', text:'', author:'', role:'', program:'', sort_order: 0 };

function CardsTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newC,   setNewC]   = useState(EMPTY_CARD);

  const load = useCallback(() => api.getCards().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew  = async () => { await api.createCard(newC); setNewC(EMPTY_CARD); setAdding(false); load(); };
  const saveEdit = async (c) => { await api.updateCard(c.id, c); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete this testimonial?')) return; await api.deleteCard(id); load(); };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Testimonial Cards ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Testimonial'}</button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Testimonial</h3>
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
            <span className="adm-card-num">{c.avatar}</span>
            <span className="adm-card-title">{c.author}</span>
            <span className="adm-hint" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.text?.slice(0, 70)}…
            </span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === c.id ? null : c.id)}>{editId === c.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(c.id)}>Delete</button>
          </div>
          {editId === c.id && (
            <div className="adm-card-edit-form">
              <CardForm
                form={c}
                setForm={(updater) => setItems(items.map(it => it.id === c.id ? (typeof updater === 'function' ? updater(it) : updater) : it))}
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === c.id))}>Save</button>
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
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Field label="Testimonial Text" name="text" value={form.text} onChange={h} rows={4} />
      <Row>
        <Field label="Author Name"  name="author"  value={form.author}  onChange={h} />
        <Field label="Avatar (1–2 initials)" name="avatar" value={form.avatar} onChange={h} hint='e.g. "C" or "JP"' />
      </Row>
      <Field label="Role / Organisation" name="role"    value={form.role}    onChange={h} />
      <Field label="Program Label"       name="program" value={form.program} onChange={h} hint='e.g. "IKS Certificate Course"' />
      <Row>
        <Field label="Category Keys (space-separated)" name="cat_keys" value={form.cat_keys} onChange={h}
          hint='e.g. "iks corporate" — must match filter key_names' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <div className="adm-field">
        <label className="adm-label">Large Card (spans extra height)?</label>
        <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.4rem', fontSize:'0.85rem', color:'#3a2e1e', cursor:'pointer' }}>
          <input type="checkbox" checked={!!form.large} onChange={e => setForm(f => ({ ...f, large: e.target.checked }))} />
          Yes — display as a taller featured card
        </label>
      </div>
    </>
  );
}

// ── Tab: Stats ────────────────────────────────────────────────────────────────

const EMPTY_STAT = { number:'', suffix:'', label:'', description:'', sort_order: 0 };

function StatsTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newS,   setNewS]   = useState(EMPTY_STAT);

  const load = useCallback(() => api.getStats().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew  = async () => { await api.createStat(newS); setNewS(EMPTY_STAT); setAdding(false); load(); };
  const saveEdit = async (s) => { await api.updateStat(s.id, s); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete stat?')) return; await api.deleteStat(id); load(); };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Stats Band ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Stat'}</button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <StatForm form={newS} setForm={setNewS} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(s => (
        <div key={s.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{s.number}{s.suffix}</span>
            <span className="adm-card-title">{s.label}</span>
            <span className="adm-hint">{s.description}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === s.id ? null : s.id)}>{editId === s.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(s.id)}>Delete</button>
          </div>
          {editId === s.id && (
            <div className="adm-card-edit-form">
              <StatForm
                form={s}
                setForm={(updater) => setItems(items.map(it => it.id === s.id ? (typeof updater === 'function' ? updater(it) : updater) : it))}
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === s.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <Row>
      <Field label="Number"      name="number"      value={form.number}      onChange={h} hint='e.g. "500"' />
      <Field label="Suffix"      name="suffix"      value={form.suffix}      onChange={h} hint='e.g. "+" or "★"' />
      <Field label="Label"       name="label"       value={form.label}       onChange={h} />
      <Field label="Description" name="description" value={form.description} onChange={h} hint='e.g. "Across all programs"' />
      <Field label="Sort Order"  name="sort_order"  value={form.sort_order}  onChange={h} type="number" />
    </Row>
  );
}

// ── Tab: Pull Quotes ──────────────────────────────────────────────────────────

const EMPTY_PQ = { program:'', avatar:'', text:'', author:'', role:'', sort_order: 0 };

function PullQuotesTab() {
  const [items,  setItems]  = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newPQ,  setNewPQ]  = useState(EMPTY_PQ);

  const load = useCallback(() => api.getPullQuotes().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew  = async () => { await api.createPullQuote(newPQ); setNewPQ(EMPTY_PQ); setAdding(false); load(); };
  const saveEdit = async (p) => { await api.updatePullQuote(p.id, p); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete pull quote?')) return; await api.deletePullQuote(id); load(); };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Pull Quotes ({items.length})</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Pull Quote'}</button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <PullQuoteForm form={newPQ} setForm={setNewPQ} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(p => (
        <div key={p.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{p.avatar}</span>
            <span className="adm-card-title">{p.author}</span>
            <span className="adm-hint" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.text?.slice(0, 70)}…
            </span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === p.id ? null : p.id)}>{editId === p.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(p.id)}>Delete</button>
          </div>
          {editId === p.id && (
            <div className="adm-card-edit-form">
              <PullQuoteForm
                form={p}
                setForm={(updater) => setItems(items.map(it => it.id === p.id ? (typeof updater === 'function' ? updater(it) : updater) : it))}
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === p.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PullQuoteForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Field label="Quote Text" name="text" value={form.text} onChange={h} rows={3} />
      <Row>
        <Field label="Author Name"         name="author"     value={form.author}     onChange={h} />
        <Field label="Avatar (1–2 chars)"  name="avatar"     value={form.avatar}     onChange={h} />
        <Field label="Program"             name="program"    value={form.program}    onChange={h} hint='e.g. "IKS Course"' />
        <Field label="Sort Order"          name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Role / Institution" name="role" value={form.role} onChange={h} />
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',       label: 'Hero'       },
  { id: 'filters',    label: 'Filters'    },
  { id: 'featured',   label: 'Featured'   },
  { id: 'cards',      label: 'Cards'      },
  { id: 'stats',      label: 'Stats'      },
  { id: 'pullquotes', label: 'Pull Quotes'},
];

const TAB_COMPONENTS = {
  hero:       HeroTab,
  filters:    FiltersTab,
  featured:   FeaturedTab,
  cards:      CardsTab,
  stats:      StatsTab,
  pullquotes: PullQuotesTab,
};

function TestimonialsAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Testimonials</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="testimonials" />
          <a href="/testimonials" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
        </div>
      </div>

      <div className="bio-adm-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={active === t.id}
            className={`bio-adm-tab${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}>
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

export default TestimonialsAdmin;
