import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/articlesApi';
import ArticleRichEditor from './ArticleRichEditor';
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
            <ArticleRichEditor
              value={form.content}
              onChange={(html) => setForm(f => ({ ...f, content: html }))}
              uploadUrl={api.getInlineImageUploadUrl()}
            />
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

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_TABS = [
  { id: 'hero',       label: 'Hero Section' },
  { id: 'articles',   label: 'Articles'     },
  { id: 'categories', label: 'Categories'   },
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
        {active === 'seo'        && <SeoTab pageSlug="articles" />}
        {active === 'blocks'     && <SiteBlocksTab page="articles" />}
        {active === 'order'      && <SectionOrderTab page="articles" />}
      </div>
    </div>
  );
}

export default ArticlesAdmin;
