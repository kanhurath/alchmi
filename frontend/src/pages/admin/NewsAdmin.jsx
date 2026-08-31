import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/newsApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import './BiographyAdmin.css';
import './NewsAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows, hint, placeholder }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows
        ? <textarea
            className="adm-input adm-textarea"
            name={name}
            value={value || ''}
            rows={rows}
            onChange={onChange}
            placeholder={placeholder}
          />
        : <input
            className="adm-input"
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
          />
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
      {error && <span className="adm-error-msg">{error}</span>}
    </div>
  );
}

// ── HERO TAB ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getHero().then(setForm).catch(() => {});
  }, []);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      await api.updateHero(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Page Introduction</h2>
      <Field label="Eyebrow Text"  name="eyebrow"     value={form.eyebrow}     onChange={set} placeholder="Updates & Reflections"
        hint="Small label that appears above the page title in the hero." />
      <Field label="Title"         name="title"       value={form.title}       onChange={set} placeholder="News &" />
      <Field label="Title Italic"  name="title_em"    value={form.title_em}    onChange={set} placeholder="Insights"
        hint="The italic coloured part of the title." />
      <Field label="Subtitle"      name="description" value={form.description} onChange={set} rows={3}
        hint="Description shown beneath the title in the hero section." />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── ARTICLE FORM ──────────────────────────────────────────────────────────────

const EMPTY_ARTICLE = {
  is_featured: 0,
  source_name: 'LinkedIn · Post',
  source_icon: 'in',
  source_icon_color: '#0a66c2',
  pub_date: '',
  tags: '',
  categories: '',
  title: '',
  body: '',
  pull_quote: '',
  meta_text: '',
  read_more_label: 'Read Full Post',
  read_more_url: '',
  image_url: '',
  sort_order: 0,
  is_active: 1,
};

function ArticleForm({ initial, onSave, onCancel }) {
  const [form,      setForm]      = useState({ ...EMPTY_ARTICLE, ...initial });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(api.resolveUploadUrl(initial?.image_url || ''));
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const onFileChange = (e) => {
    const file = e.target.files[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm(f => ({ ...f, image_url: '' }));
  };

  const submit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    setSaving(true); setError('');
    try {
      await onSave(form, imageFile);
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="news-article-form">
      <div className="news-form-header">
        <h3 className="adm-section-title" style={{ margin: 0 }}>
          {initial?.id ? 'Edit Article' : 'New Article'}
        </h3>
        <button className="adm-btn adm-btn-sm" onClick={onCancel}>✕ Cancel</button>
      </div>

      {error && <p className="adm-error-msg" style={{ padding: '0.5rem 0' }}>{error}</p>}

      <div className="news-form-grid">
        <div className="news-form-col">
          <Field label="Title *" name="title" value={form.title} onChange={set} />
          <div className="adm-field">
            <label className="adm-label">Body (HTML)</label>
            <textarea
              className="adm-input adm-textarea"
              name="body"
              value={form.body || ''}
              rows={6}
              onChange={set}
              placeholder="<p>First paragraph…</p><p>Second paragraph…</p>"
            />
            <p className="adm-hint">Supports basic HTML: &lt;p&gt;, &lt;em&gt;, &lt;strong&gt;. Paragraphs in &lt;p&gt; tags.</p>
          </div>
          <Field label="Pull Quote" name="pull_quote" value={form.pull_quote} onChange={set} rows={2}
            hint="Optional highlighted quote shown between body paragraphs." />
        </div>

        <div className="news-form-col">
          <Field label="Source Name"  name="source_name" value={form.source_name} onChange={set} placeholder="LinkedIn · Post" />
          <div className="adm-field-row" style={{ gap: '1rem' }}>
            <Field label="Source Icon" name="source_icon" value={form.source_icon} onChange={set} placeholder="in" />
            <div className="adm-field" style={{ flex: '0 0 160px' }}>
              <label className="adm-label">Icon Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="color" name="source_icon_color" value={form.source_icon_color || '#0a66c2'}
                  onChange={set} style={{ width: 36, height: 36, border: 'none', cursor: 'pointer' }} />
                <input className="adm-input adm-input-sm" name="source_icon_color" value={form.source_icon_color || ''}
                  onChange={set} placeholder="#0a66c2" style={{ flex: 1 }} />
              </div>
            </div>
          </div>
          <Field label="Date" name="pub_date" value={form.pub_date} onChange={set} placeholder="April 14, 2026" />
          <Field label="Tags" name="tags" value={form.tags} onChange={set}
            placeholder="Dharma,IKS,Education" hint="Comma-separated. Shown as badge labels on the card." />
          <Field label="Categories" name="categories" value={form.categories} onChange={set}
            placeholder="dharma iks events" hint="Space-separated filter slugs (must match Filter slugs)." />
          <Field label="Meta Text"  name="meta_text" value={form.meta_text} onChange={set} placeholder="Jeppiaar University, Chennai" />
          <Field label="Read More Label" name="read_more_label" value={form.read_more_label} onChange={set} />
          <Field label="Read More URL"   name="read_more_url"   value={form.read_more_url}   onChange={set} type="url" />
          <Field label="Sort Order" name="sort_order" value={String(form.sort_order || 0)} onChange={set} type="number" />
          <div className="adm-field" style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" name="is_featured" checked={!!form.is_featured} onChange={set} />
              <span className="adm-label" style={{ margin: 0 }}>Featured card (dark style, shown first)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={set} />
              <span className="adm-label" style={{ margin: 0 }}>Active (visible on site)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="adm-field">
        <label className="adm-label">Card Image</label>
        {imagePreview && (
          <div style={{ marginBottom: '0.75rem' }}>
            <img
              src={imagePreview}
              alt="Card image preview"
              style={{ width: '100%', maxWidth: 480, aspectRatio: '640/220', objectFit: 'cover', borderRadius: 6, display: 'block' }}
            />
            <button
              type="button"
              className="adm-btn adm-btn-sm adm-btn-danger"
              style={{ marginTop: '0.4rem' }}
              onClick={removeImage}
            >
              Remove Image
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="adm-input"
          onChange={onFileChange}
          style={{ paddingTop: '0.4rem' }}
        />
        <p className="adm-hint">
          Upload a card image (JPG, PNG, WebP). Leave blank to use a built-in decorative placeholder.
          Recommended size: 640×220 px (or 640×260 for featured).
        </p>
      </div>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update Article' : 'Create Article'}
        </button>
        <button className="adm-btn" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

// ── ARTICLES TAB ──────────────────────────────────────────────────────────────

function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null); // null | 'new' | article
  const [toast,    setToast]    = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setArticles(await api.getArticles()); }
    catch (e) { showToast('Load failed: ' + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form, imageFile) => {
    let article;
    if (form.id) {
      article = await api.updateArticle(form.id, form);
      showToast('Article updated');
    } else {
      article = await api.createArticle(form);
      showToast('Article created');
    }
    if (imageFile && article?.id) {
      await api.uploadArticleImage(article.id, imageFile);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      await api.deleteArticle(id);
      showToast('Article deleted');
      load();
    } catch (e) { showToast('Error: ' + e.message); }
  };

  const move = async (id, dir) => {
    const list = [...articles];
    const idx  = list.findIndex(a => a.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    const reordered = list.map((a, i) => ({ ...a, sort_order: i }));
    setArticles(reordered);
    try { await api.reorderArticles(reordered.map(a => ({ id: a.id, sort_order: a.sort_order }))); }
    catch (e) { showToast('Reorder failed: ' + e.message); load(); }
  };

  if (editing) {
    return (
      <div className="adm-section">
        <ArticleForm
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
        {toast && <div className="news-toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="adm-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>News Articles</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditing('new')}>+ New Article</button>
      </div>

      {loading && <p className="adm-hint">Loading…</p>}

      {!loading && articles.length === 0 && (
        <div className="news-empty-state">
          <p>No articles yet.</p>
          <button className="adm-btn adm-btn-primary" onClick={() => setEditing('new')}>+ Create First Article</button>
        </div>
      )}

      {articles.map((a, i) => (
        <div key={a.id} className={`news-article-row${a.is_featured ? ' featured' : ''}${!a.is_active ? ' inactive' : ''}`}>
          <div className="news-article-row-order">
            <button className="adm-btn adm-btn-sm" onClick={() => move(a.id, -1)} disabled={i === 0}>↑</button>
            <button className="adm-btn adm-btn-sm" onClick={() => move(a.id, 1)}  disabled={i === articles.length - 1}>↓</button>
          </div>
          <div className="news-article-row-info">
            <div className="news-article-row-title">
              {a.is_featured ? <span className="news-badge-featured">Featured</span> : null}
              {!a.is_active  ? <span className="news-badge-draft">Draft</span> : null}
              {a.title}
            </div>
            <div className="news-article-row-meta">
              {a.source_name} · {a.pub_date || 'No date'}
              {a.categories ? ` · [${a.categories}]` : ''}
            </div>
          </div>
          <div className="news-article-row-actions">
            <button className="adm-btn adm-btn-sm" onClick={() => setEditing(a)}>Edit</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(a.id)}>Delete</button>
          </div>
        </div>
      ))}

      {toast && <div className="news-toast">{toast}</div>}
    </div>
  );
}

// ── FILTERS TAB ───────────────────────────────────────────────────────────────

function FiltersTab() {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [newFilter, setNew]   = useState({ label: '', slug: '' });
  const [toast, setToast]     = useState('');
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setFilters(await api.getFilters()); }
    catch (e) { showToast('Load failed: ' + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newFilter.label.trim() || !newFilter.slug.trim()) return showToast('Label and slug are required');
    try {
      await api.createFilter({ ...newFilter, sort_order: filters.length });
      setNew({ label: '', slug: '' });
      setAdding(false);
      load();
    } catch (e) { showToast('Error: ' + e.message); }
  };

  const update = async (id) => {
    try {
      await api.updateFilter(id, editForm);
      setEditId(null);
      load();
    } catch (e) { showToast('Error: ' + e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this filter category?')) return;
    try { await api.deleteFilter(id); load(); }
    catch (e) { showToast('Error: ' + e.message); }
  };

  return (
    <div className="adm-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="adm-section-title" style={{ margin: 0 }}>Filter Categories</h2>
          <p className="adm-hint" style={{ marginTop: '0.25rem' }}>
            These appear as filter buttons on the News page. The <strong>slug</strong> must match the <strong>categories</strong> field in articles.
          </p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Filter'}
        </button>
      </div>

      {adding && (
        <div className="news-filter-add">
          <input className="adm-input adm-input-sm" placeholder="Label (e.g. IKS)"
            value={newFilter.label} onChange={e => setNew(f => ({ ...f, label: e.target.value }))} style={{ flex: 1 }} />
          <input className="adm-input adm-input-sm" placeholder="Slug (e.g. iks)"
            value={newFilter.slug}  onChange={e => setNew(f => ({ ...f, slug:  e.target.value.toLowerCase().replace(/\s+/g, '-') }))} style={{ flex: 1 }} />
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={create}>Add</button>
        </div>
      )}

      {loading && <p className="adm-hint">Loading…</p>}

      {filters.map(f => (
        <div key={f.id} className="news-filter-row">
          {editId === f.id ? (
            <>
              <input className="adm-input adm-input-sm" value={editForm.label || ''} onChange={e => setEditForm(x => ({ ...x, label: e.target.value }))} style={{ flex: 1 }} />
              <input className="adm-input adm-input-sm" value={editForm.slug  || ''} onChange={e => setEditForm(x => ({ ...x, slug:  e.target.value }))} style={{ flex: 1 }} />
              <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => update(f.id)}>Save</button>
              <button className="adm-btn adm-btn-sm" onClick={() => setEditId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span className="news-filter-label">{f.label}</span>
              <span className="news-filter-slug">{f.slug}</span>
              <button className="adm-btn adm-btn-sm" onClick={() => { setEditId(f.id); setEditForm(f); }}>Edit</button>
              <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(f.id)}>Delete</button>
            </>
          )}
        </div>
      ))}

      {toast && <div className="news-toast">{toast}</div>}
    </div>
  );
}

// ── SIDEBAR TAB ───────────────────────────────────────────────────────────────

function SidebarTab() {
  const [profile,    setProfile]    = useState({});
  const [newsletter, setNewsletter] = useState({});
  const [saving,     setSaving]     = useState('');
  const [saved,      setSaved]      = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    api.getSidebar().then(rows => {
      rows.forEach(r => {
        if (r.block_key === 'profile')    setProfile(r);
        if (r.block_key === 'newsletter') setNewsletter(r);
      });
    }).catch(() => {});
  }, []);

  const saveBlock = async (key, data, setState) => {
    setSaving(key); setSaved(''); setError('');
    try {
      const updated = await api.updateSidebar(key, data);
      setState(updated);
      setSaved(key);
      setTimeout(() => setSaved(''), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(''); }
  };

  const setP = (e) => setProfile(f => ({ ...f, [e.target.name]: e.target.value }));
  const setN = (e) => setNewsletter(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      {/* Profile card */}
      <div className="adm-section" style={{ marginBottom: '2rem' }}>
        <h2 className="adm-section-title">Profile Card (Sidebar)</h2>
        <p className="adm-hint">The dark "Follow Along" card at the top of the sidebar.</p>
        <Field label="Block Title"  name="title"     value={profile.title}     onChange={setP} placeholder="Follow Along" />
        <Field label="Name"         name="name_text" value={profile.name_text} onChange={setP} placeholder="Vinay Kulkarni" />
        <Field label="Role / Tagline" name="role_text" value={profile.role_text} onChange={setP} />
        <Field label="CTA Label"    name="cta_label" value={profile.cta_label} onChange={setP} placeholder="View LinkedIn Activity" />
        <Field label="CTA URL"      name="cta_url"   value={profile.cta_url}   onChange={setP} type="url" />
        <SaveBar
          onSave={() => saveBlock('profile', profile, setProfile)}
          saving={saving === 'profile'}
          saved={saved === 'profile'}
          error={saved !== 'profile' && error ? error : ''}
        />
      </div>

      {/* Newsletter block */}
      <div className="adm-section">
        <h2 className="adm-section-title">Newsletter Block (Sidebar)</h2>
        <p className="adm-hint">The "Dharmic Ideas & Insights" block at the bottom of the sidebar.</p>
        <Field label="Block Title" name="title"     value={newsletter.title}     onChange={setN} placeholder="Dharmic Ideas & Insights" />
        <Field label="Body Text"   name="body_text" value={newsletter.body_text} onChange={setN} rows={3} />
        <Field label="CTA Label"   name="cta_label" value={newsletter.cta_label} onChange={setN} placeholder="Subscribe on LinkedIn" />
        <Field label="CTA URL"     name="cta_url"   value={newsletter.cta_url}   onChange={setN} type="url" />
        <SaveBar
          onSave={() => saveBlock('newsletter', newsletter, setNewsletter)}
          saving={saving === 'newsletter'}
          saved={saved === 'newsletter'}
          error={saved !== 'newsletter' && error ? error : ''}
        />
      </div>
    </div>
  );
}

// ── Main NewsAdmin ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',     label: 'Intro' },
  { id: 'articles', label: 'News' },
  { id: 'filters',  label: 'Filters' },
  { id: 'sidebar',  label: 'Sidebar' },
  { id: 'blocks',   label: 'Extra Sections' },
  { id: 'seo',      label: 'SEO' },
  { id: 'order',    label: 'Section Order' },
];

function NewsAdmin() {
  const [active, setActive] = useState('hero');

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">News & Insights</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="news" />
          <a href="/news" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
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
        {active === 'hero'     && <HeroTab />}
        {active === 'articles' && <ArticlesTab />}
        {active === 'filters'  && <FiltersTab />}
        {active === 'sidebar'  && <SidebarTab />}
        {active === 'blocks'   && <SiteBlocksTab page="news" />}
        {active === 'seo'      && <SeoTab pageSlug="news" />}
        {active === 'order'    && <SectionOrderTab page="news" />}
      </div>
    </div>
  );
}

export default NewsAdmin;
