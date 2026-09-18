import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ORG_TYPES = ['Startup', 'SME', 'Enterprise', 'Non-Profit / NGO', 'Government', 'Educational Institution', 'Individual / Freelancer', 'Other'];

function getToken() { return localStorage.getItem('vk_admin_token'); }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }

const EMPTY_FORM = { full_name: '', email: '', phone: '', company_name: '', gst_number: '', organization_type: '', office_number: '', address: '', num_employees: '' };

const inputStyle = { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d4c4a0', borderRadius: 2, fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: '#1a1208', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const labelStyle = { fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7d6b', display: 'block', marginBottom: 4 };

function FieldGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function CustomersAdmin() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [selected, setSelected]     = useState(null);   // customer for detail/edit
  const [detailBookings, setDetailBookings] = useState([]);
  const [modal, setModal]           = useState(null);   // 'create' | 'edit' | 'detail'
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resettingPw, setResettingPw]     = useState(null);
  const [newPlain, setNewPlain]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`${API}/customers?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c) => {
    setSelected(c);
    setModal('detail');
    try {
      const res = await fetch(`${API}/customers/${c.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.customer) setSelected(data.customer);
      setDetailBookings(data.bookings || []);
    } catch {}
  };

  const openEdit = (c) => {
    setSelected(c);
    setForm({
      full_name: c.full_name || '', email: c.email || '', phone: c.phone || '',
      company_name: c.company_name || '', gst_number: c.gst_number || '',
      organization_type: c.organization_type || '', office_number: c.office_number || '',
      address: c.address || '', num_employees: c.num_employees || '',
    });
    setSaveMsg('');
    setModal('edit');
  };

  const openCreate = () => {
    setSelected(null); setForm(EMPTY_FORM); setSaveMsg(''); setNewPlain('');
    setModal('create');
  };

  const closeModal = () => { setModal(null); setSelected(null); setDetailBookings([]); setSaveMsg(''); setNewPlain(''); };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, send_credentials: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPlain(data.plain_password || '');
      setSaveMsg('Customer created. Credentials sent by email.');
      load();
    } catch (err) { setSaveMsg(`Error: ${err.message}`); }
    setSaving(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`${API}/customers/${selected.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaveMsg('Customer updated.');
      load();
    } catch (err) { setSaveMsg(`Error: ${err.message}`); }
    setSaving(false);
  };

  const toggleStatus = async (c) => {
    try {
      await fetch(`${API}/customers/${c.id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      load();
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/customers/${deleteConfirm.id}`, { method: 'DELETE', headers: authHeaders() });
      setDeleteConfirm(null);
      load();
    } catch {}
  };

  const handleResetPw = async (c) => {
    setResettingPw(c.id);
    try {
      const res = await fetch(`${API}/customers/${c.id}/reset-password`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('New credentials sent to ' + c.email);
    } catch (err) { alert('Failed: ' + err.message); }
    setResettingPw(null);
  };

  const statusBadge = (active) => (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px', borderRadius: 2,
      fontSize: '0.62rem', fontFamily: 'Josefin Sans, sans-serif',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: active ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.1)',
      color: active ? '#1a6e3c' : '#8b1a1a',
      border: `1px solid ${active ? '#27ae60' : '#c0392b'}`,
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: '#1a1208' }}>Customers</h1>
          <p style={{ margin: '4px 0 0', fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.65rem', color: '#8a7d6b', letterSpacing: '0.1em' }}>
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} style={{ padding: '0.6rem 1.4rem', background: '#b8922a', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
          + Add Customer
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading
        ? <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.75rem', color: '#8a7d6b' }}>Loading…</p>
        : customers.length === 0
          ? <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.75rem', color: '#8a7d6b' }}>No customers found.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Cormorant Garamond, serif' }}>
                <thead>
                  <tr style={{ background: '#fdf6e3', borderBottom: '2px solid #e8c96d' }}>
                    {['Name', 'Email', 'Phone', 'Company', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7d6b', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0e6cc' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1208' }}>{c.full_name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#5a4e40' }}>{c.email}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#5a4e40' }}>{c.phone || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#5a4e40' }}>{c.company_name || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{statusBadge(c.is_active)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#8a7d6b', whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Btn onClick={() => openDetail(c)} color="#2980b9">View</Btn>
                          <Btn onClick={() => openEdit(c)} color="#b8922a">Edit</Btn>
                          <Btn onClick={() => toggleStatus(c)} color={c.is_active ? '#e67e22' : '#27ae60'}>
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </Btn>
                          <Btn onClick={() => handleResetPw(c)} color="#8e44ad" disabled={resettingPw === c.id}>
                            {resettingPw === c.id ? '…' : 'Reset PW'}
                          </Btn>
                          <Btn onClick={() => setDeleteConfirm(c)} color="#c0392b">Delete</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <ModalOverlay onClose={closeModal}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', marginTop: 0 }}>
            {modal === 'create' ? 'Add Customer' : 'Edit Customer'}
          </h2>
          <form onSubmit={modal === 'create' ? handleCreate : handleEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <FieldGroup label="Full Name *">
                <input style={inputStyle} value={form.full_name} onChange={set('full_name')} required />
              </FieldGroup>
              <FieldGroup label={modal === 'create' ? 'Email *' : 'Email'}>
                <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required={modal === 'create'} readOnly={modal === 'edit'} />
              </FieldGroup>
              <FieldGroup label="Phone">
                <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </FieldGroup>
              <FieldGroup label="Office Number">
                <input style={inputStyle} value={form.office_number} onChange={set('office_number')} />
              </FieldGroup>
              <FieldGroup label="Company Name">
                <input style={inputStyle} value={form.company_name} onChange={set('company_name')} />
              </FieldGroup>
              <FieldGroup label="GST Number">
                <input style={inputStyle} value={form.gst_number} onChange={set('gst_number')} />
              </FieldGroup>
              <FieldGroup label="Organization Type">
                <select style={inputStyle} value={form.organization_type} onChange={set('organization_type')}>
                  <option value="">— Select —</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Number of Employees">
                <input style={inputStyle} type="number" min="1" value={form.num_employees} onChange={set('num_employees')} />
              </FieldGroup>
              <div style={{ gridColumn: 'span 2' }}>
                <FieldGroup label="Address">
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.address} onChange={set('address')} />
                </FieldGroup>
              </div>
            </div>

            {saveMsg && (
              <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.72rem', padding: '0.5rem 0.8rem', borderRadius: 2, marginBottom: '1rem', background: saveMsg.startsWith('Error') ? 'rgba(192,57,43,0.08)' : 'rgba(39,174,96,0.08)', borderLeft: `3px solid ${saveMsg.startsWith('Error') ? '#c0392b' : '#27ae60'}`, color: saveMsg.startsWith('Error') ? '#8b1a1a' : '#1a6e3c' }}>
                {saveMsg}
              </p>
            )}
            {newPlain && (
              <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.72rem', padding: '0.5rem 0.8rem', borderRadius: 2, marginBottom: '1rem', background: 'rgba(184,146,42,0.1)', borderLeft: '3px solid #b8922a', color: '#7a6018' }}>
                Generated password: <code style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{newPlain}</code> (also sent by email)
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeModal} style={{ padding: '0.55rem 1.2rem', background: 'none', border: '1px solid #d4c4a0', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', letterSpacing: '0.1em', cursor: 'pointer', color: '#8a7d6b' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ padding: '0.55rem 1.4rem', background: '#b8922a', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create Customer' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selected && (
        <ModalOverlay onClose={closeModal} wide>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', margin: '0 0 4px' }}>{selected.full_name}</h2>
              <p style={{ margin: 0, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.65rem', color: '#8a7d6b', letterSpacing: '0.08em' }}>{selected.email}</p>
            </div>
            {statusBadge(selected.is_active)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', marginBottom: '1.5rem' }}>
            {[
              ['Phone', selected.phone], ['Company', selected.company_name],
              ['GST', selected.gst_number], ['Org Type', selected.organization_type],
              ['Office No.', selected.office_number], ['Employees', selected.num_employees],
            ].map(([k, v]) => v ? (
              <div key={k}>
                <span style={labelStyle}>{k}</span>
                <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: '#1a1208' }}>{v}</p>
              </div>
            ) : null)}
            {selected.address && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={labelStyle}>Address</span>
                <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: '#1a1208' }}>{selected.address}</p>
              </div>
            )}
          </div>

          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', borderTop: '1px solid #f0e6cc', paddingTop: '1rem', marginTop: '1rem' }}>Booking History</h3>
          {detailBookings.length === 0
            ? <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.72rem', color: '#8a7d6b' }}>No bookings.</p>
            : detailBookings.map(b => (
              <div key={b.id} style={{ border: '1px solid #e8c96d', borderRadius: 3, padding: '0.9rem 1.1rem', marginBottom: '0.75rem', background: '#fffdf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#1a1208' }}>#{b.booking_ref}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <StatusTag s={b.status} /><StatusTag s={b.payment_status} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.5rem' }}>
                  {[['Session', b.duration_label], ['Date', b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN') : '—'], ['Time', b.booking_time || '—'], ['Amount', `${b.currency} ${Number(b.price).toLocaleString('en-IN')}`]].map(([l, v]) => (
                    <div key={l}>
                      <span style={{ ...labelStyle, display: 'block' }}>{l}</span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={closeModal} style={{ padding: '0.55rem 1.4rem', background: '#b8922a', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ModalOverlay onClose={() => setDeleteConfirm(null)}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', marginTop: 0 }}>Delete Customer?</h2>
          <p style={{ fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.72rem', color: '#5a4e40' }}>
            This will permanently delete <strong>{deleteConfirm.full_name}</strong> ({deleteConfirm.email}). This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.55rem 1.2rem', background: 'none', border: '1px solid #d4c4a0', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', cursor: 'pointer', color: '#8a7d6b' }}>
              Cancel
            </button>
            <button onClick={handleDelete} style={{ padding: '0.55rem 1.4rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function Btn({ children, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '3px 10px', border: `1px solid ${color}`, borderRadius: 2, background: 'none', color, fontFamily: 'Josefin Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}

function ModalOverlay({ children, onClose, wide }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: '#fff', border: '1px solid #e8c96d', borderRadius: 4, padding: '2rem', width: '100%', maxWidth: wide ? 760 : 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,8,0.25)' }}>
        {children}
      </div>
    </>
  );
}

function StatusTag({ s }) {
  const map = { confirmed: '#27ae60', pending: '#e67e22', cancelled: '#c0392b', completed: '#2980b9', paid: '#27ae60', failed: '#c0392b', refunded: '#8e44ad' };
  return (
    <span style={{ padding: '2px 7px', borderRadius: 2, fontSize: '0.6rem', fontFamily: 'Josefin Sans, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', background: map[s] || '#999', color: '#fff' }}>{s}</span>
  );
}
