import { useState, useEffect, useCallback } from 'react';
import {
  getAdminSettings, saveAdminSettings,
  getAdminPayment,  saveAdminPayment,
  getAdminEmail,    saveAdminEmail,
  getAdminDurations, createDuration, updateDuration, deleteDuration,
  getAdminBookings,  updateBooking,  deleteBooking,
  getAdminStats,
  getAdminTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot,
  getAdminDayAvailability, saveAdminDayAvailability,
  getAdminBlockedDates, addBlockedDate, deleteBlockedDate,
  getAdminDateSchedules, createDateSchedule, updateDateSchedule, deleteDateSchedule,
} from '../../services/bookingApi';
import './BookingAdmin.css';

// ── Small shared helpers ──────────────────────────────────────────────────────
function fmtINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Toggle({ checked, onChange }) {
  return (
    <label className="bka-switch">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span className="bka-switch-slider" />
    </label>
  );
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span className="adm-saved-msg">✓ Saved successfully</span>}
      {error && <span className="bka-save-err">✗ {error}</span>}
    </div>
  );
}

// ── Tab: Page Settings ────────────────────────────────────────────────────────
function TabPageSettings() {
  const [data,   setData]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState('');

  useEffect(() => { getAdminSettings().then(setData).catch(() => setData({})); }, []);

  const set  = (k, v) => setData(p => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setSaved(false); setErr('');
    try { await saveAdminSettings(data); setSaved(true); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="bka-loading">Loading…</div>;

  return (
    <>
      {/* Hero */}
      <div className="bka-sub-heading">
        <h3>Hero Section</h3>
        <p>Controls the title, eyebrow label, and description at the top of the booking page.</p>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">Hero Eyebrow Label</label>
          <input className="adm-input" value={data.hero_eyebrow || ''} onChange={e => set('hero_eyebrow', e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label">Page Title</label>
          <input className="adm-input" value={data.page_title || ''} onChange={e => set('page_title', e.target.value)} />
        </div>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">Hero Title</label>
          <input className="adm-input" value={data.hero_title || ''} onChange={e => set('hero_title', e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label">Italic Emphasis (part of title to italicise)</label>
          <input className="adm-input" value={data.hero_title_em || ''} onChange={e => set('hero_title_em', e.target.value)} placeholder="e.g. Discovery Session" />
        </div>
      </div>

      <div className="adm-field" style={{ marginBottom: '1.5rem' }}>
        <label className="adm-label">Hero Description</label>
        <textarea className="adm-input adm-textarea" rows={3} value={data.hero_description || ''} onChange={e => set('hero_description', e.target.value)} />
      </div>

      <div className="adm-field" style={{ marginBottom: '1.5rem' }}>
        <label className="adm-label">Page Subtitle / Meta Description</label>
        <textarea className="adm-input adm-textarea" rows={2} value={data.page_description || ''} onChange={e => set('page_description', e.target.value)} />
      </div>

      {/* Form Settings */}
      <div className="bka-sub-heading" style={{ marginTop: '0.5rem' }}>
        <h3>Form Settings</h3>
        <p>Enable or disable the booking form and customise the form header and confirmation message.</p>
      </div>

      <div className="bka-toggle-row" style={{ marginBottom: '1rem' }}>
        <Toggle checked={data.form_enabled} onChange={v => set('form_enabled', v)} />
        <span className="bka-toggle-label">Booking Form Enabled (visible on frontend)</span>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">Form Heading</label>
          <input className="adm-input" value={data.form_title || ''} onChange={e => set('form_title', e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label">Confirmation Title</label>
          <input className="adm-input" value={data.confirmation_title || ''} onChange={e => set('confirmation_title', e.target.value)} />
        </div>
      </div>

      <div className="adm-field" style={{ marginBottom: '1.5rem' }}>
        <label className="adm-label">Confirmation Message (shown after successful booking)</label>
        <textarea className="adm-input adm-textarea" rows={3} value={data.confirmation_message || ''} onChange={e => set('confirmation_message', e.target.value)} />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} error={err} />
    </>
  );
}

// ── Duration modal ────────────────────────────────────────────────────────────
function DurationModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    label: '', duration_minutes: '', price: '', currency: 'INR',
    description: '', is_active: true, sort_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.label || !form.duration_minutes || form.price === '') {
      setErr('Label, duration, and price are required.'); return;
    }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <div className="bka-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bka-modal">
        <h3 className="bka-modal-title">{initial?.id ? 'Edit Session Duration' : 'Add Session Duration'}</h3>

        <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
          <div className="adm-field">
            <label className="adm-label">Label <span style={{ color: '#d4670a' }}>*</span></label>
            <input className="adm-input" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. 1 Hour" />
          </div>
          <div className="adm-field">
            <label className="adm-label">Duration (minutes) <span style={{ color: '#d4670a' }}>*</span></label>
            <input className="adm-input" type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="60" />
          </div>
        </div>

        <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
          <div className="adm-field">
            <label className="adm-label">Price (₹) <span style={{ color: '#d4670a' }}>*</span></label>
            <input className="adm-input" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="50000" />
          </div>
          <div className="adm-field">
            <label className="adm-label">Display Order</label>
            <input className="adm-input" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
          </div>
        </div>

        <div className="adm-field" style={{ marginBottom: '1rem' }}>
          <label className="adm-label">Description</label>
          <textarea className="adm-input adm-textarea" rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} />
          <p className="adm-hint">Shown beneath the price on the booking form.</p>
        </div>

        <div className="bka-toggle-row" style={{ marginBottom: '0.5rem' }}>
          <Toggle checked={form.is_active} onChange={v => set('is_active', v)} />
          <span className="bka-toggle-label">Active (visible to customers)</span>
        </div>

        {err && <p style={{ color: '#c0392b', fontSize: '0.78rem', margin: '0.5rem 0 0' }}>{err}</p>}

        <div className="bka-modal-footer">
          <button className="adm-btn" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Duration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Durations ────────────────────────────────────────────────────────────
function TabDurations() {
  const [durations, setDurations] = useState([]);
  const [modal,     setModal]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    getAdminDurations().then(d => { setDurations(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(reload, [reload]);

  const handleSave = async (form) => {
    if (form.id) await updateDuration(form.id, form);
    else          await createDuration(form);
    reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session duration? This cannot be undone.')) return;
    await deleteDuration(id);
    reload();
  };

  if (loading) return <div className="bka-loading">Loading…</div>;

  return (
    <>
      <div className="bka-sub-heading">
        <h3>Session Durations &amp; Pricing</h3>
        <p>Add, edit, or remove session options. Price changes reflect immediately on the booking page.</p>
      </div>

      <div className="bka-table-header">
        <div />
        <button className="adm-btn adm-btn-primary" onClick={() => setModal({})}>
          + Add Duration
        </button>
      </div>

      <div className="bka-table-wrap">
        <table className="bka-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Description</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {durations.length === 0 ? (
              <tr><td colSpan={7}><div className="bka-table-empty">No durations yet. Click "Add Duration" to create one.</div></td></tr>
            ) : durations.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 700 }}>{d.label}</td>
                <td style={{ color: '#5a4e3a' }}>{d.duration_minutes} min</td>
                <td style={{ fontWeight: 700 }}>{fmtINR(d.price)}</td>
                <td style={{ color: '#9a8e78', fontSize: '0.82rem', maxWidth: 200 }}>{d.description || '—'}</td>
                <td>
                  <span className={`bka-badge ${d.is_active ? 'bka-badge-active' : 'bka-badge-inactive'}`}>
                    {d.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={{ color: '#9a8e78' }}>{d.sort_order}</td>
                <td>
                  <div className="bka-cell-actions">
                    <button className="adm-btn adm-btn-sm" onClick={() => setModal(d)}>Edit</button>
                    <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <DurationModal
          initial={modal.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Booking detail / edit modal ───────────────────────────────────────────────
function BookingDetailModal({ booking, onSave, onClose }) {
  const [status,      setStatus]      = useState(booking.status);
  const [payStatus,   setPayStatus]   = useState(booking.payment_status);
  const [bookingDate, setBookingDate] = useState(
    booking.booking_date ? booking.booking_date.split('T')[0] : ''
  );
  const [bookingTime, setBookingTime] = useState(booking.booking_time || '');
  const [notes,       setNotes]       = useState(booking.notes || '');
  const [saving,      setSaving]      = useState(false);   // null | 'save' | 'notify'
  const [savedMsg,    setSavedMsg]    = useState('');
  const [saveErr,     setSaveErr]     = useState('');

  const doSave = async (notify) => {
    setSaving(notify ? 'notify' : 'save');
    setSavedMsg(''); setSaveErr('');
    try {
      const result = await onSave(
        booking.id,
        { status, payment_status: payStatus, notes, booking_date: bookingDate, booking_time: bookingTime },
        notify
      );
      setSavedMsg(notify && result?.email_sent ? '✓ Saved and email sent' : '✓ Saved');
      setTimeout(onClose, 1200);
    } catch (e) {
      setSaveErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bka-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bka-modal" style={{ maxWidth: 600 }}>
        <h3 className="bka-modal-title">Edit Booking — {booking.booking_ref}</h3>

        {/* Read-only customer info */}
        <div className="bka-detail-grid" style={{ marginBottom: '1.25rem' }}>
          {[
            ['Customer',   booking.customer_name],
            ['Email',      booking.customer_email],
            ['Phone',      booking.customer_phone || '—'],
            ['Session',    booking.duration_label],
            ['Amount',     fmtINR(booking.price)],
            ['Payment ID', booking.payment_id || '—'],
          ].map(([l, v]) => (
            <div className="bka-detail-row" key={l}>
              <span className="bka-detail-label">{l}</span>
              <span className="bka-detail-value">{v}</span>
            </div>
          ))}
          {booking.session_requirements && (
            <div className="bka-detail-row">
              <span className="bka-detail-label">Requirements</span>
              <span className="bka-detail-value" style={{ fontSize: '0.83rem' }}>{booking.session_requirements}</span>
            </div>
          )}
        </div>

        {/* Editable fields */}
        <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
          <div className="adm-field">
            <label className="adm-label">Preferred Date</label>
            <input className="adm-input" type="date" value={bookingDate} min={today}
              onChange={e => setBookingDate(e.target.value)} />
          </div>
          <div className="adm-field">
            <label className="adm-label">Preferred Time</label>
            <input className="adm-input" type="text" value={bookingTime} placeholder="e.g. 10:00 AM"
              onChange={e => setBookingTime(e.target.value)} />
          </div>
        </div>

        <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
          <div className="adm-field">
            <label className="adm-label">Booking Status</label>
            <select className="adm-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label">Payment Status</label>
            <select className="adm-input" value={payStatus} onChange={e => setPayStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="adm-field" style={{ marginBottom: '1rem' }}>
          <label className="adm-label">Admin Notes</label>
          <textarea className="adm-input adm-textarea" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes (not visible to customer)" />
        </div>

        {savedMsg && <p style={{ color: '#2e7d32', fontSize: '0.82rem', margin: '0 0 0.75rem' }}>{savedMsg}</p>}
        {saveErr  && <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: '0 0 0.75rem' }}>✗ {saveErr}</p>}

        <div className="bka-modal-footer">
          <button className="adm-btn" onClick={onClose} disabled={!!saving}>Cancel</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="adm-btn" onClick={() => doSave(false)} disabled={!!saving}
              title="Save changes without sending an email">
              {saving === 'save' ? 'Saving…' : 'Save'}
            </button>
            <button className="adm-btn adm-btn-primary" onClick={() => doSave(true)} disabled={!!saving}
              title="Save changes and send updated booking details to customer and admin">
              {saving === 'notify' ? 'Saving…' : 'Save & Notify Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Bookings ─────────────────────────────────────────────────────────────
function TabBookings() {
  const [bookings, setBookings] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [statusF,  setStatusF]  = useState('');
  const [payF,     setPayF]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [detail,   setDetail]   = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusF) params.status         = statusF;
    if (payF)    params.payment_status = payF;
    getAdminBookings(params).then(r => {
      setBookings(r.bookings || []);
      setTotal(r.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, statusF, payF]);

  useEffect(reload, [reload]);

  const handleUpdate = async (id, data, notify = false) => {
    const result = await updateBooking(id, data, notify);
    reload();
    return result;
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking permanently?')) return;
    await deleteBooking(id); reload();
  };

  const pages = Math.ceil(total / 20);

  return (
    <>
      <div className="bka-sub-heading">
        <h3>All Bookings</h3>
        <p>View, filter, and manage all customer session bookings.</p>
      </div>

      <div className="bka-filter-row">
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={payF} onChange={e => { setPayF(e.target.value); setPage(1); }}>
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Payment Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <span className="bka-filter-count">{total} booking{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="bka-loading">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="bka-table-wrap"><div className="bka-table-empty">No bookings found matching your filters.</div></div>
      ) : (
        <div className="bka-table-wrap">
          <table className="bka-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Session</th>
                <th>Date &amp; Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#5a4e3a' }}>{b.booking_ref}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{b.customer_name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#9a8e78' }}>{b.customer_email}</div>
                  </td>
                  <td style={{ color: '#5a4e3a' }}>{b.duration_label}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>{b.booking_date ? fmtDate(b.booking_date) : '—'}</div>
                    {b.booking_time && <div style={{ color: '#9a8e78' }}>{b.booking_time}</div>}
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmtINR(b.price)}</td>
                  <td><span className={`bka-badge bka-badge-${b.status}`}>{b.status}</span></td>
                  <td><span className={`bka-badge bka-badge-${b.payment_status}`}>{b.payment_status}</span></td>
                  <td>
                    <div className="bka-cell-actions">
                      <button className="adm-btn adm-btn-sm" onClick={() => setDetail(b)}>Edit</button>
                      <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="bka-pagination">
          <button className="adm-btn adm-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="adm-btn adm-btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
        </div>
      )}

      {detail && (
        <BookingDetailModal booking={detail}
          onSave={(id, data, notify) => handleUpdate(id, data, notify)}
          onClose={() => setDetail(null)} />
      )}
    </>
  );
}

// ── Tab: Payment Gateway ──────────────────────────────────────────────────────
function TabPayment() {
  const [data,       setData]       = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [err,        setErr]        = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => { getAdminPayment().then(setData).catch(() => setData({})); }, []);

  const set  = (k, v) => setData(p => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setSaved(false); setErr('');
    try { await saveAdminPayment(data); setSaved(true); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="bka-loading">Loading…</div>;

  return (
    <>
      <div className="bka-sub-heading">
        <h3>Razorpay Payment Gateway</h3>
        <p>Connect your Razorpay account to accept online payments for session bookings.</p>
      </div>

      <div className="bka-info-note">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Your Key Secret is stored securely on the server and is never exposed to the browser or frontend code. The Key ID is used only inside the Razorpay checkout popup.
      </div>

      <div className="bka-toggle-row" style={{ marginBottom: '1.25rem' }}>
        <Toggle checked={data.is_enabled} onChange={v => set('is_enabled', v)} />
        <span className="bka-toggle-label">Enable Razorpay Payment Gateway</span>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">Razorpay Key ID</label>
          <input className="adm-input" value={data.razorpay_key_id || ''} onChange={e => set('razorpay_key_id', e.target.value)} placeholder="rzp_live_xxxxxxxxxxxx" />
          <p className="adm-hint">Starts with rzp_live_ (production) or rzp_test_ (test mode).</p>
        </div>
        <div className="adm-field">
          <label className="adm-label">Razorpay Key Secret</label>
          <div className="bka-pw-wrap">
            <input
              className="adm-input"
              type={showSecret ? 'text' : 'password'}
              value={data.razorpay_key_secret || ''}
              onChange={e => set('razorpay_key_secret', e.target.value)}
              placeholder="••••••••••••••••••••"
            />
            <button type="button" className="bka-pw-toggle" onClick={() => setShowSecret(s => !s)}>
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="adm-hint">Never share this key. Keep it confidential.</p>
        </div>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1.5rem' }}>
        <div className="adm-field">
          <label className="adm-label">Currency</label>
          <select className="adm-input" value={data.currency || 'INR'} onChange={e => set('currency', e.target.value)}>
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label">Payment Description</label>
          <input className="adm-input" value={data.payment_description || ''} onChange={e => set('payment_description', e.target.value)} placeholder="Discovery Session Booking" />
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} error={err} />
    </>
  );
}

// ── Tab: Email Notifications ──────────────────────────────────────────────────
function TabEmail() {
  const [data,     setData]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { getAdminEmail().then(setData).catch(() => setData({})); }, []);

  const set  = (k, v) => setData(p => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setSaved(false); setErr('');
    try { await saveAdminEmail(data); setSaved(true); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="bka-loading">Loading…</div>;

  return (
    <>
      <div className="bka-sub-heading">
        <h3>Email Notifications</h3>
        <p>Configure SMTP to send booking confirmations to customers and alert emails to yourself when a new booking is received.</p>
      </div>

      <div className="bka-toggle-row" style={{ marginBottom: '1.25rem' }}>
        <Toggle checked={data.is_enabled} onChange={v => set('is_enabled', v)} />
        <span className="bka-toggle-label">Enable Email Notifications</span>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">SMTP Host</label>
          <input className="adm-input" value={data.smtp_host || ''} onChange={e => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="adm-field">
          <label className="adm-label">SMTP Port</label>
          <input className="adm-input" type="number" value={data.smtp_port || 587} onChange={e => set('smtp_port', e.target.value)} />
          <p className="adm-hint">Use 587 (TLS) or 465 (SSL).</p>
        </div>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">SMTP Username</label>
          <input className="adm-input" value={data.smtp_user || ''} onChange={e => set('smtp_user', e.target.value)} placeholder="you@gmail.com" />
        </div>
        <div className="adm-field">
          <label className="adm-label">SMTP Password / App Password</label>
          <div className="bka-pw-wrap">
            <input
              className="adm-input"
              type={showPass ? 'text' : 'password'}
              value={data.smtp_pass || ''}
              onChange={e => set('smtp_pass', e.target.value)}
              placeholder="••••••••••••••••"
            />
            <button type="button" className="bka-pw-toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
        <div className="adm-field">
          <label className="adm-label">From Email Address</label>
          <input className="adm-input" value={data.smtp_from || ''} onChange={e => set('smtp_from', e.target.value)} placeholder="noreply@alchmi.com" />
        </div>
        <div className="adm-field">
          <label className="adm-label">From Display Name</label>
          <input className="adm-input" value={data.smtp_from_name || ''} onChange={e => set('smtp_from_name', e.target.value)} placeholder="Alchmi" />
        </div>
      </div>

      <div className="adm-field" style={{ marginBottom: '1.25rem' }}>
        <label className="adm-label">Admin Notification Email</label>
        <input className="adm-input" value={data.admin_email || ''} onChange={e => set('admin_email', e.target.value)} placeholder="admin@alchmi.com" />
        <p className="adm-hint">New booking alerts will be sent to this address.</p>
      </div>

      <div className="adm-field-row" style={{ marginBottom: '1.5rem' }}>
        <div className="adm-field">
          <label className="adm-label">Customer Email Subject</label>
          <input className="adm-input" value={data.customer_subject || ''} onChange={e => set('customer_subject', e.target.value)} placeholder="Your Discovery Session is Confirmed" />
        </div>
        <div className="adm-field">
          <label className="adm-label">Admin Alert Subject</label>
          <input className="adm-input" value={data.admin_subject || ''} onChange={e => set('admin_subject', e.target.value)} placeholder="New Discovery Session Booking" />
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} error={err} />
    </>
  );
}

// ── Time slot modal ───────────────────────────────────────────────────────────
function TimeSlotModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { label: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.label.trim()) { setErr('Time label is required.'); return; }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <div className="bka-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bka-modal" style={{ maxWidth: 400 }}>
        <h3 className="bka-modal-title">{initial?.id ? 'Edit Time Slot' : 'Add Time Slot'}</h3>

        <div className="adm-field" style={{ marginBottom: '1rem' }}>
          <label className="adm-label">Time Label <span style={{ color: '#d4670a' }}>*</span></label>
          <input className="adm-input" value={form.label}
            onChange={e => set('label', e.target.value)} placeholder="e.g. 09:00 AM" />
          <p className="adm-hint">Use a consistent format, e.g. 09:00 AM, 02:30 PM.</p>
        </div>

        <div className="adm-field-row" style={{ marginBottom: '1rem' }}>
          <div className="adm-field">
            <label className="adm-label">Display Order</label>
            <input className="adm-input" type="number" value={form.sort_order}
              onChange={e => set('sort_order', Number(e.target.value))} />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
            <div className="bka-toggle-row" style={{ padding: 0 }}>
              <Toggle checked={form.is_active} onChange={v => set('is_active', v)} />
              <span className="bka-toggle-label">Active</span>
            </div>
          </div>
        </div>

        {err && <p style={{ color: '#c0392b', fontSize: '0.78rem', margin: '0.25rem 0' }}>{err}</p>}

        <div className="bka-modal-footer">
          <button className="adm-btn" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Availability ─────────────────────────────────────────────────────────
const DAY_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function TabAvailability() {
  // Time slots state
  const [slots,      setSlots]      = useState([]);
  const [slotModal,  setSlotModal]  = useState(null);
  const [slotsLoad,  setSlotsLoad]  = useState(true);

  // Day availability state
  const [days,       setDays]       = useState([]);
  const [daysSaving, setDaysSaving] = useState(false);
  const [daysSaved,  setDaysSaved]  = useState(false);
  const [daysErr,    setDaysErr]    = useState('');

  // Blocked dates state
  const [blocked,    setBlocked]    = useState([]);
  const [newDate,    setNewDate]    = useState('');
  const [newReason,  setNewReason]  = useState('');
  const [addingDate, setAddingDate] = useState(false);
  const [dateErr,    setDateErr]    = useState('');

  // Date-specific schedules state
  const [schedules,      setSchedules]      = useState([]);
  const [schedModal,     setSchedModal]     = useState(null); // null | {} | existing schedule
  const [schedsLoading,  setSchedsLoading]  = useState(true);

  const reloadSlots = useCallback(() => {
    setSlotsLoad(true);
    getAdminTimeSlots().then(s => { setSlots(s); setSlotsLoad(false); }).catch(() => setSlotsLoad(false));
  }, []);

  const reloadSchedules = useCallback(() => {
    setSchedsLoading(true);
    getAdminDateSchedules().then(s => { setSchedules(s); setSchedsLoading(false); }).catch(() => setSchedsLoading(false));
  }, []);

  useEffect(() => {
    reloadSlots();
    getAdminDayAvailability().then(setDays).catch(() => {});
    getAdminBlockedDates().then(setBlocked).catch(() => {});
    reloadSchedules();
  }, [reloadSlots, reloadSchedules]);

  // Time slots
  const handleSlotSave = async (form) => {
    if (form.id) await updateTimeSlot(form.id, form);
    else          await createTimeSlot(form);
    reloadSlots();
  };
  const handleSlotDelete = async (id) => {
    if (!window.confirm('Delete this time slot?')) return;
    await deleteTimeSlot(id); reloadSlots();
  };

  // Day availability
  const toggleDay = (dow) => {
    setDays(prev => prev.map(d => d.day_of_week === dow ? { ...d, is_available: !d.is_available } : d));
    setDaysSaved(false);
  };
  const saveDays = async () => {
    setDaysSaving(true); setDaysSaved(false); setDaysErr('');
    try { await saveAdminDayAvailability(days); setDaysSaved(true); }
    catch (e) { setDaysErr(e.message); }
    finally { setDaysSaving(false); }
  };

  // Blocked dates
  const handleAddDate = async () => {
    if (!newDate) { setDateErr('Please select a date.'); return; }
    setDateErr(''); setAddingDate(true);
    try {
      const entry = await addBlockedDate({ blocked_date: newDate, reason: newReason || null });
      setBlocked(prev => [...prev, entry].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)));
      setNewDate(''); setNewReason('');
    } catch (e) { setDateErr(e.message); }
    finally { setAddingDate(false); }
  };
  const handleRemoveDate = async (id) => {
    await deleteBlockedDate(id);
    setBlocked(prev => prev.filter(b => b.id !== id));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* ── Time Slots ── */}
      <div className="bka-sub-heading">
        <h3>Time Slots</h3>
        <p>Manage the time slots customers can choose when booking. Disable or delete slots to remove them from the booking form.</p>
      </div>

      <div className="bka-table-header">
        <div />
        <button className="adm-btn adm-btn-primary" onClick={() => setSlotModal({})}>+ Add Time Slot</button>
      </div>

      {slotsLoad ? (
        <div className="bka-loading">Loading…</div>
      ) : (
        <div className="bka-table-wrap" style={{ marginBottom: '2rem' }}>
          <table className="bka-table">
            <thead>
              <tr>
                <th>Time Label</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 ? (
                <tr><td colSpan={4}><div className="bka-table-empty">No time slots yet. Add one above.</div></td></tr>
              ) : slots.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.label}</td>
                  <td style={{ color: '#9a8e78' }}>{s.sort_order}</td>
                  <td>
                    <span className={`bka-badge ${s.is_active ? 'bka-badge-active' : 'bka-badge-inactive'}`}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="bka-cell-actions">
                      <button className="adm-btn adm-btn-sm" onClick={() => setSlotModal(s)}>Edit</button>
                      <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleSlotDelete(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {slotModal !== null && (
        <TimeSlotModal
          initial={slotModal.id ? slotModal : null}
          onSave={handleSlotSave}
          onClose={() => setSlotModal(null)}
        />
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #f0ece4', margin: '0.5rem 0 1.75rem' }} />

      {/* ── Day Availability ── */}
      <div className="bka-sub-heading">
        <h3>Available Days</h3>
        <p>Select which days of the week customers can book sessions. Unchecked days will show an error if selected.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {DAY_LABELS.map((label, dow) => {
          const dayRow = days.find(d => d.day_of_week === dow);
          const active = dayRow ? !!dayRow.is_available : (dow >= 1 && dow <= 5);
          return (
            <button
              key={dow}
              onClick={() => toggleDay(dow)}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '6px',
                border: `2px solid ${active ? '#d4670a' : '#e0d8cc'}`,
                background: active ? '#fff5ee' : '#fff',
                color: active ? '#d4670a' : '#9a8e78',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {active ? '✓ ' : ''}{label}
            </button>
          );
        })}
      </div>

      <div className="adm-save-bar" style={{ marginBottom: '2rem' }}>
        <button className="adm-btn adm-btn-primary" onClick={saveDays} disabled={daysSaving}>
          {daysSaving ? 'Saving…' : 'Save Day Settings'}
        </button>
        {daysSaved  && <span className="adm-saved-msg">✓ Saved successfully</span>}
        {daysErr    && <span className="bka-save-err">✗ {daysErr}</span>}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f0ece4', margin: '0.5rem 0 1.75rem' }} />

      {/* ── Blocked Dates ── */}
      <div className="bka-sub-heading">
        <h3>Blocked Dates</h3>
        <p>Block specific dates (public holidays, leave, fully-booked days). Customers will not be able to select these dates.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="adm-field" style={{ flex: '0 0 180px' }}>
          <label className="adm-label">Date to Block</label>
          <input className="adm-input" type="date" value={newDate} min={today}
            onChange={e => { setNewDate(e.target.value); setDateErr(''); }} />
        </div>
        <div className="adm-field" style={{ flex: '1 1 200px' }}>
          <label className="adm-label">Reason (optional)</label>
          <input className="adm-input" value={newReason} placeholder="e.g. Public holiday"
            onChange={e => setNewReason(e.target.value)} />
        </div>
        <button className="adm-btn adm-btn-primary" onClick={handleAddDate} disabled={addingDate}
          style={{ marginBottom: '0.35rem', flexShrink: 0 }}>
          {addingDate ? 'Adding…' : '+ Block Date'}
        </button>
      </div>
      {dateErr && <p style={{ color: '#c0392b', fontSize: '0.78rem', margin: '-0.5rem 0 0.75rem' }}>{dateErr}</p>}

      {blocked.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9a8e78', fontSize: '0.88rem',
          background: '#fdf9f4', borderRadius: '6px', border: '1px solid #e8e0d4' }}>
          No dates blocked. Add a date above to prevent bookings on that day.
        </div>
      ) : (
        <div className="bka-table-wrap">
          <table className="bka-table">
            <thead>
              <tr><th>Date</th><th>Day</th><th>Reason</th><th>Action</th></tr>
            </thead>
            <tbody>
              {blocked.map(b => {
                const d    = new Date(b.blocked_date + 'T12:00:00');
                const dow  = d.getDay();
                const nice = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{nice}</td>
                    <td style={{ color: '#9a8e78' }}>{DAY_LABELS[dow]}</td>
                    <td style={{ color: '#5a4e3a', fontSize: '0.85rem' }}>{b.reason || '—'}</td>
                    <td>
                      <button className="adm-btn adm-btn-sm adm-btn-danger"
                        onClick={() => handleRemoveDate(b.id)}>Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #f0ece4', margin: '1.75rem 0' }} />

      {/* ── Date-Specific Schedules ── */}
      <div className="bka-sub-heading">
        <h3>Date-Specific Schedules</h3>
        <p>Override the default time slots for a specific date. When a custom schedule exists for a date, only its slots are shown to customers — the global time slots are ignored for that day.</p>
      </div>

      <div className="bka-table-header">
        <div />
        <button className="adm-btn adm-btn-primary" onClick={() => setSchedModal({})}>+ Add Custom Schedule</button>
      </div>

      {schedsLoading ? (
        <div className="bka-loading">Loading…</div>
      ) : schedules.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9a8e78', fontSize: '0.88rem',
          background: '#fdf9f4', borderRadius: '6px', border: '1px solid #e8e0d4', marginBottom: '1rem' }}>
          No date-specific schedules. Add one above to override the time slots for a particular date.
        </div>
      ) : (
        <div className="bka-table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="bka-table">
            <thead>
              <tr><th>Date</th><th>Day</th><th>Time Slots</th><th>Note</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {schedules.map(sc => {
                const d    = new Date(sc.schedule_date + 'T12:00:00');
                const dow  = d.getDay();
                const nice = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                return (
                  <tr key={sc.id}>
                    <td style={{ fontWeight: 700 }}>{nice}</td>
                    <td style={{ color: '#9a8e78' }}>{DAY_LABELS[dow]}</td>
                    <td style={{ fontSize: '0.82rem', color: '#5a4e3a' }}>
                      {(sc.slots || []).join(', ') || <span style={{ color: '#9a8e78' }}>—</span>}
                    </td>
                    <td style={{ color: '#9a8e78', fontSize: '0.82rem' }}>{sc.note || '—'}</td>
                    <td>
                      <div className="bka-cell-actions">
                        <button className="adm-btn adm-btn-sm" onClick={() => setSchedModal(sc)}>Edit</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger"
                          onClick={async () => {
                            if (!window.confirm('Delete this custom schedule?')) return;
                            await deleteDateSchedule(sc.id);
                            reloadSchedules();
                          }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {schedModal !== null && (
        <DateScheduleModal
          initial={schedModal.id ? schedModal : null}
          globalSlots={slots}
          onSave={async (form) => {
            if (form.id) await updateDateSchedule(form.id, form);
            else          await createDateSchedule(form);
            reloadSchedules();
            setSchedModal(null);
          }}
          onClose={() => setSchedModal(null)}
        />
      )}
    </>
  );
}

// ── DateScheduleModal ─────────────────────────────────────────────────────────
function DateScheduleModal({ initial, globalSlots, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [schedDate,   setSchedDate]   = useState(initial?.schedule_date || '');
  const [note,        setNote]        = useState(initial?.note || '');
  const [selected,    setSelected]    = useState(() => new Set(initial?.slots || []));
  const [customInput, setCustomInput] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');

  const toggleSlot = (label) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    setSelected(prev => new Set([...prev, v]));
    setCustomInput('');
  };

  const removeSlot = (label) => {
    setSelected(prev => { const n = new Set(prev); n.delete(label); return n; });
  };

  const handleSave = async () => {
    if (!schedDate) { setErr('Please select a date.'); return; }
    if (selected.size === 0) { setErr('Add at least one time slot.'); return; }
    setErr(''); setSaving(true);
    try {
      await onSave({ id: initial?.id, schedule_date: schedDate, note, slots: [...selected] });
    } catch (e) { setErr(e.message); setSaving(false); }
  };

  // Global slot labels for the checkbox list
  const globalLabels = (globalSlots || []).filter(s => s.is_active).map(s => s.label);
  // Extra custom slots not in global list
  const extraLabels  = [...selected].filter(l => !globalLabels.includes(l));

  return (
    <div className="bka-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bka-modal" style={{ maxWidth: 520 }}>
        <div className="bka-modal-header">
          <h3>{initial ? 'Edit Custom Schedule' : 'Add Custom Schedule'}</h3>
          <button className="bka-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="bka-modal-body">
          <div className="adm-field">
            <label className="adm-label">Date <span style={{ color: '#d4670a' }}>*</span></label>
            <input className="adm-input" type="date" value={schedDate} min={today}
              onChange={e => setSchedDate(e.target.value)} disabled={!!initial} />
            {initial && <span className="adm-hint">Date cannot be changed after creation.</span>}
          </div>

          <div className="adm-field">
            <label className="adm-label">Note (optional)</label>
            <input className="adm-input" value={note} placeholder="e.g. Special half-day schedule"
              onChange={e => setNote(e.target.value)} />
          </div>

          <div className="adm-field">
            <label className="adm-label">Time Slots for this Date <span style={{ color: '#d4670a' }}>*</span></label>
            <span className="adm-hint">Check the global slots to include, or add custom times below.</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
              {globalLabels.map(label => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer',
                  border: `2px solid ${selected.has(label) ? '#d4670a' : '#e0d8cc'}`,
                  background: selected.has(label) ? '#fff5ee' : '#fdf9f4',
                  fontSize: '0.82rem', fontWeight: 600, color: selected.has(label) ? '#d4670a' : '#5a4e3a',
                  userSelect: 'none' }}>
                  <input type="checkbox" checked={selected.has(label)} onChange={() => toggleSlot(label)}
                    style={{ accentColor: '#d4670a' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {extraLabels.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {extraLabels.map(label => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.6rem', borderRadius: '6px', background: '#fff5ee',
                  border: '1px solid #d4670a', fontSize: '0.8rem', color: '#d4670a', fontWeight: 600 }}>
                  {label}
                  <button onClick={() => removeSlot(label)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4670a',
                      fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '0.2rem' }}>×</button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input className="adm-input" value={customInput} placeholder="e.g. 07:00 AM"
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              style={{ flex: 1, fontSize: '0.85rem' }} />
            <button className="adm-btn adm-btn-primary" onClick={addCustom} style={{ flexShrink: 0 }}>Add</button>
          </div>
          <span className="adm-hint" style={{ marginTop: '0.35rem', display: 'block' }}>
            Type a custom time and press Add or Enter.
          </span>

          {err && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{err}</p>}
        </div>
        <div className="bka-modal-footer">
          <button className="adm-btn" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'settings',     label: 'Page Settings'      },
  { id: 'durations',    label: 'Durations & Pricing' },
  { id: 'availability', label: 'Availability'        },
  { id: 'bookings',     label: 'Bookings'            },
  { id: 'payment',      label: 'Payment Gateway'     },
  { id: 'email',        label: 'Email Notifications' },
];

export default function BookingAdmin() {
  const [activeTab, setActiveTab] = useState('settings');
  const [stats,     setStats]     = useState(null);

  useEffect(() => { getAdminStats().then(setStats).catch(() => {}); }, []);

  return (
    <div className="bka-root">

      <div className="bka-page-header">
        <span className="bka-eyebrow">Booking System</span>
        <h1 className="bka-page-title">Discovery Session Bookings</h1>
        <p className="bka-page-desc">
          Manage the booking page, session pricing, customer bookings, Razorpay payment gateway, and email notifications.
        </p>
      </div>

      {stats && (
        <div className="bka-stats">
          <div className="bka-stat">
            <div className="bka-stat-value">{stats.total}</div>
            <div className="bka-stat-label">Total Bookings</div>
          </div>
          <div className="bka-stat">
            <div className="bka-stat-value">{stats.confirmed}</div>
            <div className="bka-stat-label">Confirmed</div>
          </div>
          <div className="bka-stat">
            <div className="bka-stat-value">{stats.pending}</div>
            <div className="bka-stat-label">Pending</div>
          </div>
          <div className="bka-stat">
            <div className="bka-stat-value">{fmtINR(stats.revenue)}</div>
            <div className="bka-stat-label">Revenue (Paid)</div>
          </div>
        </div>
      )}

      <div className="bka-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`bka-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bka-tab-content">
        {activeTab === 'settings'     && <TabPageSettings />}
        {activeTab === 'durations'    && <TabDurations />}
        {activeTab === 'availability' && <TabAvailability />}
        {activeTab === 'bookings'     && <TabBookings />}
        {activeTab === 'payment'      && <TabPayment />}
        {activeTab === 'email'        && <TabEmail />}
      </div>

    </div>
  );
}
