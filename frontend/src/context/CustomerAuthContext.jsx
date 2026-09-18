import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'alchmi_customer_token';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(true);

  const loadProfile = useCallback(async (token) => {
    try {
      const res = await fetch(`${API}/customer-auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('invalid');
      const data = await res.json();
      setCustomer(data.customer);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setCustomer(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      loadProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const login = useCallback(async (login_id, password) => {
    const res = await fetch(`${API}/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(TOKEN_KEY, data.token);
    setCustomer(data.customer);
    return data.customer;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await loadProfile(token);
  }, [loadProfile]);

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, login, logout, refreshProfile, getToken }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return ctx;
}
