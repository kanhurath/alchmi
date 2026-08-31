import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'vk_admin_token';

// Roles that bypass per-module permission checks
const FULL_ACCESS_ROLES = ['super_admin', 'editor'];

export function AdminAuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(({ user: u }) => setUser(u))
      .catch(clearAuth)
      .finally(() => setLoading(false));
  }, [token, clearAuth]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || 'Login failed');
    }
    const { token: t, user: u } = await res.json();
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => clearAuth(), [clearAuth]);

  // Check if current user can perform an action on a module.
  // super_admin and editor always return true.
  // viewer can only 'view'.
  // custom role checks the permissions array from /auth/verify.
  const hasPermission = useCallback((module, action = 'view') => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'editor') return action !== 'delete';
    if (user.role === 'viewer') return action === 'view';
    // custom role
    const perm = (user.permissions || []).find(p => p.module === module);
    if (!perm) return false;
    const key = `can_${action}`;
    return !!perm[key];
  }, [user]);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AdminAuthContext.Provider value={{ token, user, loading, login, logout, hasPermission, isSuperAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
