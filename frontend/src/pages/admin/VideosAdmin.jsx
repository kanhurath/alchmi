import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/videosApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import './BiographyAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared helpers (same pattern as BiographyAdmin / TeachingAdmin) ───────────

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
          <input className="adm-input adm-input-sm" style={{ flex: 1 }} placeholder={placeholder}
            value={item} onChange={e => update(i, e.target.value)} />
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button className="adm-btn adm-btn-sm" onClick={add}>+ Add Tag</button>
    </div>
  );
}

// ── Thumbnail resolution (mirrors the frontend helper) ────────────────────────
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function resolveThumb(thumb_url) {
  if (!thumb_url) return null;
  return thumb_url.startsWith('http') ? thumb_url : `${SERVER_URL}${thumb_url}`;
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({ eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '' });
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
      <p className="adm-hint">Controls the banner at the top of the Videos page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={handle} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={handle} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={handle} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={handle} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={handle} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Sidebar ──────────────────────────────────────────────────────────────

function SidebarTab() {
  const [form, setForm] = useState({
    quote_text: '', quote_attr: '',
    invite_title: '', invite_text: '', invite_btn_label: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { api.getSidebar().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateSidebar(form); setSaved(true); } finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Sidebar</h2>

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Pull Quote</h3>
      <Field label="Quote Text"        name="quote_text" value={form.quote_text} onChange={handle} rows={3} />
      <Field label="Attribution"       name="quote_attr" value={form.quote_attr} onChange={handle}
        hint='e.g. "— Vinay Kulkarni"' />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Invite Block</h3>
      <Field label="Block Title"       name="invite_title"     value={form.invite_title}     onChange={handle} />
      <Field label="Body Text"         name="invite_text"      value={form.invite_text}      onChange={handle} rows={3} />
      <Field label="Button Label"      name="invite_btn_label" value={form.invite_btn_label} onChange={handle} />

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Videos ───────────────────────────────────────────────────────────────

const VIDEO_TYPES = ['Lecture', 'Podcast', 'Panel Discussion', 'Keynote', 'Talk', 'Interview'];
const EMPTY_VIDEO = {
  type: 'Lecture', title: '', description: '', date_text: '', host: '',
  watch_label: 'Watch', thumb_url: '', video_url: '', tags: [], sort_order: 0,
};

function VideosTab() {
  const [videos,  setVideos]  = useState([]);
  const [editId,  setEditId]  = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [newV,    setNewV]    = useState(EMPTY_VIDEO);
  const [newLogo, setNewLogo] = useState(null);
  const [newLogoPreview, setNewLogoPreview] = useState(null);

  const load = useCallback(() => api.getVideos().then(setVideos).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    const created = await api.createVideo(newV);
    if (newLogo && created?.id) await api.uploadThumb(created.id, newLogo);
    setNewV(EMPTY_VIDEO); setNewLogo(null); setNewLogoPreview(null);
    setAdding(false); load();
  };

  const saveEdit = async (v) => {
    await api.updateVideo(v.id, v);
    setEditId(null); load();
  };

  const handleThumbUpload = async (id, file) => {
    const { thumb_url } = await api.uploadThumb(id, file);
    setVideos(vs => vs.map(v => v.id === id ? { ...v, thumb_url } : v));
  };

  const del = async (id) => {
    if (!confirm('Delete this video?')) return;
    await api.deleteVideo(id); load();
  };

  const handleNewThumb = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setNewLogo(file);
    setNewLogoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Videos &amp; Talks ({videos.length})</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewLogo(null); setNewLogoPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Video'}
        </button>
      </div>

      {/* ── ADD FORM ── */}
      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Video</h3>
          <VideoForm form={newV} setForm={setNewV} />
          <div className="adm-field">
            <label className="adm-label">Thumbnail Image (optional — upload or set URL above)</label>
            <input type="file" accept="image/*" className="adm-file" onChange={handleNewThumb} />
            {newLogoPreview && (
              <img src={newLogoPreview} alt="Preview" className="adm-photo-preview"
                style={{ marginTop: '0.5rem', width: '160px', height: '90px', objectFit: 'cover' }} />
            )}
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── VIDEO LIST ── */}
      {videos.map(v => (
        <div key={v.id} className="adm-card-block">
          <div className="adm-card-header">
            {v.thumb_url && (
              <img src={resolveThumb(v.thumb_url)} alt=""
                style={{ width: '72px', height: '40px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
            )}
            <span className="adm-card-num">{v.type}</span>
            <span className="adm-card-title">{v.title}</span>
            <span className="adm-hint" style={{ flexShrink: 0 }}>{v.date_text}</span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === v.id ? null : v.id)}>
              {editId === v.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(v.id)}>Delete</button>
          </div>

          {editId === v.id && (
            <VideoEditBlock
              video={v}
              onSave={saveEdit}
              onCancel={() => setEditId(null)}
              onThumbUpload={handleThumbUpload}
              onChange={(updated) => setVideos(vs => vs.map(it => it.id === v.id ? updated : it))}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function VideoForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <div className="adm-field">
          <label className="adm-label">Type</label>
          <select className="adm-input" name="type" value={form.type || 'Lecture'}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {VIDEO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Custom…</option>
          </select>
          {form.type === '__custom__' && (
            <input className="adm-input" style={{ marginTop: '0.35rem' }}
              placeholder="Custom type" onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
          )}
        </div>
        <div className="adm-field">
          <label className="adm-label">Watch / Listen Label</label>
          <select className="adm-input" name="watch_label" value={form.watch_label || 'Watch'}
            onChange={e => setForm(f => ({ ...f, watch_label: e.target.value }))}>
            <option value="Watch">Watch</option>
            <option value="Listen">Listen</option>
          </select>
        </div>
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
      </div>

      <Field label="Title" name="title" value={form.title} onChange={handle} />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={3} />

      <div className="adm-field-row">
        <Field label="Date" name="date_text" value={form.date_text} onChange={handle}
          hint='e.g. "Apr 22, 2026"' />
        <Field label="Host / Channel" name="host" value={form.host} onChange={handle} />
      </div>

      <Field label="YouTube / Video URL" name="video_url" value={form.video_url} onChange={handle} type="url" />
      <Field label="Thumbnail URL (YouTube auto-thumb or external image URL)"
        name="thumb_url" value={form.thumb_url} onChange={handle} type="url"
        hint="Leave empty to upload a file. Format: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg" />

      <DynamicList
        label="Tags"
        placeholder="e.g. IKS"
        items={form.tags || []}
        onChange={v => setForm(f => ({ ...f, tags: v }))}
      />
    </>
  );
}

function VideoEditBlock({ video, onSave, onCancel, onThumbUpload, onChange }) {
  const [form, setForm]         = useState({ ...video });
  const [uploading, setUploading] = useState(false);

  const handleThumb = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { thumb_url } = await onThumbUpload(video.id, file);
      setForm(f => ({ ...f, thumb_url }));
    } finally { setUploading(false); }
  };

  return (
    <div className="adm-card-edit-form">
      <VideoForm form={form} setForm={setForm} />

      <div className="adm-field">
        <label className="adm-label">Upload Thumbnail (replaces URL above)</label>
        <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
          {resolveThumb(form.thumb_url) && (
            <img src={resolveThumb(form.thumb_url)} alt="Thumbnail"
              style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
          )}
          <div>
            <input type="file" accept="image/*" className="adm-file" onChange={handleThumb} />
            {uploading && <p className="adm-hint">Uploading…</p>}
            {form.thumb_url && <p className="adm-hint" style={{ marginTop: '0.35rem' }}>Current: {form.thumb_url}</p>}
          </div>
        </div>
      </div>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',    label: 'Hero' },
  { id: 'videos',  label: 'Videos' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'extra',   label: 'Extra Sections' },
  { id: 'order',   label: 'Section Order' },
  { id: 'seo',     label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:    HeroTab,
  videos:  VideosTab,
  sidebar: SidebarTab,
  extra:   () => <SiteBlocksTab pageSlug="videos" />,
  order:   () => <SectionOrderTab pageSlug="videos" />,
  seo:     () => <SeoTab pageSlug="videos" />,
};

function VideosAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Videos &amp; Talks</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="videos" />
          <a href="/videos" target="_blank" rel="noreferrer" className="bio-adm-view-link">
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

export default VideosAdmin;
