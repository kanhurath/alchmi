import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/connectPageApi';
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

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({ eyebrow:'', title:'', title_em:'', subtitle:'', breadcrumb:'' });
  const { save, saving, saved } = useSave(api.updateHero);

  useEffect(() => { api.getHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {}); }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Connect page.</p>
      <Field label="Eyebrow Label"           name="eyebrow"    value={form.eyebrow}    onChange={h} />
      <Field label="Title (plain)"           name="title"      value={form.title}      onChange={h} />
      <Field label="Title (italic / accent)" name="title_em"   value={form.title_em}   onChange={h} />
      <Field label="Subtitle"                name="subtitle"   value={form.subtitle}   onChange={h} rows={2} />
      <Field label="Breadcrumb Text"         name="breadcrumb" value={form.breadcrumb} onChange={h} />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Content (description + links) ───────────────────────────────────────

const EMPTY_LINK = { icon: '', label: '', href: '', sort_order: 0 };

function LinkForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Icon (emoji / text)" name="icon"       value={form.icon}       onChange={h} hint='e.g. "in", "𝕏", "✉"' />
        <Field label="Label"               name="label"      value={form.label}      onChange={h} />
        <Field label="Sort Order"          name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="URL" name="href" value={form.href} onChange={h} type="url" />
    </>
  );
}

function ContentTab() {
  const [desc,    setDesc]    = useState('');
  const [links,   setLinks]   = useState([]);
  const [editId,  setEditId]  = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [newLink, setNewLink] = useState(EMPTY_LINK);
  const { save, saving, saved } = useSave((d) => api.updateSection({ description: d }));

  const load = useCallback(() => {
    Promise.allSettled([api.getSection(), api.getLinks()])
      .then(([sec, lnk]) => {
        if (sec.status === 'fulfilled') setDesc(sec.value.description || '');
        if (lnk.status === 'fulfilled') setLinks(lnk.value);
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveLink = async (link) => { await api.updateLink(link.id, link); setEditId(null); load(); };
  const saveNew  = async () => { await api.createLink(newLink); setNewLink(EMPTY_LINK); setAdding(false); load(); };
  const del      = async (id) => { if (!confirm('Remove this link?')) return; await api.deleteLink(id); load(); };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Connect Section</h2>

      <Field label="Description Text" name="description" value={desc}
        onChange={e => setDesc(e.target.value)} rows={3}
        hint="The paragraph shown above the social/booking links." />
      <SaveBar onSave={() => save(desc)} saving={saving} saved={saved} />

      <hr className="adm-divider" />

      <div className="adm-section-header">
        <h3 className="adm-sub-title">Social &amp; External Links</h3>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Link'}
        </button>
      </div>
      <p className="adm-hint">The "Book a Session" button is always shown first and is not editable here.</p>

      {adding && (
        <div className="adm-card-block">
          <LinkForm form={newLink} setForm={setNewLink} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {links.map(link => (
        <div key={link.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{link.icon}</span>
            <span className="adm-card-title">{link.label}</span>
            <span className="adm-hint" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {link.href}
            </span>
            <button className="adm-btn adm-btn-sm"
              onClick={() => setEditId(editId === link.id ? null : link.id)}>
              {editId === link.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(link.id)}>Remove</button>
          </div>
          {editId === link.id && (
            <div className="adm-card-edit-form">
              <LinkForm
                form={link}
                setForm={(updater) =>
                  setLinks(links.map(l => l.id === link.id
                    ? (typeof updater === 'function' ? updater(l) : updater) : l))
                }
              />
              <div className="adm-save-bar">
                <button className="adm-btn adm-btn-primary"
                  onClick={() => saveLink(links.find(l => l.id === link.id))}>Save</button>
                <button className="adm-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',    label: 'Hero'    },
  { id: 'content', label: 'Content' },
  { id: 'extra',   label: 'Extra Sections' },
  { id: 'order',   label: 'Section Order' },
  { id: 'seo',     label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:    HeroTab,
  content: ContentTab,
  extra:   () => <SiteBlocksTab pageSlug="connect" />,
  order:   () => <SectionOrderTab pageSlug="connect" />,
  seo:     () => <SeoTab pageSlug="connect" />,
};

function ConnectAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Connect</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="connect" />
          <a href="/connect" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
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

export default ConnectAdmin;
