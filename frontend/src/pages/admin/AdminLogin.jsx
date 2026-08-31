import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAdminSettings } from '../../services/customizerApi';
import './AdminLogin.css';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

function FallbackLogo({ siteName }) {
  return (
    <div style={{ fontFamily: 'Cormorant Garamond, serif', color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.04em' }}>{siteName}</div>
    </div>
  );
}

function AdminLogin() {
  const { login, token } = useAdminAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    logoSrc:     null,
    leftBg:      '#1a1208',
    accentColor: '#d4670a',
    siteName:    'Vinay Kulkarni',
  });

  useEffect(() => {
    getAdminSettings()
      .then(s => {
        const logoSrc = s.logoUrl
          ? (s.logoUrl.startsWith('http') ? s.logoUrl : `${API_ROOT}${s.logoUrl}`)
          : null;
        setSettings({
          logoSrc,
          leftBg:      s.sidebarBg    || '#1a1208',
          accentColor: s.accentColor  || '#d4670a',
          siteName:    s.siteName     || 'Vinay Kulkarni',
        });
        document.title = `Admin Login — ${s.siteName || 'Vinay Kulkarni'} CMS`;
      })
      .catch(() => {
        document.title = 'Admin Login — CMS';
      });
  }, []);

  // Already logged in → go to dashboard
  useEffect(() => {
    if (token) navigate('/admin/dashboard', { replace: true });
  }, [token, navigate]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const accentStyle = { color: settings.accentColor };

  return (
    <div className="login-root">
      <div className="login-left" style={{ background: settings.leftBg }}>
        {settings.logoSrc
          ? <img src={settings.logoSrc} alt={settings.siteName} className="login-brand-logo" />
          : <FallbackLogo siteName={settings.siteName} />
        }
        <p className="login-brand-sub" style={accentStyle}>Content Management System</p>
        <div className="login-decorative-line" style={{ background: `${settings.accentColor}66` }} />
        <p className="login-tagline">Strategy. Marketing. Growth.</p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={submit} noValidate>
          <div className="login-card-header">
            <span className="login-eyebrow" style={accentStyle}>CMS Admin</span>
            <h2 className="login-heading">Sign in</h2>
            <p className="login-sub">Enter your credentials to access the dashboard</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="login-input"
              type="text"
              name="username"
              value={form.username}
              onChange={handle}
              autoComplete="username"
              autoFocus
              required
              placeholder="admin"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handle}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <a href="/" className="login-back-link">← Back to website</a>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
