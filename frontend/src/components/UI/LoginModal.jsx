import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose, redirectTo = '/my-profile' }) {
  const [screen, setScreen]     = useState('login'); // 'login' | 'signup'
  const { login, register }     = useCustomerAuth();
  const navigate                = useNavigate();

  // Login state
  const [loginId, setLoginId]   = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Signup state
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [pw, setPw]             = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw2, setShowPw2]   = useState(false);
  const [showPw3, setShowPw3]   = useState(false);

  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRef                = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScreen('login');
      setLoginId(''); setPassword(''); setShowPw(false);
      setName(''); setEmail(''); setPhone(''); setPw(''); setPwConfirm('');
      setShowPw2(false); setShowPw3(false);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const switchTo = (s) => { setError(''); setScreen(s); setTimeout(() => inputRef.current?.focus(), 80); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId.trim() || !password) { setError('Please enter your login ID and password.'); return; }
    setLoading(true);
    try {
      await login(loginId.trim(), password);
      onClose();
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim())    { setError('Full name is required.'); return; }
    if (!email.trim())   { setError('Email is required.'); return; }
    if (!phone.trim())   { setError('Mobile number is required.'); return; }
    if (!pw)             { setError('Password is required.'); return; }
    if (pw.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (pw !== pwConfirm){ setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), pw, pwConfirm);
      onClose();
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="login-modal" role="dialog" aria-modal="true" aria-label={screen === 'login' ? 'Customer Login' : 'Create Account'}>
        <button className="login-close" onClick={onClose} aria-label="Close">×</button>

        <div className="login-brand">
          <span className="login-brand-mark">◎</span>
          <span className="login-brand-name">{screen === 'login' ? 'Customer Login' : 'Create Account'}</span>
        </div>

        {screen === 'login' ? (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="lf-group">
              <label className="lf-label" htmlFor="lm-loginid">Email or Mobile Number</label>
              <input
                ref={inputRef}
                id="lm-loginid"
                className="lf-input"
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Enter your email or phone"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="lm-password">Password</label>
              <div className="lf-pw-wrap">
                <input
                  id="lm-password"
                  className="lf-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="lf-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="lf-forgot-row">
              <a href="/forgot-password" className="lf-forgot-link" onClick={e => { e.preventDefault(); }}>Forgot Password?</a>
            </div>

            {error && <p className="lf-error" role="alert">{error}</p>}

            <button className="lf-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>

            <div className="lf-divider"><span>Don't have an account?</span></div>

            <button type="button" className="lf-alt-btn" onClick={() => switchTo('signup')} disabled={loading}>
              Sign Up
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleSignup} noValidate>
            <div className="lf-group">
              <label className="lf-label" htmlFor="su-name">Full Name</label>
              <input
                ref={inputRef}
                id="su-name"
                className="lf-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="su-email">Email Address</label>
              <input
                id="su-email"
                className="lf-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="su-phone">Mobile Number</label>
              <input
                id="su-phone"
                className="lf-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="su-pw">Set Password</label>
              <div className="lf-pw-wrap">
                <input
                  id="su-pw"
                  className="lf-input"
                  type={showPw2 ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" className="lf-pw-toggle" onClick={() => setShowPw2(v => !v)} tabIndex={-1} aria-label={showPw2 ? 'Hide' : 'Show'}>
                  {showPw2 ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="su-pwc">Confirm Password</label>
              <div className="lf-pw-wrap">
                <input
                  id="su-pwc"
                  className="lf-input"
                  type={showPw3 ? 'text' : 'password'}
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" className="lf-pw-toggle" onClick={() => setShowPw3(v => !v)} tabIndex={-1} aria-label={showPw3 ? 'Hide' : 'Show'}>
                  {showPw3 ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <p className="lf-error" role="alert">{error}</p>}

            <button className="lf-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <div className="lf-divider"><span>Already have an account?</span></div>

            <button type="button" className="lf-alt-btn" onClick={() => switchTo('login')} disabled={loading}>
              Login
            </button>
          </form>
        )}
      </div>
    </>
  );
}
