import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/usersApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './UsersAdmin.css';

const MODULES = [
  { id: 'home',         label: 'Home' },
  { id: 'biography',    label: 'Biography' },
  { id: 'teaching',     label: 'Teaching' },
  { id: 'videos',       label: 'Videos' },
  { id: 'events',       label: 'Events' },
  { id: 'workshops',    label: 'Workshops' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'connect',      label: 'Connect' },
  { id: 'gallery',      label: 'Gallery' },
  { id: 'navigation',   label: 'Navigation' },
  { id: 'site-blocks',  label: 'Site Blocks' },
  { id: 'seo',          label: 'SEO' },
  { id: 'custom-pages', label: 'Page Builder' },
  { id: 'users',        label: 'User Management' },
];

const ROLES = [
  { value: 'super_admin', label: 'Super Admin',  desc: 'Full access to everything' },
  { value: 'editor',      label: 'Editor',       desc: 'View, create & edit — no delete' },
  { value: 'viewer',      label: 'Viewer',       desc: 'Read-only access' },
  { value: 'custom',      label: 'Custom',       desc: 'Hand-pick permissions per module' },
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

// ── Role badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return <span className={`usr-role-badge usr-role-${role}`}>{role.replace('_', ' ')}</span>;
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div className="usr-modal-backdrop" onClick={onCancel}>
      <div className="usr-modal-box usr-confirm-box" onClick={e => e.stopPropagation()}>
        <p className="usr-confirm-msg">{message}</p>
        <div className="usr-confirm-actions">
          <button className="adm-btn adm-btn-danger" onClick={onConfirm}>Delete</button>
          <button className="adm-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Permission matrix (for custom role) ───────────────────────────────────────
function PermMatrix({ perms, onChange, readOnly }) {
  const map = {};
  perms.forEach(p => { map[p.module] = p; });

  const toggle = (moduleId, action) => {
    if (readOnly) return;
    const cur = map[moduleId] || { module: moduleId, can_view: 0, can_create: 0, can_edit: 0, can_delete: 0 };
    const key = `can_${action}`;
    const next = { ...cur, [key]: cur[key] ? 0 : 1 };
    // If enabling create/edit/delete, also enable view
    if (action !== 'view' && next[key]) next.can_view = 1;
    // If disabling view, disable everything
    if (action === 'view' && !next.can_view) {
      next.can_create = 0; next.can_edit = 0; next.can_delete = 0;
    }
    const updated = perms.filter(p => p.module !== moduleId);
    onChange([...updated, next]);
  };

  const toggleAll = (action) => {
    if (readOnly) return;
    const allOn = MODULES.every(m => {
      const p = map[m.id];
      return p && p[`can_${action}`];
    });
    const updated = MODULES.map(m => {
      const cur = map[m.id] || { module: m.id, can_view: 0, can_create: 0, can_edit: 0, can_delete: 0 };
      const next = { ...cur, [`can_${action}`]: allOn ? 0 : 1 };
      if (action !== 'view' && !allOn) next.can_view = 1;
      if (action === 'view' && allOn) { next.can_create = 0; next.can_edit = 0; next.can_delete = 0; }
      return next;
    });
    onChange(updated);
  };

  return (
    <div className="usr-perm-table-wrap">
      <table className="usr-perm-table">
        <thead>
          <tr>
            <th className="usr-perm-module-col">Module</th>
            {ACTIONS.map(a => (
              <th key={a} className="usr-perm-action-col">
                <div className="usr-perm-action-head">
                  <span>{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                  {!readOnly && (
                    <button className="usr-toggle-col-btn" onClick={() => toggleAll(a)} title={`Toggle all ${a}`}>
                      ⇅
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map(m => {
            const p = map[m.id] || { can_view: 0, can_create: 0, can_edit: 0, can_delete: 0 };
            return (
              <tr key={m.id} className="usr-perm-row">
                <td className="usr-perm-module-name">{m.label}</td>
                {ACTIONS.map(a => (
                  <td key={a} className="usr-perm-check-cell">
                    <label className={`usr-perm-check ${readOnly ? 'readonly' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!p[`can_${a}`]}
                        onChange={() => toggle(m.id, a)}
                        disabled={readOnly}
                      />
                      <span className="usr-checkmark" />
                    </label>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── User form (create / edit) ──────────────────────────────────────────────────
function UserForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    username:     initial?.username     || '',
    display_name: initial?.display_name || '',
    email:        initial?.email        || '',
    role:         initial?.role         || 'editor',
    password:     '',
    confirm:      '',
  });
  const [perms,   setPerms]   = useState(initial?.permissions || []);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [pwdOpen, setPwdOpen] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When role changes, reset permissions to role defaults shown as read-only
  const handleRoleChange = (role) => {
    set('role', role);
    // Clear perms so server will reseed on save; show empty matrix
    setPerms([]);
  };

  const submit = async () => {
    if (!form.username.trim()) return setError('Username is required');
    if (!isEdit && !form.password) return setError('Password is required for new users');
    if (form.password && form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password && form.password !== form.confirm) return setError('Passwords do not match');

    setSaving(true); setError('');
    try {
      await onSave(form, perms);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="usr-modal-backdrop" onClick={onCancel}>
      <div className="usr-modal-box usr-form-box" onClick={e => e.stopPropagation()}>
        <div className="usr-form-header">
          <h2 className="usr-form-title">{isEdit ? 'Edit User' : 'Create User'}</h2>
          <button className="usr-close-btn" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="usr-form-error">{error}</div>}

        <div className="usr-form-body">
          {/* Basic info */}
          <div className="usr-form-section">
            <div className="usr-form-row">
              <label className="usr-label">Username *</label>
              <input
                className="usr-input"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                disabled={isEdit}
                placeholder="e.g. john_doe"
              />
            </div>
            <div className="usr-form-row">
              <label className="usr-label">Display Name</label>
              <input
                className="usr-input"
                value={form.display_name}
                onChange={e => set('display_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="usr-form-row">
              <label className="usr-label">Email</label>
              <input
                className="usr-input"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Role */}
          <div className="usr-form-section">
            <label className="usr-label">Role</label>
            <div className="usr-role-cards">
              {ROLES.map(r => (
                <label key={r.value} className={`usr-role-card ${form.role === r.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={() => handleRoleChange(r.value)}
                  />
                  <div className="usr-role-card-content">
                    <span className="usr-role-card-title">{r.label}</span>
                    <span className="usr-role-card-desc">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="usr-form-section">
            {isEdit ? (
              <>
                <button className="adm-btn adm-btn-sm" onClick={() => setPwdOpen(o => !o)}>
                  {pwdOpen ? 'Cancel password change' : 'Change password'}
                </button>
                {pwdOpen && (
                  <div className="usr-pwd-fields">
                    <div className="usr-form-row">
                      <label className="usr-label">New Password</label>
                      <input className="usr-input" type="password" value={form.password}
                        onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                    </div>
                    <div className="usr-form-row">
                      <label className="usr-label">Confirm Password</label>
                      <input className="usr-input" type="password" value={form.confirm}
                        onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="usr-form-row">
                  <label className="usr-label">Password *</label>
                  <input className="usr-input" type="password" value={form.password}
                    onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
                </div>
                <div className="usr-form-row">
                  <label className="usr-label">Confirm Password *</label>
                  <input className="usr-input" type="password" value={form.confirm}
                    onChange={e => set('confirm', e.target.value)} placeholder="Repeat password" />
                </div>
              </>
            )}
          </div>

          {/* Permissions matrix — always visible, editable for custom role */}
          <div className="usr-form-section">
            <div className="usr-perm-section-header">
              <span className="usr-label">Module Permissions</span>
              {form.role !== 'custom' && (
                <span className="usr-perm-note">
                  Permissions are preset for the <strong>{form.role.replace('_', ' ')}</strong> role.
                  Switch to <strong>Custom</strong> to set individual permissions.
                </span>
              )}
            </div>
            <PermMatrix
              perms={perms}
              onChange={setPerms}
              readOnly={form.role !== 'custom'}
            />
          </div>
        </div>

        <div className="usr-form-footer">
          <button className="adm-btn adm-btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
          <button className="adm-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main UsersAdmin ────────────────────────────────────────────────────────────
function UsersAdmin() {
  const { user: currentUser } = useAdminAuth();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modal,      setModal]      = useState(null); // null | 'create' | { user }
  const [deleteConf, setDeleteConf] = useState(null); // user to delete
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const rows = await api.listUsers();
      setUsers(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setModal('create');
  const openEdit   = async (u) => {
    try {
      const full = await api.getUser(u.id);
      setModal({ user: full });
    } catch (e) {
      showToast('Failed to load user: ' + e.message);
    }
  };

  const handleSave = async (form, perms) => {
    if (modal === 'create') {
      await api.createUser({
        username:     form.username.trim(),
        password:     form.password,
        display_name: form.display_name,
        email:        form.email,
        role:         form.role,
      });
      if (form.role === 'custom' && perms.length) {
        const created = await api.listUsers();
        const newUser = created.find(u => u.username === form.username.trim());
        if (newUser) await api.savePermissions(newUser.id, perms);
      }
      showToast('User created successfully');
    } else {
      const u = modal.user;
      await api.updateUser(u.id, {
        display_name: form.display_name,
        email:        form.email,
        role:         form.role,
      });
      if (form.password) await api.changePassword(u.id, form.password);
      if (form.role === 'custom') await api.savePermissions(u.id, perms);
      showToast('User updated successfully');
    }
    setModal(null);
    load();
  };

  const handleToggleActive = async (u) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      showToast(`User ${u.is_active ? 'disabled' : 'enabled'}`);
      load();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteUser(deleteConf.id);
      showToast('User deleted');
      setDeleteConf(null);
      load();
    } catch (e) {
      showToast('Error: ' + e.message);
      setDeleteConf(null);
    }
  };

  return (
    <div className="bio-adm-root">
      {/* Header */}
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Admin CMS</span>
          <h1 className="bio-adm-title">User Management</h1>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openCreate}>
          + New User
        </button>
      </div>

      {/* Info bar */}
      <div className="usr-info-bar">
        <p className="adm-hint">
          Manage CMS users and their permissions. The <strong>env super admin</strong> ({currentUser?.role === 'super_admin' ? currentUser.username : 'admin'}) always has full access regardless of this table.
        </p>
      </div>

      {/* Content */}
      <div className="bio-adm-content">
        {loading && <p className="adm-hint" style={{ padding: '2rem' }}>Loading users…</p>}
        {error   && <p className="usr-error-msg">{error}</p>}

        {!loading && !error && (
          <>
            {/* Role legend */}
            <div className="usr-legend">
              {ROLES.map(r => (
                <div key={r.value} className="usr-legend-item">
                  <RoleBadge role={r.value} />
                  <span className="usr-legend-desc">{r.desc}</span>
                </div>
              ))}
            </div>

            {/* Users table */}
            {users.length === 0 ? (
              <div className="usr-empty">
                <div className="usr-empty-icon">◎</div>
                <p>No users yet. Create the first one.</p>
                <button className="adm-btn adm-btn-primary" onClick={openCreate}>+ Create User</button>
              </div>
            ) : (
              <div className="adm-section">
                <table className="usr-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={!u.is_active ? 'usr-row-inactive' : ''}>
                        <td>
                          <div className="usr-user-cell">
                            <div className="usr-avatar">{(u.display_name || u.username)[0].toUpperCase()}</div>
                            <div>
                              <div className="usr-username">{u.username}</div>
                              {u.display_name && <div className="usr-displayname">{u.display_name}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="usr-email">{u.email || '—'}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td>
                          <button
                            className={`usr-status-toggle ${u.is_active ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? 'Click to disable' : 'Click to enable'}
                          >
                            {u.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="usr-created">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="usr-actions">
                            <button className="adm-btn adm-btn-sm" onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            <button
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() => setDeleteConf(u)}
                              disabled={u.id === currentUser?.id}
                              title={u.id === currentUser?.id ? "You can't delete yourself" : 'Delete user'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {(modal === 'create' || modal?.user) && (
        <UserForm
          initial={modal?.user || null}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {deleteConf && (
        <Confirm
          message={`Delete user "${deleteConf.username}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConf(null)}
        />
      )}

      {/* Toast */}
      {toast && <div className="usr-toast">{toast}</div>}
    </div>
  );
}

export default UsersAdmin;
