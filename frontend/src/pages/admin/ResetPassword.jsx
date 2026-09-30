import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

// Token validation states
const STATE = { VALIDATING: 'validating', VALID: 'valid', INVALID: 'invalid', SUCCESS: 'success' };

function ResetPassword() {
  const [searchParams]  = useSearchParams();
  const token           = searchParams.get('token') || '';

  const [state,       setState]     = useState(STATE.VALIDATING);
  const [tokenError,  setTokenError] = useState('');
  const [username,    setUsername]  = useState('');

  const [password,    setPassword]  = useState('');
  const [confirm,     setConfirm]   = useState('');
  const [showPwd,     setShowPwd]   = useState(false);
  const [formError,   setFormError] = useState('');
  const [submitting,  setSubmitting] = useState(false);

  const [settings, setSettings] = useState({
    logoSrc:     null,
    leftBg:      '#1a1208',
    accentColor: '#d4670a',
    siteName:    'Vinay Kulkarni',
  });

  useEffect(() => {
    document.title = 'Reset Password — CMS';
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
        document.title = `Reset Password — ${s.siteName || 'Vinay Kulkarni'} CMS`;
      })
      .catch(() => {});
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState(STATE.INVALID);
      setTokenError('No reset token found. Please request a new password reset link.');
      return;
    }
    fetch(`${AUTH_API}/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setState(STATE.VALID);
          setUsername(data.username || '');
        } else {
          setState(STATE.INVALID);
          setTokenError(data.error || 'Invalid or expired reset link.');
        }
      })
      .catch(() => {
        setState(STATE.INVALID);
        setTokenError('Unable to validate the reset link. Please try again.');
      });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch(`${AUTH_API}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState(STATE.SUCCESS);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentStyle = { color: settings.accentColor };

  const renderContent = () => {
    if (state === STATE.VALIDATING) {
      return (
        <div className="login-info">
          <span className="login-info-icon">⋯</span>
          Verifying your reset link…
        </div>
      );
    }

    if (state === STATE.INVALID) {
      return (
        <>
          <div className="login-error" role="alert">
            <span className="login-error-icon">⚠</span>
            {tokenError}
          </div>
          <Link to="/admin/forgot-password" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', marginTop: '0.25rem' }}>
            Request a New Reset Link
          </Link>
        </>
      );
    }

    if (state === STATE.SUCCESS) {
      return (
        <>
          <div className="login-success">
            <span className="login-success-icon">✓</span>
            <span>
              Your password has been reset successfully.
              You can now sign in with your new password.
            </span>
          </div>
          <Link to="/admin/login" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', marginTop: '0.25rem' }}>
            Sign In
          </Link>
        </>
      );
    }

    // STATE.VALID — show the reset form
    return (
      <>
        {username && (
          <div className="login-info">
            <span className="login-info-icon">ℹ</span>
            Resetting password for <strong>{username}</strong>
          </div>
        )}

        {formError && (
          <div className="login-error" role="alert">
            <span className="login-error-icon">⚠</span>
            {formError}
          </div>
        )}

        <form onSubmit={submit} noValidate style={{ display: 'contents' }}>
          <div className="login-field">
            <label className="login-label" htmlFor="rp-password">New Password</label>
            <input
              id="rp-password"
              className="login-input"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              required
              placeholder="Min. 8 characters"
            />
            <span className="login-hint">Minimum 8 characters</span>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="rp-confirm">Confirm Password</label>
            <input
              id="rp-confirm"
              className="login-input"
              type={showPwd ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Re-enter your new password"
            />
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.76rem', color: '#9a8e78', cursor: 'pointer', marginTop: '-0.5rem',
          }}>
            <input
              type="checkbox"
              checked={showPwd}
              onChange={e => setShowPwd(e.target.checked)}
              style={{ accentColor: settings.accentColor }}
            />
            Show passwords
          </label>

          <button className="login-btn" type="submit" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </>
    );
  };

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
            <h2 className="login-heading">Reset Password</h2>
            {state === STATE.VALID && (
              <p className="login-sub">Enter and confirm your new password below.</p>
            )}
          </div>

          {renderContent()}

          {state !== STATE.SUCCESS && state !== STATE.INVALID && (
            <Link to="/admin/login" className="login-back-link">
              ← Back to Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
