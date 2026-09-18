import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  const [loginId, setLoginId]     = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { login }                 = useCustomerAuth();
  const navigate                  = useNavigate();
  const inputRef                  = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoginId(''); setPassword(''); setError(''); setShowPw(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId.trim() || !password) { setError('Please enter your login ID and password.'); return; }
    setLoading(true);
    try {
      await login(loginId.trim(), password);
      onClose();
      navigate('/my-profile');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="login-modal" role="dialog" aria-modal="true" aria-label="Customer Login">
        <button className="login-close" onClick={onClose} aria-label="Close">×</button>

        <div className="login-brand">
          <span className="login-brand-mark">◎</span>
          <span className="login-brand-name">Customer Login</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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

          {error && <p className="lf-error" role="alert">{error}</p>}

          <button className="lf-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="lf-hint">
          Use the email address or phone number from your Discovery Session booking.<br />
          Your login credentials were sent to you by email.
        </p>
      </div>
    </>
  );
}
