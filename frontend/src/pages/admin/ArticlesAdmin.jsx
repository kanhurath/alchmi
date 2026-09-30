import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import * as api from '../../services/articlesApi';
const ArticleRichEditor = lazy(() => import('./ArticleRichEditor'));
import { SeoTab }          from './SeoTab';
import { SiteBlocksTab }   from './SiteBlocksTab';
import { SectionOrderTab } from './SectionOrderTab';
import { PublishToggle }   from '../../components/admin/PublishToggle';
import './BiographyAdmin.css';
import './ArticlesAdmin.css';

// ── Shared helpers ────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', rows, hint, placeholder, required }) {
  return (
    <div className="adm-field">
      <label className="adm-label">
        {label}{required && <span className="art-required">*</span>}
      </label>
      {rows
        ? <textarea className="adm-input adm-textarea" name={name} value={value || ''}
            rows={rows} onChange={onChange} placeholder={placeholder} />
        : <input className="adm-input" type={type} name={name} value={value || ''}
            onChange={onChange} placeholder={placeholder} />
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
      {saved  && <span className="adm-saved-msg">✓ Saved</span>}
      {error  && <span className="art-error-msg">{error}</span>}
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats,    setCats]    = useState([]);
  const [form,    setForm]    = useState({ name: '', slug: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    api.getAllCategories().then(setCats).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const autoSlug = (e) => {
    const name = e.target.value;
    setForm(f => ({
      ...f,
      name,
      slug: f.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const save = async () => {
    if (!form.name || !form.slug) return setError('Name and slug are required');
    setSaving(true); setError('');
    try {
      if (editing) await api.updateCategory(editing, form);
      else         await api.createCategory(form);
      setForm({ name: '', slug: '', description: '' });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const edit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  };

  const del = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.deleteCategory(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">{editing ? 'Edit Category' : 'Add Category'}</h2>

      <div className="art-form-grid">
        <Field label="Name" name="name" value={form.name}
          onChange={autoSlug} placeholder="Indian Knowledge Systems" required />
        <Field label="Slug" name="slug" value={form.slug}
          onChange={set} placeholder="iks"
          hint="URL-safe identifier used in filters" required />
      </div>
      <Field label="Description (optional)" name="description" value={form.description}
        onChange={set} rows={2} placeholder="Short description of this category" />

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Update Category' : 'Add Category'}
        </button>
        {editing && (
          <button className="adm-btn" onClick={() => {
            setEditing(null);
            setForm({ name: '', slug: '', description: '' });
          }}>
            Cancel
          </button>
        )}
        {error && <span className="art-error-msg">{error}</span>}
      </div>

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">All Categories</h3>

      {cats.length === 0 && (
        <p className="art-empty">No categories yet — add one above.</p>
      )}

      {cats.map(c => (
        <div key={c.id} className="art-cat-row">
          <div className="art-cat-info">
            <span className="art-cat-name">{c.name}</span>
            <code className="art-slug">{c.slug}</code>
            {c.count != null && <span className="art-count-badge">{c.count} articles</span>}
          </div>
          <div className="art-cat-actions">
            <button className="adm-btn adm-btn-sm" onClick={() => edit(c)}>Edit</button>
            <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(c.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Article Editor ────────────────────────────────────────────────────────────
const EMPTY = {
  slug: '', status: 'draft', is_featured: 1, title: '', excerpt: '', content: '',
  featured_image_url: '', author_name: 'Vinay Kulkarni',
  pub_date: '', pub_date_display: '', categories: '', tags: '',
  seo_title: '', meta_description: '', og_image_url: '', canonical_url: '',
  sort_order: 0,
};

const EDITOR_TABS = [
  { id: 'content',  label: 'Content'  },
  { id: 'image',    label: 'Image'    },
  { id: 'seo',      label: 'SEO'      },
  { id: 'settings', label: 'Settings' },
];

// MySQL DATE columns come back from mysql2 as JS Date objects which
// JSON-serialise to ISO strings like "2026-07-14T18:30:00.000Z".
// The <input type="date"> requires "YYYY-MM-DD", so normalise here.
function normalisePubDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toISOString().split('T')[0];
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function todayDisplay() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function autoMetaDesc(text) {
  const plain = stripHtml(text);
  return plain.length > 155 ? plain.slice(0, 152) + '...' : plain;
}

function ArticleEditor({ article, categories, onSave, onCancel }) {
  const isNew = !article?.id;
  const [form,    setForm]    = useState({
    ...EMPTY,
    ...article,
    pub_date:         isNew ? todayISO()     : normalisePubDate(article?.pub_date),
    pub_date_display: isNew ? todayDisplay() : (article?.pub_date_display || ''),
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(article?.featured_image_url || '');
  const [tab,     setTab]     = useState('content');

  const set = (e) => {
    const val = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const autoSlug = (e) => {
    const title = e.target.value;
    setForm(f => ({
      ...f,
      title,
      slug:             f.slug       || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      // Mirror seo_title while it is empty or still matches the previous title
      seo_title:        (!f.seo_title || f.seo_title === f.title) ? title : f.seo_title,
      // Seed meta_description from excerpt if it hasn't been filled yet
      meta_description: f.meta_description || autoMetaDesc(f.excerpt || ''),
    }));
  };

  const autoExcerpt = (e) => {
    const excerpt = e.target.value;
    setForm(f => {
      const prevAuto = autoMetaDesc(f.excerpt || '');
      return {
        ...f,
        excerpt,
        // Keep meta_description in sync while it still matches the auto-generated value
        meta_description: (!f.meta_description || f.meta_description === prevAuto)
          ? autoMetaDesc(excerpt)
          : f.meta_description,
      };
    });
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPrev(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!form.title) return setError('Title is required');
    setSaving(true); setSaved(false); setError('');
    try {
      let result = article?.id
        ? await api.updateArticle(article.id, form)
        : await api.createArticle(form);

      if (imgFile) {
        const res = await api.uploadArticleImage(result.id, imgFile);
        result = res.article;
        setForm(f => ({ ...f, featured_image_url: result.featured_image_url }));
        setImgPrev(api.resolveUploadUrl(result.featured_image_url));
        setImgFile(null);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSave?.(result);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      {/* Header */}
      <div className="art-editor-header">
        <h2 className="adm-section-title" style={{ margin: 0 }}>
          {article?.id ? 'Edit Article' : 'New Article'}
        </h2>
        <button className="adm-btn" onClick={onCancel}>← Back to List</button>
      </div>

      {/* Inner tab bar */}
      <div className="bio-adm-tabs" role="tablist" style={{ margin: '0 0 1.5rem' }}>
        {EDITOR_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`bio-adm-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'content' && (
        <div className="adm-section">
          <Field label="Title" name="title" value={form.title} onChange={autoSlug} required />
          <Field label="Slug" name="slug" value={form.slug} onChange={set}
            hint="URL path: /articles/your-slug" />
          <Field label="Excerpt / Introduction" name="excerpt" value={form.excerpt}
            onChange={autoExcerpt} rows={3}
            hint="Short summary shown in article listings. Can contain HTML." />
          <div className="adm-field">
            <label className="adm-label">Full Content</label>
            <Suspense fallback={<div style={{ padding: '1rem', color: '#999', fontSize: '0.85rem' }}>Loading editor…</div>}>
              <ArticleRichEditor
                value={form.content}
                onChange={(html) => setForm(f => ({ ...f, content: html }))}
                uploadUrl={api.getInlineImageUploadUrl()}
              />
            </Suspense>
            <p className="adm-hint">
              Use the toolbar to format text, insert images, tables, videos, code blocks, and more.
              Switch to <strong>Source</strong> view to edit raw HTML directly.
            </p>
          </div>
          <Field label="Author Name" name="author_name" value={form.author_name} onChange={set} />
          <div className="art-form-grid">
            <Field label="Publication Date" name="pub_date" value={form.pub_date}
              onChange={set} type="date" />
            <Field label="Display Date" name="pub_date_display" value={form.pub_date_display}
              onChange={set} placeholder="e.g. January 10, 2025"
              hint="Leave blank to auto-format from date above" />
          </div>
          <Field
            label="Categories (slugs, comma or space separated)"
            name="categories" value={form.categories} onChange={set}
            placeholder="iks dharma education"
            hint={`Available slugs: ${categories.map(c => c.slug).join(', ') || 'none yet — add categories first'}`}
          />
          <Field label="Tags (comma separated)" name="tags" value={form.tags}
            onChange={set} placeholder="Dharma, IKS, Education" />
        </div>
      )}

      {/* Image */}
      {tab === 'image' && (
        <div className="adm-section">
          {imgPrev && (
            <div className="art-img-preview">
              <img
                src={imgPrev.startsWith('blob:') ? imgPrev : api.resolveUploadUrl(imgPrev)}
                alt="Featured"
              />
            </div>
          )}
          <div className="adm-field">
            <label className="adm-label">Upload Image</label>
            <input type="file" accept="image/*" onChange={onFileChange} className="adm-file" />
            <p className="adm-hint">Max 10 MB · JPG, PNG, WebP. Recommended size: 1200 × 630 px.</p>
          </div>
          <Field label="Or paste an external image URL" name="featured_image_url"
            value={form.featured_image_url} onChange={(e) => {
              setForm(f => ({ ...f, featured_image_url: e.target.value }));
              setImgPrev(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            hint="Use this for images hosted on WordPress or another server." />
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="adm-section">
          <Field label="SEO Title" name="seo_title" value={form.seo_title} onChange={set}
            hint="Shown in browser tab and search results. Defaults to article title." />
          <Field label="Meta Description" name="meta_description" value={form.meta_description}
            onChange={set} rows={3}
            hint="150–160 characters for search snippets." />
          <Field label="OG Image URL" name="og_image_url" value={form.og_image_url}
            onChange={set} hint="Social share preview image. Defaults to featured image." />
          <Field label="Canonical URL" name="canonical_url" value={form.canonical_url}
            onChange={set}
            hint="Full URL of the original source if this is an imported / republished article (e.g. the WordPress post URL)." />
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="adm-section">
          <div className="adm-field">
            <label className="adm-label">Status</label>
            <select className="adm-input" name="status" value={form.status} onChange={set}
              style={{ maxWidth: 220 }}>
              <option value="draft">Draft (hidden from public)</option>
              <option value="published">Published (visible to all)</option>
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label">Featured Article</label>
            <label className="art-checkbox-label">
              <input
                type="checkbox"
                name="is_featured"
                checked={!!form.is_featured}
                onChange={set}
              />
              Mark as featured (appears at top of article listing)
            </label>
          </div>
          <Field label="Sort Order" name="sort_order" value={form.sort_order}
            onChange={set} type="number"
            hint="Lower numbers appear first within the same date." />
        </div>
      )}

      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Articles List Tab ─────────────────────────────────────────────────────────
function ArticlesListTab({ categories }) {
  const [articles,      setArticles]      = useState([]);
  const [editing,       setEditing]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [sortBy,        setSortBy]        = useState('date-desc');

  const load = useCallback(() => {
    setLoading(true);
    api.getAllArticles()
      .then(data => { setArticles(Array.isArray(data) ? data : []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!confirm('Delete this article permanently?')) return;
    try { await api.deleteArticle(id); load(); }
    catch (e) { setError(e.message); }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ── Filter + sort (all client-side) ────────────────────────────────────────
  const visible = articles
    .filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (a.title  || '').toLowerCase().includes(q) ||
          (a.slug   || '').toLowerCase().includes(q) ||
          (a.excerpt|| '').toLowerCase().includes(q) ||
          (a.tags   || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':  return new Date(a.pub_date || 0) - new Date(b.pub_date || 0);
        case 'title-asc': return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':return (b.title || '').localeCompare(a.title || '');
        case 'date-desc':
        default:          return new Date(b.pub_date || 0) - new Date(a.pub_date || 0);
      }
    });

  if (editing !== null) {
    return (
      <ArticleEditor
        article={editing}
        categories={categories}
        onSave={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="adm-section">
      <div className="art-list-header">
        <h2 className="adm-section-title">All Articles</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditing({})}>
          + New Article
        </button>
      </div>

      {/* Search & filter bar */}
      <div className="art-filter-bar">
        <input
          className="art-filter-search"
          type="text"
          placeholder="Search by title, slug, excerpt or tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="art-filter-controls">
          <select
            className="art-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            className="art-filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="title-asc">Title: A → Z</option>
            <option value="title-desc">Title: Z → A</option>
          </select>
          {(search || statusFilter !== 'all' || sortBy !== 'date-desc') && (
            <button
              className="art-filter-clear"
              onClick={() => { setSearch(''); setStatusFilter('all'); setSortBy('date-desc'); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <p className="art-filter-count">
        {visible.length} of {articles.length} article{articles.length !== 1 ? 's' : ''}
      </p>

      {error && <p className="art-error-msg">{error}</p>}
      {loading && <p className="art-loading">Loading articles…</p>}

      {!loading && articles.length === 0 && (
        <p className="art-empty">No articles yet — click "New Article" to get started.</p>
      )}

      {!loading && articles.length > 0 && visible.length === 0 && (
        <p className="art-empty">No articles match your search or filter.</p>
      )}

      {visible.map(a => (
        <div key={a.id} className={`art-article-row${a.status === 'draft' ? ' draft' : ''}`}>
          <div className="art-article-info">
            {a.is_featured ? <span className="art-featured-star">★</span> : null}
            <div>
              <div className="art-article-title">{a.title}</div>
              <div className="art-article-meta">
                <code className="art-slug">/articles/{a.slug}</code>
                <span className={`art-status ${a.status}`}>{a.status}</span>
                <span>{a.pub_date_display || fmtDate(a.pub_date)}</span>
              </div>
            </div>
          </div>
          <div className="art-article-actions">
            <button className="adm-btn adm-btn-sm" onClick={() => setEditing(a)}>Edit</button>
            <a className="adm-btn adm-btn-sm" href={`/articles/${a.slug}`}
              target="_blank" rel="noreferrer">View</a>
            <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(a.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hero Tab ──────────────────────────────────────────────────────────────────
function HeroTab() {
  const [form, setForm] = useState({
    eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.getArticlesHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      await api.saveArticlesHero(form);
      setSaved(true);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Articles page.</p>
      <Field label="Eyebrow Label"            name="eyebrow"    value={form.eyebrow}    onChange={handle} placeholder="e.g. Writing" />
      <Field label="Title (plain)"            name="title"      value={form.title}      onChange={handle} placeholder="e.g. Recent" />
      <Field label="Title (italic / accent)"  name="title_em"   value={form.title_em}   onChange={handle} placeholder="e.g. Articles" />
      <Field label="Subtitle"                 name="subtitle"   value={form.subtitle}   onChange={handle} rows={3} />
      <Field label="Breadcrumb Text"          name="breadcrumb" value={form.breadcrumb} onChange={handle} placeholder="e.g. Articles" />
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
function resolveAdminImg(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return SERVER_ORIGIN + url;
}
function fmtDatetime(s) {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Add Comment Modal ─────────────────────────────────────────────────────────
const EMPTY_COMMENT_FORM = {
  article_id:  '',
  author_name: 'Admin',
  status:      'approved',
  content:     '',
};

function AddCommentModal({ articles, preselectedId, onClose, onSaved }) {
  const [form,       setForm]       = useState({ ...EMPTY_COMMENT_FORM, article_id: preselectedId || '' });
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const fileRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImg = () => { setImgFile(null); setImgPreview(''); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async () => {
    if (!form.article_id) { setError('Please select an article.'); return; }
    if (!form.content.trim() && !imgFile) {
      setError('At least one of Comment or Image is required.');
      return;
    }
    setSaving(true); setError('');
    try {
      let image_url = '';
      if (imgFile) {
        const up = await api.uploadAdminCommentImage(form.article_id, imgFile);
        image_url = up.image_url || '';
      }
      await api.postAdminComment(form.article_id, {
        author_name: form.author_name.trim() || 'Admin',
        content:     form.content.trim(),
        image_url,
        status:      form.status,
      });
      onSaved(form.article_id);
      onClose();
    } catch (e) { setError(e.message || 'Failed to add comment.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admt-modal-backdrop" onClick={onClose}>
      <div className="admt-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admt-modal-header">
          <h3 className="admt-modal-title">Add Comment</h3>
          <button className="admt-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="admt-modal-body">
          {/* Select Article */}
          <div className="adm-field">
            <label className="adm-label">Select Article <span className="art-required">*</span></label>
            <select className="adm-input" name="article_id" value={form.article_id} onChange={set}>
              <option value="">— Choose an article —</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({a.status})</option>
              ))}
            </select>
          </div>

          {/* Author + Status row */}
          <div className="art-form-grid">
            <div className="adm-field">
              <label className="adm-label">Author Name</label>
              <input className="adm-input" name="author_name" value={form.author_name} onChange={set} placeholder="Admin" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Status</label>
              <select className="adm-input" name="status" value={form.status} onChange={set}>
                <option value="approved">Approved (Active)</option>
                <option value="pending">Pending (Inactive)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Comment */}
          <div className="adm-field">
            <label className="adm-label">Comment</label>
            <textarea
              className="adm-input adm-textarea"
              name="content"
              rows={4}
              placeholder="Write the comment text…"
              value={form.content}
              onChange={set}
            />
          </div>

          {/* Image upload */}
          <div className="adm-field">
            <label className="adm-label">Image <span style={{ color: '#9a8e78', fontWeight: 400 }}>(optional)</span></label>
            <div className="admt-img-upload-row">
              <button type="button" className="admt-img-pick-btn" onClick={() => fileRef.current?.click()}>
                {imgFile ? '↺ Change Image' : '+ Attach Image'}
              </button>
              {imgPreview && (
                <div className="admt-img-preview-wrap">
                  <img src={imgPreview} alt="Preview" className="admt-img-preview" />
                  <button type="button" className="admt-img-remove" onClick={removeImg} aria-label="Remove image">✕</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
            </div>
            {!form.content.trim() && !imgFile && (
              <p className="adm-hint" style={{ color: '#9a8e78' }}>At least one of Comment or Image is required.</p>
            )}
          </div>

          {error && <p className="art-error-msg" style={{ marginTop: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="admt-modal-footer">
          <button className="adm-btn" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comments Tab ──────────────────────────────────────────────────────────────
function CommentsTab() {
  const [articles,     setArticles]     = useState([]);
  const [selectedId,   setSelectedId]   = useState('');
  const [comments,     setComments]     = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [editingId,    setEditingId]    = useState(null);
  const [editContent,  setEditContent]  = useState('');
  const [editAuthor,   setEditAuthor]   = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [showModal,    setShowModal]    = useState(false);

  useEffect(() => {
    api.getAllArticles()
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadComments = useCallback((id) => {
    if (!id) { setComments([]); return; }
    setLoading(true); setError('');
    api.getAdminArticleComments(id)
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadComments(selectedId); }, [selectedId, loadComments]);

  const selectArticle = (id) => { setSelectedId(id); setEditingId(null); };

  // Called by modal after a successful save — switch to the article that got the comment
  const onCommentSaved = (articleId) => {
    const id = String(articleId);
    setSelectedId(id);
    loadComments(id);
  };

  const updateStatus = async (id, status) => {
    try { await api.updateAdminComment(id, { status }); loadComments(selectedId); }
    catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this comment permanently?')) return;
    try { await api.deleteComment(id); loadComments(selectedId); }
    catch (e) { alert(e.message); }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditContent(c.content || ''); setEditAuthor(c.author_name || ''); };

  const saveEdit = async (id) => {
    setEditSaving(true);
    try {
      await api.updateAdminComment(id, { content: editContent, author_name: editAuthor });
      setEditingId(null);
      loadComments(selectedId);
    } catch (e) { alert(e.message); }
    finally { setEditSaving(false); }
  };

  const visible = comments.filter(c => statusFilter === 'all' || c.status === statusFilter);
  const STATUS_COLORS = { pending: '#d4670a', approved: '#2a7a3b', rejected: '#8b1a1a' };

  return (
    <div className="adm-section">
      {/* Section header */}
      <div className="art-list-header" style={{ marginBottom: '1.25rem' }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>Comments Management</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}>
          + Add Comment
        </button>
      </div>

      {/* Article selector */}
      <div className="adm-field" style={{ marginBottom: '1.25rem' }}>
        <label className="adm-label">Select Article to View Comments</label>
        <select
          className="adm-input"
          value={selectedId}
          onChange={e => selectArticle(e.target.value)}
          style={{ maxWidth: 520 }}
        >
          <option value="">— Choose an article —</option>
          {articles.map(a => (
            <option key={a.id} value={a.id}>{a.title} ({a.status})</option>
          ))}
        </select>
      </div>

      {!selectedId && (
        <p className="art-empty">Select an article above to view and manage its comments.</p>
      )}

      {selectedId && (
        <>
          {/* Status filter */}
          <div className="admt-row" style={{ marginBottom: '1rem', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                className={`adm-btn adm-btn-sm${statusFilter === s ? ' adm-btn-primary' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && (
                  <span className="admt-badge" style={{ marginLeft: '0.35rem' }}>
                    {comments.filter(c => c.status === s).length}
                  </span>
                )}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9a8e78', fontFamily: "'Josefin Sans',sans-serif", alignSelf: 'center' }}>
              {visible.length} comment{visible.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && <p className="art-empty">Loading comments…</p>}
          {!loading && error && <p className="art-error-msg">{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p className="art-empty">No {statusFilter !== 'all' ? statusFilter : ''} comments for this article.</p>
          )}

          <div className="admt-comments-list">
            {visible.map(c => (
              <div key={c.id} className={`admt-comment-card${c.is_admin ? ' admt-comment-card--admin' : ''}`}>
                <div className="admt-comment-head">
                  <div className="admt-comment-meta">
                    {c.is_admin
                      ? <span className="admt-badge admt-badge--admin">Admin</span>
                      : <span className="admt-badge admt-badge--user">User</span>
                    }
                    {editingId === c.id
                      ? <input className="adm-input admt-inline-input" value={editAuthor}
                          onChange={e => setEditAuthor(e.target.value)} placeholder="Author name" />
                      : <strong className="admt-author">{c.author_name}</strong>
                    }
                    <span className="admt-status-pill" style={{ background: STATUS_COLORS[c.status] || '#666' }}>
                      {c.status}
                    </span>
                    <span className="admt-date">{fmtDatetime(c.created_at)}</span>
                  </div>
                  <div className="admt-comment-actions">
                    {editingId === c.id ? (
                      <>
                        <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => saveEdit(c.id)} disabled={editSaving}>
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button className="adm-btn adm-btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {c.status !== 'approved' && (
                          <button className="adm-btn adm-btn-sm" style={{ color: '#2a7a3b', borderColor: '#2a7a3b' }}
                            onClick={() => updateStatus(c.id, 'approved')}>Approve</button>
                        )}
                        {c.status !== 'rejected' && (
                          <button className="adm-btn adm-btn-sm" style={{ color: '#8b1a1a', borderColor: '#8b1a1a' }}
                            onClick={() => updateStatus(c.id, 'rejected')}>Reject</button>
                        )}
                        {c.status !== 'pending' && (
                          <button className="adm-btn adm-btn-sm" onClick={() => updateStatus(c.id, 'pending')}>Pending</button>
                        )}
                        <button className="adm-btn adm-btn-sm" onClick={() => startEdit(c)}>Edit</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(c.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === c.id ? (
                  <textarea className="adm-input adm-textarea" rows={3} value={editContent}
                    onChange={e => setEditContent(e.target.value)} style={{ marginTop: '0.6rem' }} />
                ) : (
                  <>
                    {c.content && <p className="admt-comment-text">{c.content}</p>}
                    {c.image_url && (
                      <img src={resolveAdminImg(c.image_url)} alt="Attachment" className="admt-comment-img" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Comment Modal */}
      {showModal && (
        <AddCommentModal
          articles={articles}
          preselectedId={selectedId}
          onClose={() => setShowModal(false)}
          onSaved={onCommentSaved}
        />
      )}
    </div>
  );
}

// ── Likes Tab ─────────────────────────────────────────────────────────────────
function LikesTab() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [toggling, setToggling] = useState(null);
  // per-row draft counts: { [id]: string }
  const [drafts,   setDrafts]   = useState({});
  // per-row saving state and feedback
  const [saving,   setSaving]   = useState({});
  const [saved,    setSaved]    = useState({});
  const [saveErr,  setSaveErr]  = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api.getAdminLikeStats()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setRows(arr);
        // Initialise draft inputs to current totals
        const init = {};
        arr.forEach(r => { init[r.id] = String(r.like_count); });
        setDrafts(init);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    setToggling(id);
    try {
      const res = await api.adminToggleLike(id);
      setRows(prev => prev.map(r =>
        r.id === id ? { ...r, like_count: res.count, user_like_count: res.user_like_count, virtual_likes: res.virtual_likes, admin_liked: res.admin_liked } : r
      ));
      setDrafts(prev => ({ ...prev, [id]: String(res.count) }));
    } catch (e) { alert(e.message); }
    finally { setToggling(null); }
  };

  const handleDraftChange = (id, val) => {
    // Allow only digits
    if (!/^\d*$/.test(val)) return;
    setDrafts(prev => ({ ...prev, [id]: val }));
    setSaveErr(prev => ({ ...prev, [id]: '' }));
  };

  const saveLikeCount = async (id) => {
    const raw = (drafts[id] || '').trim();
    const num = parseInt(raw, 10);
    if (raw === '' || isNaN(num) || num < 0) {
      setSaveErr(prev => ({ ...prev, [id]: 'Enter a valid non-negative number.' }));
      return;
    }
    setSaving(prev => ({ ...prev, [id]: true }));
    setSaved(prev => ({ ...prev, [id]: false }));
    setSaveErr(prev => ({ ...prev, [id]: '' }));
    try {
      const res = await api.setAdminLikeCount(id, num);
      setRows(prev => prev.map(r =>
        r.id === id ? { ...r, like_count: res.like_count, user_like_count: res.user_like_count, virtual_likes: res.virtual_likes } : r
      ));
      setDrafts(prev => ({ ...prev, [id]: String(res.like_count) }));
      setSaved(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 2500);
    } catch (e) {
      setSaveErr(prev => ({ ...prev, [id]: e.message }));
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const totalLikes = rows.reduce((s, r) => s + (r.like_count || 0), 0);

  return (
    <div className="adm-section">
      <div className="art-list-header" style={{ marginBottom: '1.2rem' }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>Likes Management</h2>
        {!loading && (
          <span className="admt-total-pill">
            {totalLikes} total like{totalLikes !== 1 ? 's' : ''} across {rows.length} article{rows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading && <p className="art-empty">Loading…</p>}
      {!loading && error && <p className="art-error-msg">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="art-empty">No articles found.</p>}

      {!loading && rows.length > 0 && (
        <div className="admt-likes-table">
          <div className="admt-likes-thead">
            <span className="admt-likes-col-title">Article</span>
            <span className="admt-likes-col-count">Total Likes</span>
            <span className="admt-likes-col-set">Set Count</span>
            <span className="admt-likes-col-admin">Admin Like</span>
          </div>

          {rows.map(r => (
            <div key={r.id} className={`admt-likes-row${r.status === 'draft' ? ' admt-likes-row--draft' : ''}`}>
              {/* Article info */}
              <div className="admt-likes-col-title">
                <span className="admt-likes-title">{r.title}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                  <code className="art-slug" style={{ fontSize: '0.6rem' }}>/articles/{r.slug}</code>
                  <span className={`art-status ${r.status}`} style={{ fontSize: '0.55rem' }}>{r.status}</span>
                  {r.virtual_likes > 0 && (
                    <span className="admt-virtual-badge" title="Admin boost">+{r.virtual_likes} boost</span>
                  )}
                </div>
              </div>

              {/* Current total — read-only display */}
              <div className="admt-likes-col-count">
                <span className="admt-like-count">♥ {r.like_count}</span>
                {r.user_like_count !== undefined && (
                  <span className="admt-like-breakdown">
                    {r.user_like_count} user{r.user_like_count !== 1 ? 's' : ''}
                    {r.virtual_likes > 0 ? ` + ${r.virtual_likes} boost` : ''}
                  </span>
                )}
              </div>

              {/* Editable count input */}
              <div className="admt-likes-col-set">
                <div className="admt-likes-set-row">
                  <input
                    className="adm-input admt-likes-input"
                    type="number"
                    min="0"
                    step="1"
                    value={drafts[r.id] ?? r.like_count}
                    onChange={e => handleDraftChange(r.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveLikeCount(r.id); }}
                    aria-label={`Set like count for ${r.title}`}
                  />
                  <button
                    className="adm-btn adm-btn-sm adm-btn-primary admt-likes-save-btn"
                    onClick={() => saveLikeCount(r.id)}
                    disabled={!!saving[r.id]}
                    title="Save like count"
                  >
                    {saving[r.id] ? '…' : 'Save'}
                  </button>
                </div>
                {saved[r.id]    && <span className="admt-likes-feedback admt-likes-feedback--ok">✓ Saved</span>}
                {saveErr[r.id]  && <span className="admt-likes-feedback admt-likes-feedback--err">{saveErr[r.id]}</span>}
              </div>

              {/* Admin toggle */}
              <div className="admt-likes-col-admin">
                <button
                  className={`adm-btn adm-btn-sm${r.admin_liked ? ' admt-btn-liked' : ''}`}
                  onClick={() => toggle(r.id)}
                  disabled={toggling === r.id}
                  title={r.admin_liked ? 'Remove admin like' : 'Add admin like'}
                >
                  {toggling === r.id ? '…' : r.admin_liked ? '♥ Unlike' : '♡ Like'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_TABS = [
  { id: 'hero',       label: 'Hero Section' },
  { id: 'articles',   label: 'Articles'     },
  { id: 'categories', label: 'Categories'   },
  { id: 'comments',   label: 'Comments'     },
  { id: 'likes',      label: 'Likes'        },
  { id: 'seo',        label: 'SEO'          },
  { id: 'blocks',     label: 'Blocks'       },
  { id: 'order',      label: 'Section Order' },
];

function ArticlesAdmin() {
  const [active,     setActive]     = useState('articles');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getAllCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Articles</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="articles" />
          <a href="/articles" target="_blank" rel="noreferrer" className="bio-adm-view-link">
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
        {active === 'articles'   && <ArticlesListTab categories={categories} />}
        {active === 'categories' && <CategoriesTab />}
        {active === 'comments'   && <CommentsTab />}
        {active === 'likes'      && <LikesTab />}
        {active === 'seo'        && <SeoTab pageSlug="articles" />}
        {active === 'blocks'     && <SiteBlocksTab page="articles" />}
        {active === 'order'      && <SectionOrderTab page="articles" />}
      </div>
    </div>
  );
}

export default ArticlesAdmin;
