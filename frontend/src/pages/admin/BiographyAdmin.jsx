import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/biographyApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import { SectionStylePanel } from '../../components/admin/SectionStylePanel';
import './BiographyAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Generic field helpers ─────────────────────────────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows ? (
        <textarea
          className="adm-input adm-textarea"
          name={name}
          value={value || ''}
          rows={rows}
          onChange={onChange}
        />
      ) : (
        <input
          className="adm-input"
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
        />
      )}
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

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({ eyebrow: '', title: '', title_em: '', subtitle: '', breadcrumb: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    api.getHero().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateHero(form); setSaved(true); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Section</h2>
      <p className="adm-hint">Controls the banner at the top of the Biography page.</p>
      <Field label="Eyebrow Label" name="eyebrow" value={form.eyebrow} onChange={handle} />
      <Field label="Title (plain)" name="title" value={form.title} onChange={handle} />
      <Field label="Title (italic / accent)" name="title_em" value={form.title_em} onChange={handle} />
      <Field label="Subtitle" name="subtitle" value={form.subtitle} onChange={handle} rows={2} />
      <Field label="Breadcrumb Text" name="breadcrumb" value={form.breadcrumb} onChange={handle} />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Profile ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState({
    name: '', tagline: '', quote: '', para1: '', para2: '',
    linkedin_url: '', twitter_handle: '', twitter_url: '', photo_url: '',
  });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getProfile().then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateProfile(form); setSaved(true); }
    finally { setSaving(false); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { photo_url } = await api.uploadProfilePhoto(file);
      setForm(f => ({ ...f, photo_url }));
    } finally {
      setUploading(false);
    }
  };

  const photoPreview = form.photo_url
    ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}${form.photo_url}`
    : null;

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Profile Section</h2>

      <div className="adm-photo-row">
        {photoPreview && <img src={photoPreview} alt="Bio photo" className="adm-photo-preview" />}
        <div>
          <label className="adm-label">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="adm-file" />
          {uploading && <span className="adm-hint">Uploading…</span>}
          {form.photo_url && <p className="adm-hint">Current: {form.photo_url}</p>}
          <p className="adm-hint">Leave empty to use the default bundled image.</p>
        </div>
      </div>

      <Field label="Name" name="name" value={form.name} onChange={handle} />
      <Field label="Tagline (use · as separator)" name="tagline" value={form.tagline} onChange={handle} rows={2} />
      <Field label="Pull Quote" name="quote" value={form.quote} onChange={handle} rows={5} />
      <Field label="Paragraph 1" name="para1" value={form.para1} onChange={handle} rows={4} />
      <Field label="Paragraph 2" name="para2" value={form.para2} onChange={handle} rows={4} />
      <Field label="LinkedIn URL" name="linkedin_url" value={form.linkedin_url} onChange={handle} type="url" />
      <Field label="Twitter Handle (e.g. @handle)" name="twitter_handle" value={form.twitter_handle} onChange={handle} />
      <Field label="Twitter URL" name="twitter_url" value={form.twitter_url} onChange={handle} type="url" />
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Tab: Engage ───────────────────────────────────────────────────────────────

function EngageTab() {
  const [intro, setIntro]   = useState({ section_label: '', title: '', title_em: '', description: '' });
  const [cards, setCards]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [newVenue,        setNewVenue]        = useState({});   // cardId → text
  const [editCard,        setEditCard]        = useState(null); // id of card being edited
  const [editingVenueId,     setEditingVenueId]     = useState(null);
  const [editingVenueText,   setEditingVenueText]   = useState('');
  const [editingVenueUrl,    setEditingVenueUrl]    = useState('');
  const [editingVenueNewTab, setEditingVenueNewTab] = useState(false);

  const load = useCallback(() =>
    api.getEngage().then(d => {
      setIntro(d.intro || {});
      setCards(d.cards || []);
    }).catch(() => {}), []);

  useEffect(() => { load(); }, [load]);

  const saveIntro = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateEngageIntro(intro); setSaved(true); }
    finally { setSaving(false); }
  };

  const saveCard = async (card) => {
    await api.updateEngageCard(card.id, card);
    setEditCard(null);
    load();
  };

  const deleteCard = async (id) => {
    if (!confirm('Delete this engagement card?')) return;
    await api.deleteEngageCard(id);
    load();
  };

  const addVenue = async (cardId) => {
    const text = (newVenue[cardId]?.text || '').trim();
    if (!text) return;
    const url    = (newVenue[cardId]?.url || '').trim();
    const newTab = newVenue[cardId]?.newTab || false;
    await api.addVenue(cardId, text, url, newTab);
    setNewVenue(n => ({ ...n, [cardId]: { text: '', url: '', newTab: false } }));
    load();
  };

  const startEditVenue = (v) => {
    setEditingVenueId(v.id);
    setEditingVenueText(v.venue_text);
    setEditingVenueUrl(v.venue_url || '');
    setEditingVenueNewTab(!!v.venue_new_tab);
  };

  const saveVenueEdit = async (venueId) => {
    const text = editingVenueText.trim();
    if (!text) return;
    await api.updateVenue(venueId, text, editingVenueUrl.trim(), editingVenueNewTab);
    setEditingVenueId(null);
    setEditingVenueText('');
    setEditingVenueUrl('');
    setEditingVenueNewTab(false);
    load();
  };

  const cancelVenueEdit = () => {
    setEditingVenueId(null);
    setEditingVenueText('');
    setEditingVenueUrl('');
    setEditingVenueNewTab(false);
  };

  const removeVenue = async (venueId) => {
    if (!confirm('Remove this venue?')) return;
    await api.deleteVenue(venueId);
    load();
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">How Vinay Engages — Intro</h2>
      <Field label="Section Label" name="section_label" value={intro.section_label} onChange={e => setIntro(i => ({ ...i, [e.target.name]: e.target.value }))} />
      <Field label="Title (plain)" name="title" value={intro.title} onChange={e => setIntro(i => ({ ...i, [e.target.name]: e.target.value }))} />
      <Field label="Title (italic)" name="title_em" value={intro.title_em} onChange={e => setIntro(i => ({ ...i, [e.target.name]: e.target.value }))} />
      <Field label="Description" name="description" value={intro.description} onChange={e => setIntro(i => ({ ...i, [e.target.name]: e.target.value }))} rows={3} />
      <SaveBar onSave={saveIntro} saving={saving} saved={saved} />

      <hr className="adm-divider" />
      <h2 className="adm-section-title">Engagement Cards</h2>

      {cards.map((card) => (
        <div key={card.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{card.num_label}</span>
            <span className="adm-card-title">{card.category} — {card.title}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditCard(editCard === card.id ? null : card.id)}>
              {editCard === card.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => deleteCard(card.id)}>Delete</button>
          </div>

          {editCard === card.id && (
            <CardEditForm card={card} onSave={saveCard} onCancel={() => setEditCard(null)} />
          )}

          <div className="adm-venues-block">
            <p className="adm-label">Venues / Appearances ({card.venues?.length || 0})</p>
            <ul className="adm-venue-list">
              {card.venues?.map((v) => (
                <li key={v.id} className="adm-venue-item">
                  {editingVenueId === v.id ? (
                    /* ── Inline edit mode ── */
                    <div className="adm-venue-edit-block">
                      <div className="adm-venue-edit-row">
                        <input
                          className="adm-input adm-input-sm"
                          value={editingVenueText}
                          placeholder="Venue / appearance name"
                          onChange={e => setEditingVenueText(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && cancelVenueEdit()}
                          autoFocus
                        />
                      </div>
                      <div className="adm-venue-edit-row">
                        <input
                          className="adm-input adm-input-sm"
                          value={editingVenueUrl}
                          placeholder="URL (optional) — https://..."
                          onChange={e => setEditingVenueUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && cancelVenueEdit()}
                          type="text"
                        />
                      </div>
                      <div className="adm-venue-edit-row">
                        <label className="adm-checkbox-label">
                          <input
                            type="checkbox"
                            checked={editingVenueNewTab}
                            onChange={e => setEditingVenueNewTab(e.target.checked)}
                          />
                          Open in new window
                        </label>
                      </div>
                      <div className="adm-venue-edit-row">
                        <button
                          className="adm-btn adm-btn-primary adm-btn-sm"
                          onClick={() => saveVenueEdit(v.id)}
                          disabled={!editingVenueText.trim()}
                        >Save</button>
                        <button className="adm-btn adm-btn-sm" onClick={cancelVenueEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Read mode ── */
                    <>
                      <span className="adm-venue-text">{v.venue_text}</span>
                      <div className="adm-venue-actions">
                        <button className="adm-btn adm-btn-sm" onClick={() => startEditVenue(v)}>Edit</button>
                        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeVenue(v.id)}>×</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="adm-venue-add-block">
              <div className="adm-venue-add">
                <input
                  className="adm-input adm-input-sm"
                  placeholder="Venue / appearance name…"
                  value={newVenue[card.id]?.text || ''}
                  onChange={e => setNewVenue(n => ({ ...n, [card.id]: { ...n[card.id], text: e.target.value } }))}
                  onKeyDown={e => e.key === 'Enter' && addVenue(card.id)}
                />
              </div>
              <div className="adm-venue-add">
                <input
                  className="adm-input adm-input-sm"
                  placeholder="URL (optional) — https://…"
                  value={newVenue[card.id]?.url || ''}
                  onChange={e => setNewVenue(n => ({ ...n, [card.id]: { ...n[card.id], url: e.target.value } }))}
                  type="text"
                />
              </div>
              <div className="adm-venue-add">
                <label className="adm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={newVenue[card.id]?.newTab || false}
                    onChange={e => setNewVenue(n => ({ ...n, [card.id]: { ...n[card.id], newTab: e.target.checked } }))}
                  />
                  Open in new window
                </label>
                <button className="adm-btn adm-btn-sm" onClick={() => addVenue(card.id)}>Add</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardEditForm({ card, onSave, onCancel }) {
  const [form, setForm] = useState({ ...card });
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="adm-card-edit-form">
      <div className="adm-field-row">
        <Field label="Num Label" name="num_label" value={form.num_label} onChange={handle} />
        <Field label="Category" name="category" value={form.category} onChange={handle} />
      </div>
      <div className="adm-field-row">
        <Field label="Title" name="title" value={form.title} onChange={handle} />
        <Field label="Slug" name="slug" value={form.slug} onChange={handle} />
      </div>
      <div className="adm-field-row">
        <Field label="Content Label" name="content_label" value={form.content_label} onChange={handle} />
        <Field label="Count Number" name="count_number" value={form.count_number} onChange={handle} />
        <Field label="Count Label" name="count_label" value={form.count_label} onChange={handle} />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save Card</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Tab: Ventures ─────────────────────────────────────────────────────────────

const EMPTY_VENTURE = { designation: '', name: '', type: '', description: '', link_url: '', link_label: '', sort_order: 0 };

function VenturesTab() {
  const [ventures, setVentures] = useState([]);
  const [editId, setEditId]     = useState(null);
  const [adding, setAdding]     = useState(false);
  const [newV, setNewV]         = useState(EMPTY_VENTURE);
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newLogoPreview, setNewLogoPreview] = useState(null);

  const load = useCallback(() => api.getVentures().then(setVentures).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async (v) => {
    await api.updateVenture(v.id, v);
    setEditId(null);
    load();
  };

  const deleteV = async (id) => {
    if (!confirm('Delete this venture?')) return;
    await api.deleteVenture(id);
    load();
  };

  const saveNew = async () => {
    const created = await api.createVenture(newV);
    if (newLogoFile && created?.id) {
      await api.uploadVentureLogo(created.id, newLogoFile);
    }
    setNewV(EMPTY_VENTURE);
    setNewLogoFile(null);
    setNewLogoPreview(null);
    setAdding(false);
    load();
  };

  const handleNewLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewLogoFile(file);
    setNewLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async (id, file) => {
    await api.uploadVentureLogo(id, file);
    load();
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Ventures &amp; Initiatives</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => { setAdding(a => !a); setNewLogoFile(null); setNewLogoPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Venture'}
        </button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Venture</h3>
          <VentureForm form={newV} setForm={setNewV} />
          <div className="adm-field">
            <label className="adm-label">Logo Image</label>
            <input type="file" accept="image/*" className="adm-file" onChange={handleNewLogo} />
            {newLogoPreview && (
              <img src={newLogoPreview} alt="Logo preview" className="adm-photo-preview" style={{ marginTop: '0.5rem' }} />
            )}
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {ventures.map((v) => (
        <div key={v.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-title">{v.name}</span>
            <span className="adm-hint">{v.designation}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === v.id ? null : v.id)}>
              {editId === v.id ? 'Cancel' : 'Edit'}
            </button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => deleteV(v.id)}>Delete</button>
          </div>

          {editId === v.id && (
            <VentureEditBlock venture={v} onSave={saveEdit} onCancel={() => setEditId(null)} onLogoUpload={handleLogoUpload} />
          )}
        </div>
      ))}
    </div>
  );
}

function VentureForm({ form, setForm }) {
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <div className="adm-field-row">
        <Field label="Name" name="name" value={form.name} onChange={handle} />
        <Field label="Designation" name="designation" value={form.designation} onChange={handle} />
      </div>
      <Field label="Type / Category" name="type" value={form.type} onChange={handle} />
      <Field label="Description" name="description" value={form.description} onChange={handle} rows={3} />
      <div className="adm-field-row">
        <Field label="Website URL" name="link_url" value={form.link_url} onChange={handle} type="url" />
        <Field label="Link Label" name="link_label" value={form.link_label} onChange={handle} />
      </div>
      <Field label="Sort Order" name="sort_order" value={form.sort_order} onChange={handle} type="number" />
    </>
  );
}

function VentureEditBlock({ venture, onSave, onCancel, onLogoUpload }) {
  const [form, setForm] = useState({ ...venture });

  return (
    <div className="adm-card-edit-form">
      <VentureForm form={form} setForm={setForm} />

      <div className="adm-field">
        <label className="adm-label">Logo Image</label>
        <input type="file" accept="image/*" className="adm-file"
          onChange={e => e.target.files?.[0] && onLogoUpload(venture.id, e.target.files[0])} />
        {venture.logo_url && <p className="adm-hint">Current: {venture.logo_url}</p>}
      </div>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Biography CMS — content-only component (AdminLayout provides the shell) ───

const TABS = [
  { id: 'hero',     label: 'Hero' },
  { id: 'profile',  label: 'Profile' },
  { id: 'engage',   label: 'Engage' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'extra',    label: 'Extra Sections' },
  { id: 'order',    label: 'Section Order' },
  { id: 'seo',      label: 'SEO' },
];

const TAB_COMPONENTS = {
  hero:     HeroTab,
  profile:  ProfileTab,
  engage:   EngageTab,
  ventures: VenturesTab,
  extra:    () => <SiteBlocksTab pageSlug="biography" />,
  order:    () => <SectionOrderTab pageSlug="biography" />,
  seo:      () => <SeoTab pageSlug="biography" />,
};

function BiographyAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TAB_COMPONENTS[active];

  return (
    <div className="bio-adm-root">
      {/* Page heading */}
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Biography</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="biography" />
          <a href="/biography" target="_blank" rel="noreferrer" className="bio-adm-view-link">
          ↗ View Page
        </a>
        </div>
      </div>

      {/* Section tabs */}
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

      {/* Tab content */}
      <div className="bio-adm-content">
        {ActiveTab && <ActiveTab />}
      </div>
    </div>
  );
}

export default BiographyAdmin;
