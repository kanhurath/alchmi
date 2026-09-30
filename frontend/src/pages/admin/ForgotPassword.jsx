import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSettings } from '../../services/customizerApi';
import './AdminLogin.css';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
const AUTH_API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function FallbackLogo({ siteName }) {
  return (
    <div style={{ fontFamily: 'Cormorant Garamond, serif', color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.04em' }}>{siteName}</div>
    </div>
  );
}

function ForgotPassword() {
  const [email,    setEmail]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [sent,     setSent]    = useState(false);
  const [error,    setError]   = useState('');

  const [settings, setSettings] = useState({
    logoSrc:     null,
    leftBg:      '#1a1208',
    accentColor: '#d4670a',
    siteName:    'Vinay Kulkarni',
  });

  useEffect(() => {
    document.title = 'Forgot Password — CMS';
    getAdminSettings()
      .then(s => {
        const logoSrc = s.logoUrl
          ? (s.logoUrl.startsWith('http') ? s.logoUrl : `${API_ROOT}${s.logoUrl}`)
          : null;
        setSettings({
          logoSrc,
          leftBg:      s.sidebarBg   || '#1a1208',
          accentColor: s.accentColor || '#d4670a',
          siteName:    s.siteName    || 'Vinay Kulkarni',
        });
        document.title = `Forgot Password — ${s.siteName || 'Vinay Kulkarni'} CMS`;
      })
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${AUTH_API}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
        <div className="login-card">
          <div className="login-card-header">
            <span className="login-eyebrow" style={accentStyle}>Password Recovery</span>
            <h2 className="login-heading">Forgot Password</h2>
            <p className="login-sub">
              Enter your registered email address and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="login-success">
              <span className="login-success-icon">✓</span>
              <span>
                If this email belongs to an admin account, a password reset link has been sent.
                Please check your inbox (and spam folder).
                <br /><br />
                The link will expire in <strong>1 hour</strong>.
              </span>
            </div>
          ) : (
            <>
              {error && (
                <div className="login-error" role="alert">
                  <span className="login-error-icon">⚠</span>
                  {error}
                </div>
              )}

              <form onSubmit={submit} noValidate style={{ display: 'contents' }}>
                <div className="login-field">
                  <label className="login-label" htmlFor="fp-email">Email Address</label>
                  <input
                    id="fp-email"
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                    placeholder="admin@example.com"
                  />
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <Link to="/admin/login" className="login-back-link">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
