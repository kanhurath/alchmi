import { useState, useEffect, useRef } from 'react';
import * as seoApi from '../../services/seoApi';
import './SeoTab.css';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function CharCount({ value = '', warn = 60, max = 70 }) {
  const len = (value || '').length;
  const cls = len === 0 ? '' : len <= warn ? 'ok' : len <= max ? 'warn' : 'over';
  return (
    <span className={`seo-char ${cls}`}>
      {len}/{warn}
    </span>
  );
}

function DescCount({ value = '' }) {
  const len = (value || '').length;
  const cls = len === 0 ? '' : len <= 140 ? 'ok' : len <= 160 ? 'warn' : 'over';
  return (
    <span className={`seo-char ${cls}`}>
      {len}/160
    </span>
  );
}

export function SeoTab({ pageSlug }) {
  const [form,   setForm]   = useState({
    seo_title: '', meta_description: '', focus_keyword: '',
    canonical_url: '', og_image_url: '', custom_schema: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const imgRef = useRef();

  useEffect(() => {
    seoApi.getSeo(pageSlug)
      .then(d => setForm({
        seo_title:        d.seo_title        || '',
        meta_description: d.meta_description || '',
        focus_keyword:    d.focus_keyword    || '',
        canonical_url:    d.canonical_url    || '',
        og_image_url:     d.og_image_url     || '',
        custom_schema:    d.custom_schema    || '',
      }))
      .catch(() => {});
  }, [pageSlug]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      await seoApi.saveSeo(pageSlug, form);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const uploadImage = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { url } = await seoApi.uploadOgImage(pageSlug, file);
      set('og_image_url', url);
    } catch { alert('Image upload failed'); }
    e.target.value = '';
  };

  const ogSrc = form.og_image_url
    ? form.og_image_url.startsWith('http') ? form.og_image_url : `${SERVER}${form.og_image_url}`
    : null;

  return (
    <div className="seo-tab">
      <p className="seo-intro">
        Configure per-page SEO metadata, social sharing tags, and structured data. These settings override the site defaults when set.
      </p>

      {/* ── SEO Title ── */}
      <div className="seo-field">
        <label className="seo-label">
          SEO Title
          <CharCount value={form.seo_title} />
        </label>
        <input
          className="seo-input"
          value={form.seo_title}
          onChange={e => set('seo_title', e.target.value)}
          placeholder="Leave blank to use the default site title"
          maxLength={200}
        />
        <p className="seo-hint">Shown in browser tabs and search results. Target: under 60 characters.</p>
      </div>

      {/* ── Meta Description ── */}
      <div className="seo-field">
        <label className="seo-label">
          Meta Description
          <DescCount value={form.meta_description} />
        </label>
        <textarea
          className="seo-input seo-textarea"
          value={form.meta_description}
          onChange={e => set('meta_description', e.target.value)}
          placeholder="A clear, compelling summary of this page…"
          rows={3}
          maxLength={500}
        />
        <p className="seo-hint">Shown in search engine results. Target: under 160 characters.</p>
      </div>

      {/* ── Focus Keyword ── */}
      <div className="seo-field">
        <label className="seo-label">Focus Keyword</label>
        <input
          className="seo-input"
          value={form.focus_keyword}
          onChange={e => set('focus_keyword', e.target.value)}
          placeholder="e.g. Vedic teachings, yoga retreats India…"
        />
        <p className="seo-hint">The primary keyword phrase this page should rank for. Used as the keywords meta tag.</p>
      </div>

      {/* ── Canonical URL ── */}
      <div className="seo-field">
        <label className="seo-label">Canonical URL</label>
        <input
          className="seo-input"
          value={form.canonical_url}
          onChange={e => set('canonical_url', e.target.value)}
          placeholder="http://localhost:3001/biography"
          type="text"
        />
        <p className="seo-hint">Leave blank to let the browser use the current page URL. Set only if this page has duplicate content elsewhere.</p>
      </div>

      {/* ── OG Image ── */}
      <div className="seo-field">
        <label className="seo-label">Open Graph Image</label>
        {ogSrc && (
          <div className="seo-og-preview">
            <img src={ogSrc} alt="OG preview" />
          </div>
        )}
        <input
          className="seo-input"
          value={form.og_image_url}
          onChange={e => set('og_image_url', e.target.value)}
          placeholder="https://… or /uploads/pages/image.jpg"
        />
        <div className="seo-img-actions">
          <button className="adm-btn adm-btn-sm" onClick={() => imgRef.current?.click()}>
            Upload image
          </button>
          {form.og_image_url && (
            <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => set('og_image_url', '')}>
              Clear
            </button>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
        </div>
        <p className="seo-hint">Used for og:image and twitter:image. Recommended: 1200×630 px. Used when this page is shared on social media.</p>
      </div>

      {/* ── Custom Schema ── */}
      <div className="seo-field">
        <label className="seo-label">Custom Schema (JSON-LD)</label>
        <textarea
          className="seo-input seo-textarea seo-schema"
          value={form.custom_schema}
          onChange={e => set('custom_schema', e.target.value)}
          placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name"\n}'}
          rows={8}
          spellCheck={false}
        />
        <p className="seo-hint">
          Injected as <code>{'<script type="application/ld+json">'}</code> in the page head. Must be valid JSON.{' '}
          <a href="https://schema.org" target="_blank" rel="noreferrer">schema.org reference ↗</a>
        </p>
      </div>

      {/* ── Save bar ── */}
      <div className="seo-save-bar">
        {saved  && <span className="seo-saved">✓ SEO settings saved</span>}
        {error  && <span className="seo-error">⚠ {error}</span>}
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save SEO Settings'}
        </button>
      </div>
    </div>
  );
}
