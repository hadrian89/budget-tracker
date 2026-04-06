import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

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
