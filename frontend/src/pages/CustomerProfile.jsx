import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import '../components/Sections/InnerPageHero.css';
import './CustomerProfile.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BASE = API.replace('/api', '');

const ORG_TYPES = ['Startup', 'SME', 'Enterprise', 'Non-Profit / NGO', 'Government', 'Educational Institution', 'Individual / Freelancer', 'Other'];

function resolveUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

export default function CustomerProfile() {
  const { customer, loading, logout, refreshProfile, getToken } = useCustomerAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('profile');
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [bookings, setBookings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]       = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [photoUploading, setPhotoUploading]   = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const photoInputRef  = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !customer) navigate('/');
  }, [loading, customer, navigate]);

  // Signal to Header that this page has a dark inner hero — nav links flip to white
  useEffect(() => {
    document.body.setAttribute('data-hero-theme', 'dark');
    return () => document.body.removeAttribute('data-hero-theme');
  }, []);

  useEffect(() => {
    if (customer) {
      setForm({
        full_name:         customer.full_name || '',
        phone:             customer.phone || '',
        company_name:      customer.company_name || '',
        gst_number:        customer.gst_number || '',
        organization_type: customer.organization_type || '',
        office_number:     customer.office_number || '',
        address:           customer.address || '',
        num_employees:     customer.num_employees || '',
      });
    }
  }, [customer]);

  useEffect(() => {
    if (tab === 'bookings' && customer) {
      setBLoading(true);
      fetch(`${API}/customer-auth/bookings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(r => r.json())
        .then(data => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setBookings([]))
        .finally(() => setBLoading(false));
    }
  }, [tab, customer, getToken]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`${API}/customer-auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshProfile();
      setSaveMsg('Profile updated successfully.');
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    setPhotoUploading(true);
    try {
      const res = await fetch(`${API}/customer-auth/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('banner', file);
    setBannerUploading(true);
    try {
      const res = await fetch(`${API}/customer-auth/banner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      alert('Banner upload failed: ' + err.message);
    } finally {
      setBannerUploading(false);
      e.target.value = '';
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.next !== pwForm.confirm) { setPwMsg('New passwords do not match.'); return; }
    if (pwForm.next.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/customer-auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMsg('Password changed successfully.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg(`Error: ${err.message}`);
    } finally {
      setPwSaving(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) {
    return <div className="cp-loading"><span className="cp-spinner" /></div>;
  }
  if (!customer) return null;

  const photoSrc  = resolveUrl(customer.profile_photo);
  const bannerSrc = resolveUrl(customer.hero_banner);

  const statusBadge = (s) => {
    const map = { confirmed: '#27ae60', pending: '#e67e22', cancelled: '#c0392b', completed: '#2980b9' };
    return <span style={{ background: map[s] || '#999', color: '#fff', padding: '2px 8px', borderRadius: 2, fontSize: '0.65rem', fontFamily: 'Josefin Sans', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s}</span>;
  };

  return (
    <div className="cp-page-wrapper">

      {/* ── Hero Banner ── */}
      {/* Inject personal banner AFTER the gc-overrides style so it wins the !important race */}
      {bannerSrc && (
        <style>{`.cp-profile-hero.inner-hero { background: linear-gradient(rgba(26,18,8,0.5), rgba(26,18,8,0.5)), url(${bannerSrc}) !important; background-size: cover !important; background-position: center !important; }`}</style>
      )}
      <section className="inner-hero cp-profile-hero">
        {/* Mandala decoration */}
        <div className="hero-mandala" aria-hidden="true">
          <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="mandala-svg">
            <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8">
              <circle cx="250" cy="250" r="240"/>
              <circle cx="250" cy="250" r="210"/>
              <circle cx="250" cy="250" r="180"/>
              <circle cx="250" cy="250" r="145"/>
              <circle cx="250" cy="250" r="110"/>
              <circle cx="250" cy="250" r="78"/>
              <circle cx="250" cy="250" r="48"/>
              <circle cx="250" cy="250" r="22"/>
              <line x1="250" y1="10" x2="250" y2="490"/>
              <line x1="10" y1="250" x2="490" y2="250"/>
              <line x1="80" y1="80" x2="420" y2="420"/>
              <line x1="420" y1="80" x2="80" y2="420"/>
              <polygon points="250,52 452,390 48,390"/>
              <polygon points="250,448 48,110 452,110"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(0 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(45 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(90 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(135 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(180 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(225 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(270 250 250)"/>
              <ellipse cx="250" cy="22" rx="14" ry="28" transform="rotate(315 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(0 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(45 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(90 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(135 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(180 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(225 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(270 250 250)"/>
              <ellipse cx="250" cy="115" rx="10" ry="22" transform="rotate(315 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(0 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(45 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(90 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(135 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(180 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(225 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(270 250 250)"/>
              <circle cx="250" cy="68" r="3" fill="rgba(255,255,255,0.2)" stroke="none" transform="rotate(315 250 250)"/>
              <circle cx="250" cy="250" r="6" fill="rgba(255,255,255,0.15)" stroke="none"/>
            </g>
          </svg>
        </div>

        {/* Banner upload button */}
        <button
          className="cp-hero-upload-btn"
          onClick={() => bannerInputRef.current?.click()}
          title="Change hero banner image"
        >
          {bannerUploading ? 'Uploading…' : '⊕ Change Banner'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleBannerChange}
        />

        <div className="inner-hero-eyebrow">
          {customer.company_name || (customer.organization_type || 'Member')}
        </div>
        <h1>{customer.full_name}</h1>
        <p className="inner-hero-sub">{customer.email}</p>
        <div className="inner-hero-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          My Profile
        </div>
      </section>

      {/* ── Page Content ── */}
      <div className="cp-page">
        <div className="cp-container">

          {/* Sidebar */}
          <aside className="cp-sidebar">
            <div className="cp-avatar-wrap">
              <div className="cp-avatar" onClick={() => photoInputRef.current?.click()}>
                {photoSrc
                  ? <img src={photoSrc} alt="Profile" className="cp-avatar-img" />
                  : <span className="cp-avatar-initials">{customer.full_name?.[0]?.toUpperCase() || '?'}</span>}
                <div className="cp-avatar-overlay">{photoUploading ? '…' : '✎'}</div>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <p className="cp-avatar-hint">Click to change photo</p>
            </div>

            <div className="cp-user-info">
              <p className="cp-user-name">{customer.full_name}</p>
              <p className="cp-user-email">{customer.email}</p>
              {customer.company_name && <p className="cp-user-company">{customer.company_name}</p>}
            </div>

            <nav className="cp-tabs">
              {[
                { id: 'profile',  label: 'My Profile' },
                { id: 'bookings', label: 'My Bookings' },
                { id: 'security', label: 'Security' },
              ].map(t => (
                <button
                  key={t.id}
                  className={`cp-tab${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <button className="cp-logout" onClick={() => { logout(); navigate('/'); }}>
              Sign Out
            </button>
          </aside>

          {/* Main content */}
          <main className="cp-main">

            {/* ── Profile Tab ── */}
            {tab === 'profile' && (
              <form className="cp-form" onSubmit={handleSave}>
                <h2 className="cp-section-title">Profile Information</h2>

                <div className="cp-grid-2">
                  <div className="cp-field">
                    <label>Full Name <span className="cp-req">*</span></label>
                    <input value={form.full_name} onChange={set('full_name')} required />
                  </div>
                  <div className="cp-field">
                    <label>Email Address</label>
                    <input value={customer.email} readOnly className="cp-readonly" />
                  </div>
                  <div className="cp-field">
                    <label>Phone Number</label>
                    <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                  </div>
                  <div className="cp-field">
                    <label>Office Number</label>
                    <input value={form.office_number} onChange={set('office_number')} placeholder="Office / landline" />
                  </div>
                  <div className="cp-field">
                    <label>Company Name</label>
                    <input value={form.company_name} onChange={set('company_name')} />
                  </div>
                  <div className="cp-field">
                    <label>GST Number</label>
                    <input value={form.gst_number} onChange={set('gst_number')} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div className="cp-field">
                    <label>Organization Type</label>
                    <select value={form.organization_type} onChange={set('organization_type')}>
                      <option value="">— Select —</option>
                      {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="cp-field">
                    <label>Number of Employees</label>
                    <input type="number" min="1" value={form.num_employees} onChange={set('num_employees')} />
                  </div>
                  <div className="cp-field cp-span-2">
                    <label>Address</label>
                    <textarea rows={3} value={form.address} onChange={set('address')} />
                  </div>
                </div>

                {saveMsg && (
                  <p className={`cp-msg${saveMsg.startsWith('Error') ? ' cp-msg-err' : ''}`}>{saveMsg}</p>
                )}
                <button className="cp-save-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* ── Bookings Tab ── */}
            {tab === 'bookings' && (
              <div>
                <h2 className="cp-section-title">My Bookings</h2>
                {bLoading && <p className="cp-loading-text">Loading bookings…</p>}
                {!bLoading && bookings.length === 0 && (
                  <p className="cp-empty">No bookings found. <a href="/book-discovery" style={{ color: '#b8922a' }}>Book a Discovery Session →</a></p>
                )}
                {!bLoading && bookings.map(b => (
                  <div key={b.id} className="cp-booking-card">
                    <div className="cp-bk-header">
                      <span className="cp-bk-ref">#{b.booking_ref}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {statusBadge(b.status)}
                        {statusBadge(b.payment_status)}
                      </div>
                    </div>
                    <div className="cp-bk-grid">
                      <div><span className="cp-bk-label">Session</span><span>{b.duration_label}</span></div>
                      <div><span className="cp-bk-label">Date</span><span>{b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
                      <div><span className="cp-bk-label">Time</span><span>{b.booking_time || '—'}</span></div>
                      <div><span className="cp-bk-label">Amount</span><span>{b.currency} {Number(b.price).toLocaleString('en-IN')}</span></div>
                    </div>
                    {b.session_requirements && (
                      <p className="cp-bk-notes"><strong>Notes:</strong> {b.session_requirements}</p>
                    )}
                    <p className="cp-bk-date">Booked on {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Security Tab ── */}
            {tab === 'security' && (
              <form className="cp-form" onSubmit={handlePwChange}>
                <h2 className="cp-section-title">Change Password</h2>
                <div className="cp-grid-1">
                  <div className="cp-field">
                    <label>Current Password</label>
                    <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} autoComplete="current-password" />
                  </div>
                  <div className="cp-field">
                    <label>New Password</label>
                    <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} autoComplete="new-password" />
                  </div>
                  <div className="cp-field">
                    <label>Confirm New Password</label>
                    <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" />
                  </div>
                </div>
                {pwMsg && (
                  <p className={`cp-msg${pwMsg.startsWith('Error') ? ' cp-msg-err' : ''}`}>{pwMsg}</p>
                )}
                <button className="cp-save-btn" type="submit" disabled={pwSaving}>
                  {pwSaving ? 'Saving…' : 'Change Password'}
                </button>
              </form>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
