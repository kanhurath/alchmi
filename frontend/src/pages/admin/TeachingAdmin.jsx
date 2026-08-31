import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/teachingApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import './BiographyAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared field helpers (same as BiographyAdmin) ─────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows, hint }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows ? (
        <textarea className="adm-input adm-textarea" name={name} value={value || ''} rows={rows} onChange={onChange} />
      ) : (
        <input className="adm-input" type={type} name={name} value={value || ''} onChange={onChange} />
      )}
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

// ── Dynamic list helpers ───────────────────────────────────────────────────────

function DynamicPairs({ label, valPlaceholder = 'Value', keyPlaceholder = 'Label', items, onChange }) {
  const add    = () => onChange([...items, { val: '', key: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {items.map((item, i) => (
        <div key={i} className="adm-field-row" style={{ marginBottom: '0.4rem' }}>
          <input className="adm-input adm-input-sm" placeholder={valPlaceholder} value={item.val || ''} onChange={e => update(i, 'val', e.target.value)} />
          <input className="adm-input adm-input-sm" placeholder={keyPlaceholder} value={item.key || ''} onChange={e => update(i, 'key', e.target.value)} />
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add</button>
    </div>
  );
}

function DynamicList({ label, placeholder, hint, items, onChange }) {
  const add    = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it));
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {hint && <p className="adm-hint">{hint}</p>}
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <input className="adm-input adm-input-sm" style={{ flex: 1 }} placeholder={placeholder} value={item} onChange={e => update(i, e.target.value)} />
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add</button>
    </div>
  );
}

function DynamicParagraphs({ items, onChange }) {
  const add    = () => onChange([...items, { text: '', highlight: false }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
  return (
    <div className="adm-field">
      <label className="adm-label">Body Paragraphs</label>
      {items.map((item, i) => (
        <div key={i} className="adm-card-block" style={{ marginBottom: '0.5rem', gap: '0.5rem' }}>
          <textarea className="adm-input adm-textarea" rows={3} value={item.text || ''} placeholder="Paragraph text…"
            onChange={e => update(i, 'text', e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#5a4e3a', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!item.highlight} onChange={e => update(i, 'highlight', e.target.checked)} />
              Highlighted style
            </label>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add Paragraph</button>
    </div>
  );
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({ eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { api.getHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateHero(form); setSaved(true); } finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Teaching page.</p>
      <Field label="Eyebrow Label"          name="eyebrow"    value={form.eyebrow}    onChange={handle} />
      <Field label="Title (plain)"          name="title"      value={form.title}      onChange={handle} />
      <Field label="Title (italic / accent)" name="title_em"  value={form.title_em}   onChange={handle} />
      <Field label="Subtitle"               name="subtitle"   value={form.subtitle}   onChange={handle} rows={2} />
      <Field label="Breadcrumb Text"        name="breadcrumb" value={form.breadcrumb} onChange={handle} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Stats ────────────────────────────────────────────────────────────────

const EMPTY_STAT = { num: '', label: '', sort_order: 0 };

function StatsTab() {
  const [stats, setStats]   = useState([]);
  const [adding, setAdding] = useState(false);
  const [newS, setNewS]     = useState(EMPTY_STAT);
  const [editId, setEditId] = useState(null);

  const load = useCallback(() => api.getStats().then(setStats).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createStat(newS); setNewS(EMPTY_STAT); setAdding(false); load();
  };

  const saveEdit = async (s) => {
    await api.updateStat(s.id, s); setEditId(null); load();
  };

  const del = async (id) => {
    if (!confirm('Delete this stat?')) return;
    await api.deleteStat(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Stats Band</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Stat'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Stat</h3>
          <div className="adm-field-row">
            <Field label="Number / Value" name="num"   value={newS.num}   onChange={e => setNewS(s => ({ ...s, num: e.target.value }))} />
            <Field label="Label"          name="label" value={newS.label} onChange={e => setNewS(s => ({ ...s, label: e.target.value }))} />
            <Field label="Sort Order" name="sort_order" value={newS.sort_order} type="number" onChange={e => setNewS(s => ({ ...s, sort_order: e.target.value }))} />
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {stats.map(s => (
        <div key={s.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{s.num}</span>
            <span className="adm-card-title">{s.label}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === s.id ? null : s.id)}>
              {editId === s.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(s.id)}>Delete</button>
          </div>
          {editId === s.id && <StatEditForm stat={s} onSave={saveEdit} onCancel={() => setEditId(null)} />}
        </div>
      ))}
    </div>
  );
}

function StatEditForm({ stat, onSave, onCancel }) {
  const [form, setForm] = useState({ ...stat });
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-card-edit-form">
      <div className="adm-field-row">
        <Field label="Number / Value" name="num"        value={form.num}        onChange={handle} />
        <Field label="Label"          name="label"      value={form.label}      onChange={handle} />
        <Field label="Sort Order"     name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Tab: Teaching History ─────────────────────────────────────────────────────

const EMPTY_HISTORY = {
  role: '', period: '', location: '', org: '', featured: true,
  variant: '', plain: '', stats: [], bullets: [], tags: [], sort_order: 0,
};

function HistoryTab() {
  const [items, setItems]   = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newH, setNewH]     = useState(EMPTY_HISTORY);

  const load = useCallback(() => api.getHistory().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createHistory(newH); setNewH(EMPTY_HISTORY); setAdding(false); load();
  };
  const saveEdit = async (h) => {
    await api.updateHistory(h.id, h); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this history entry?')) return;
    await api.deleteHistory(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Teaching History</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New History Entry</h3>
          <HistoryForm form={newH} setForm={setNewH} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(h => (
        <div key={h.id} className="adm-card-block">
          <div className="adm-card-header">
            {h.featured && <span className="adm-card-num">Featured</span>}
            {h.variant && <span className="adm-card-num">{h.variant}</span>}
            <span className="adm-card-title">{h.org}</span>
            <span className="adm-hint">{h.role} · {h.period}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === h.id ? null : h.id)}>
              {editId === h.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(h.id)}>Delete</button>
          </div>
          {editId === h.id && (
            <div className="adm-card-edit-form">
              <HistoryForm form={h} setForm={(updater) => {
                setItems(items.map(it => it.id === h.id ? (typeof updater === 'function' ? updater(it) : updater) : it));
              }} />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === h.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HistoryForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <Field label="Role / Title"  name="role"     value={form.role}     onChange={handle} />
        <Field label="Period"        name="period"   value={form.period}   onChange={handle} />
        <Field label="Location"      name="location" value={form.location} onChange={handle} />
      </div>
      <Field label="Organisation / Institution" name="org" value={form.org} onChange={handle} />
      <div className="adm-field-row">
        <div className="adm-field">
          <label className="adm-label">Variant</label>
          <select className="adm-input" name="variant" value={form.variant || ''}
            onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}>
            <option value="">Default</option>
            <option value="accent">Accent (deep red)</option>
            <option value="gold">Gold</option>
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label">Featured (full width)?</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem', color: '#3a2e1e', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.featured}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
            Yes — spans both columns
          </label>
        </div>
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
      <Field label="Plain Paragraph (use instead of bullets)" name="plain" value={form.plain} onChange={handle} rows={3} />
      <DynamicPairs
        label="Stats (val / label pairs)"
        valPlaceholder="e.g. 162"
        keyPlaceholder="e.g. Participants"
        items={form.stats || []}
        onChange={v => setForm(f => ({ ...f, stats: v }))}
      />
      <DynamicList
        label="Bullet Points"
        placeholder="Bullet text (HTML allowed, e.g. <em>emphasis</em>)"
        hint="Supports inline HTML tags like <em>, <strong>."
        items={form.bullets || []}
        onChange={v => setForm(f => ({ ...f, bullets: v }))}
      />
      <DynamicList
        label="Tags"
        placeholder="Tag text"
        items={form.tags || []}
        onChange={v => setForm(f => ({ ...f, tags: v }))}
      />
    </>
  );
}

// ── Tab: Course Reports ───────────────────────────────────────────────────────

const EMPTY_COURSE = {
  tag: '', title: '', subtitle: '', date_text: '', location_text: '',
  rating: '', rating_label: '', pull_quote: '', pq_attr: '',
  specs: [], paragraphs: [], sort_order: 0,
};

function CoursesTab() {
  const [items, setItems]   = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newC, setNewC]     = useState(EMPTY_COURSE);

  const load = useCallback(() => api.getCourses().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createCourse(newC); setNewC(EMPTY_COURSE); setAdding(false); load();
  };
  const saveEdit = async (c) => {
    await api.updateCourse(c.id, c); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this course report?')) return;
    await api.deleteCourse(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Course Reports</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Course Report</h3>
          <CourseForm form={newC} setForm={setNewC} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(c => (
        <div key={c.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-title">{c.title}</span>
            <span className="adm-hint">{c.date_text}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === c.id ? null : c.id)}>
              {editId === c.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(c.id)}>Delete</button>
          </div>
          {editId === c.id && (
            <div className="adm-card-edit-form">
              <CourseForm form={c} setForm={(updater) => {
                setItems(items.map(it => it.id === c.id ? (typeof updater === 'function' ? updater(it) : updater) : it));
              }} />
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

function CourseForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Field label="Tag Line (e.g. IKS · Guest Faculty · JAIN University)" name="tag" value={form.tag} onChange={handle} />
      <Field label="Course Title" name="title" value={form.title} onChange={handle} />
      <Field label="Subtitle (italic)"  name="subtitle" value={form.subtitle} onChange={handle} />
      <div className="adm-field-row">
        <Field label="Date" name="date_text" value={form.date_text} onChange={handle} />
        <Field label="Location" name="location_text" value={form.location_text} onChange={handle} />
        <Field label="Rating (e.g. 4.62)" name="rating" value={form.rating} onChange={handle} />
        <Field label="Rating Label" name="rating_label" value={form.rating_label} onChange={handle} />
      </div>
      <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      <DynamicPairs
        label="Specs Grid (val / label pairs — leave empty to hide)"
        valPlaceholder="e.g. 162"
        keyPlaceholder="e.g. Participants"
        items={form.specs || []}
        onChange={v => setForm(f => ({ ...f, specs: v }))}
      />
      <Field label="Pull Quote" name="pull_quote" value={form.pull_quote} onChange={handle} rows={3} />
      <Field label="Pull Quote Attribution" name="pq_attr" value={form.pq_attr} onChange={handle} />
      <DynamicParagraphs
        items={form.paragraphs || []}
        onChange={v => setForm(f => ({ ...f, paragraphs: v }))}
      />
    </>
  );
}

// ── Tab: Student Feedback ─────────────────────────────────────────────────────

const EMPTY_FEEDBACK = { stars: 5, text: '', name: '', institution: '', av_class: 'av-a', sort_order: 0 };
const AV_CLASSES = ['av-a', 'av-b', 'av-c', 'av-d'];

function FeedbackTab() {
  const [items, setItems]   = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newF, setNewF]     = useState(EMPTY_FEEDBACK);

  const load = useCallback(() => api.getFeedback().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createFeedback(newF); setNewF(EMPTY_FEEDBACK); setAdding(false); load();
  };
  const saveEdit = async (f) => {
    await api.updateFeedback(f.id, f); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this feedback card?')) return;
    await api.deleteFeedback(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Student Feedback</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Feedback'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Feedback Card</h3>
          <FeedbackForm form={newF} setForm={setNewF} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(f => (
        <div key={f.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{'★'.repeat(f.stars || 5)}</span>
            <span className="adm-card-title">{f.name}</span>
            <span className="adm-hint" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.text?.slice(0, 80)}…
            </span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === f.id ? null : f.id)}>
              {editId === f.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(f.id)}>Delete</button>
          </div>
          {editId === f.id && (
            <div className="adm-card-edit-form">
              <FeedbackForm form={f} setForm={(updater) => {
                setItems(items.map(it => it.id === f.id ? (typeof updater === 'function' ? updater(it) : updater) : it));
              }} />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === f.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FeedbackForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Field label="Participant Name" name="name" value={form.name} onChange={handle} />
      <Field label="Institution / Programme" name="institution" value={form.institution} onChange={handle} rows={2} />
      <Field label="Feedback Text" name="text" value={form.text} onChange={handle} rows={5} />
      <div className="adm-field-row">
        <div className="adm-field">
          <label className="adm-label">Stars (1–5)</label>
          <input className="adm-input" type="number" min="1" max="5" name="stars" value={form.stars || 5}
            onChange={e => setForm(f => ({ ...f, stars: parseInt(e.target.value) || 5 }))} />
        </div>
        <div className="adm-field">
          <label className="adm-label">Avatar Colour</label>
          <select className="adm-input" name="av_class" value={form.av_class || 'av-a'}
            onChange={e => setForm(f => ({ ...f, av_class: e.target.value }))}>
            {AV_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
    </>
  );
}

// ── Tab: Core Themes ──────────────────────────────────────────────────────────

const EMPTY_THEME = { glyph: '', title: '', description: '', sort_order: 0 };

function ThemesTab() {
  const [items, setItems]   = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newT, setNewT]     = useState(EMPTY_THEME);

  const load = useCallback(() => api.getThemes().then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    await api.createTheme(newT); setNewT(EMPTY_THEME); setAdding(false); load();
  };
  const saveEdit = async (t) => {
    await api.updateTheme(t.id, t); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm('Delete this theme block?')) return;
    await api.deleteTheme(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Core Teaching Themes</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Theme'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Theme Block</h3>
          <ThemeForm form={newT} setForm={setNewT} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num" style={{ fontFamily: 'Noto Serif Devanagari, serif', fontSize: '1rem' }}>{t.glyph}</span>
            <span className="adm-card-title">{t.title}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === t.id ? null : t.id)}>
              {editId === t.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <ThemeForm form={t} setForm={(updater) => {
                setItems(items.map(it => it.id === t.id ? (typeof updater === 'function' ? updater(it) : updater) : it));
              }} />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary" onClick={() => saveEdit(items.find(it => it.id === t.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThemeForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <Field label="Glyph (Devanagari character)" name="glyph" value={form.glyph} onChange={handle}
          hint="E.g. धर्म, ज्ञान, दर्शन" />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>
      <Field label="Theme Title" name="title" value={form.title} onChange={handle} />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={3} />
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',     label: 'Hero' },
  { id: 'stats',    label: 'Stats' },
  { id: 'history',  label: 'History' },
  { id: 'courses',  label: 'Courses' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'themes',   label: 'Themes' },
  { id: 'extra',    label: 'Extra Sections' },
  { id: 'order',    label: 'Section Order' },
  { id: 'seo',      label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:     HeroTab,
  stats:    StatsTab,
  history:  HistoryTab,
  courses:  CoursesTab,
  feedback: FeedbackTab,
  themes:   ThemesTab,
  extra:    () => <SiteBlocksTab pageSlug="teaching" />,
  order:    () => <SectionOrderTab pageSlug="teaching" />,
  seo:      () => <SeoTab pageSlug="teaching" />,
};

function TeachingAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Teaching</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="teaching" />
          <a href="/teaching" target="_blank" rel="noreferrer" className="bio-adm-view-link">
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

export default TeachingAdmin;
