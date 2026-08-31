import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/galleryApi';
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
        : <input   className="adm-input" type={type}  name={name} value={value || ''} onChange={onChange} />
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

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const CATS = [
  { value: 'iks',       label: 'IKS Events'    },
  { value: 'talks',     label: 'Talks & Panels' },
  { value: 'workshops', label: 'Workshops'      },
  { value: 'portraits', label: 'Portraits'      },
];

function resolveThumb(image_url) {
  if (!image_url) return null;
  return image_url.startsWith('http') ? image_url : `${SERVER_URL}${image_url}`;
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
      <p className="adm-hint">Controls the banner at the top of the Gallery page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={h} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={h} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={h} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={h} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={h} />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Images ───────────────────────────────────────────────────────────────

const EMPTY_IMG = { cat: 'iks', caption: '', sort_order: 0 };

function ImagesTab() {
  const [images,      setImages]      = useState([]);
  const [editId,      setEditId]      = useState(null);
  const [adding,      setAdding]      = useState(false);
  const [newImg,      setNewImg]      = useState(EMPTY_IMG);
  const [newFile,     setNewFile]     = useState(null);
  const [newPreview,  setNewPreview]  = useState(null);

  const load = useCallback(() => api.getImages().then(setImages).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const handleNewFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
  };

  const saveNew = async () => {
    const created = await api.createImage(newImg);
    if (newFile && created?.id) await api.uploadImage(created.id, newFile);
    setNewImg(EMPTY_IMG); setNewFile(null); setNewPreview(null);
    setAdding(false); load();
  };

  const saveEdit = async (img) => {
    await api.updateImage(img.id, { cat: img.cat, caption: img.caption, sort_order: img.sort_order });
    setEditId(null); load();
  };

  const handleImageReplace = async (id, file) => {
    const result = await api.uploadImage(id, file);
    setImages(imgs => imgs.map(img => img.id === id ? { ...img, image_url: result.image_url } : img));
    load();
    return result;
  };

  const del = async (id) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    await api.deleteImage(id); load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Gallery Images ({images.length})</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewFile(null); setNewPreview(null); }}>
          {adding ? 'Cancel' : '+ Upload Image'}
        </button>
      </div>
      <p className="adm-hint">
        Images uploaded here appear on the Gallery page and override the bundled static images.
        The static images remain as a fallback if the server is unavailable.
      </p>

      {/* ── ADD FORM ── */}
      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">Upload New Image</h3>
          <ImageMetaForm form={newImg} setForm={setNewImg} />

          <div className="adm-field">
            <label className="adm-label">Image File (JPG, PNG, WEBP — max 10 MB)</label>
            <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
              {newPreview && (
                <img src={newPreview} alt="Preview"
                  style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div>
                <input type="file" accept="image/*" className="adm-file" onChange={handleNewFile} />
                {!newPreview && <p className="adm-hint">Select an image file to preview before uploading.</p>}
              </div>
            </div>
          </div>

          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}
              disabled={!newFile}>
              Upload &amp; Add
            </button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
            {!newFile && <span className="adm-hint">Select an image file first.</span>}
          </div>
        </div>
      )}

      {/* ── IMAGE LIST ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {images.map(img => (
          <ImageCard
            key={img.id}
            img={img}
            editId={editId}
            setEditId={setEditId}
            onSave={saveEdit}
            onReplace={handleImageReplace}
            onDelete={del}
            setImages={setImages}
          />
        ))}
      </div>
    </div>
  );
}

function ImageMetaForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field">
        <label className="adm-label">Category</label>
        <select className="adm-input" name="cat" value={form.cat || 'iks'}
          onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
          {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <Row>
        <Field label="Caption"    name="caption"    value={form.caption}    onChange={h} hint='e.g. "IKS APEX Meet 2026"' />
        <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
    </>
  );
}

function ImageCard({ img, editId, setEditId, onSave, onReplace, onDelete, setImages }) {
  const [form, setForm]         = useState({ cat: img.cat, caption: img.caption, sort_order: img.sort_order });
  const [uploading, setUploading] = useState(false);
  const thumb = resolveThumb(img.image_url);

  useEffect(() => {
    setForm({ cat: img.cat, caption: img.caption, sort_order: img.sort_order });
  }, [img.cat, img.caption, img.sort_order]);

  const handleReplace = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { await onReplace(img.id, file); } finally { setUploading(false); }
  };

  const isEditing = editId === img.id;

  return (
    <div className="adm-card-block" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Thumbnail */}
      {thumb
        ? <img src={thumb} alt={img.caption}
            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }} />
        : <div style={{ width: '100%', height: '140px', background: '#f0ece4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a8e78', fontSize: '0.75rem' }}>
            No image uploaded
          </div>
      }

      {/* Info row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="adm-card-num">{CATS.find(c => c.value === img.cat)?.label || img.cat}</span>
        <span className="adm-card-title" style={{ flex: 1, fontSize: '0.82rem' }}>{img.caption}</span>
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="adm-save-bar" style={{ paddingTop: 0 }}>
          <button className="adm-btn adm-btn-sm" onClick={() => setEditId(img.id)}>Edit</button>
          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => onDelete(img.id)}>Delete</button>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <>
          <ImageMetaForm form={form} setForm={setForm} />

          <div className="adm-field">
            <label className="adm-label">Replace Image</label>
            <input type="file" accept="image/*" className="adm-file" onChange={handleReplace} />
            {uploading && <p className="adm-hint">Uploading…</p>}
          </div>

          <div className="adm-save-bar" style={{ paddingTop: 0 }}>
            <button className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={() => onSave({ ...img, ...form })}>Save</button>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(null)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',   label: 'Hero'   },
  { id: 'images', label: 'Images' },
  { id: 'extra',  label: 'Extra Sections' },
  { id: 'order',  label: 'Section Order' },
  { id: 'seo',    label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:   HeroTab,
  images: ImagesTab,
  extra:  () => <SiteBlocksTab pageSlug="gallery" />,
  order:  () => <SectionOrderTab pageSlug="gallery" />,
  seo:    () => <SeoTab pageSlug="gallery" />,
};

function GalleryAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Gallery</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="gallery" />
          <a href="/gallery" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
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

export default GalleryAdmin;
