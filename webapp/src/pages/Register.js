import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;

const BrandIconSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [error, setError] = useState('');

  const { register, oauthLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!FB_APP_ID || document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v18.0' });
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(script);
  }, []);

  const handleOAuth = async (provider, accessToken) => {
    setOauthLoading(provider);
    setError('');
    const result = await oauthLogin(provider, accessToken);
    setOauthLoading('');
    if (result.success) navigate('/dashboard', { replace: true });
    else setError(result.message);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (res) => handleOAuth('google', res.access_token),
    onError: () => setError('Google sign-in failed. Please try again.'),
  });

  const handleFacebookLogin = () => {
    if (!window.FB) return setError('Facebook SDK not ready. Please refresh the page.');
    window.FB.login((response) => {
      if (response.authResponse) handleOAuth('facebook', response.authResponse.accessToken);
      else setError('Facebook sign-in was cancelled.');
    }, { scope: 'email,public_profile' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <div>
            <div className="auth-left-brand">
              <div className="auth-brand-icon">
                <BrandIconSvg />
              </div>
              <span className="auth-brand-name">Walleto</span>
            </div>
            <h2 className="auth-left-headline">
              Start your journey to <em>financial freedom.</em>
            </h2>
            <p className="auth-left-sub">
              Join thousands who have taken control of their finances with Walleto&apos;s elegant tracking tools.
            </p>
          </div>
          <div className="auth-left-image">
            <div className="auth-left-image-pattern" />
            <div className="auth-left-image-inner">
              <span className="auth-left-image-icon">📊</span>
              <span className="auth-left-image-text">Smart Budgeting</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-right-inner">
            <div className="auth-header">
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Start tracking your budget today</p>
            </div>

            <div className="oauth-buttons">
              <button
                type="button"
                className="oauth-btn oauth-btn--google"
                onClick={() => googleLogin()}
                disabled={!!oauthLoading}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {oauthLoading === 'google' ? 'Signing up…' : 'Continue with Google'}
              </button>
              {FB_APP_ID && (
                <button
                  type="button"
                  className="oauth-btn oauth-btn--facebook"
                  onClick={handleFacebookLogin}
                  disabled={!!oauthLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  {oauthLoading === 'facebook' ? 'Signing up…' : 'Continue with Facebook'}
                </button>
              )}
            </div>

            <div className="auth-divider"><span>or</span></div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <AlertIcon />
                  {error}
                </div>
              )}

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="auth-input"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  autoComplete="name"
                  required
                  autoFocus
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="auth-input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="password">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="auth-input auth-input--with-icon"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  name="confirm"
                  className="auth-input"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Create account'}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
