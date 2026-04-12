import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',     label: 'Profile',      icon: '👤' },
  { id: 'security',   label: 'Security',     icon: '🔒' },
  { id: 'preferences',label: 'Preferences',  icon: '⚙️' },
  { id: 'danger',     label: 'Danger Zone',  icon: '⚠️' },
];

const CURRENCIES = [
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'CAD', label: '$ Canadian Dollar (CAD)' },
  { value: 'AUD', label: '$ Australian Dollar (AUD)' },
  { value: 'JPY', label: '¥ Japanese Yen (JPY)' },
  { value: 'CHF', label: 'Fr Swiss Franc (CHF)' },
  { value: 'SGD', label: '$ Singapore Dollar (SGD)' },
  { value: 'AED', label: 'د.إ UAE Dirham (AED)' },
];

const DATE_FORMATS = [
  { value: 'en-GB', label: 'DD/MM/YYYY  (31/12/2025)' },
  { value: 'en-US', label: 'MM/DD/YYYY  (12/31/2025)' },
  { value: 'en-CA', label: 'YYYY-MM-DD  (2025-12-31)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Alert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`settings-alert settings-alert--${type}`}>
      <span>{message}</span>
      <button className="settings-alert-close" onClick={onClose}>✕</button>
    </div>
  );
}

function SaveButton({ saving, label = 'Save Changes' }) {
  return (
    <button className="btn btn-primary" type="submit" disabled={saving}>
      {saving ? <span className="btn-spinner" /> : label}
    </button>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user, updateUser }) {
  const [name, setName]     = useState(user?.name || '');
  const [email, setEmail]   = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert]   = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: '', message: '' });
    try {
      const res = await api.put('/api/auth/profile', { name, email });
      updateUser(res.data.user);
      setAlert({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (n) => (n || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Profile</h2>
        <p className="settings-section-desc">Update your display name and email address.</p>
      </div>

      {/* Avatar */}
      <div className="settings-avatar-row">
        <div className="settings-avatar">{getInitials(name)}</div>
        <div>
          <p className="settings-avatar-name">{name || 'Your Name'}</p>
          <p className="settings-avatar-meta">Member since {memberSince}</p>
        </div>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">FULL NAME</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">EMAIL ADDRESS</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="settings-form-footer">
          <SaveButton saving={saving} />
        </div>
      </form>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert]   = useState({ type: '', message: '' });

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return setAlert({ type: 'error', message: 'New passwords do not match.' });
    }
    setSaving(true);
    setAlert({ type: '', message: '' });
    try {
      await api.put('/api/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setAlert({ type: 'success', message: 'Password changed successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const strength = (() => {
    const p = form.newPassword;
    if (!p) return null;
    if (p.length < 6)  return { level: 1, label: 'Too short', color: '#ef4444' };
    if (p.length < 10) return { level: 2, label: 'Weak',      color: '#f59e0b' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 3, label: 'Fair', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: '#10b981' };
  })();

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Security</h2>
        <p className="settings-section-desc">Change your password. We recommend using a strong, unique password.</p>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">CURRENT PASSWORD</label>
          <input className="form-input" type="password" value={form.currentPassword} onChange={(e) => setF('currentPassword', e.target.value)} required placeholder="Enter current password" />
        </div>
        <div className="form-group">
          <label className="form-label">NEW PASSWORD</label>
          <input className="form-input" type="password" value={form.newPassword} onChange={(e) => setF('newPassword', e.target.value)} required placeholder="Min. 6 characters" />
          {strength && (
            <div className="password-strength">
              <div className="strength-bars">
                {[1,2,3,4].map((n) => (
                  <div key={n} className="strength-bar" style={{ background: n <= strength.level ? strength.color : 'var(--border)' }} />
                ))}
              </div>
              <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">CONFIRM NEW PASSWORD</label>
          <input className="form-input" type="password" value={form.confirmPassword} onChange={(e) => setF('confirmPassword', e.target.value)} required placeholder="Repeat new password" />
        </div>
        <div className="settings-form-footer">
          <SaveButton saving={saving} label="Change Password" />
        </div>
      </form>
    </div>
  );
}

// ── Preferences Tab ───────────────────────────────────────────────────────────

function PreferencesTab({ user, updateUser }) {
  const saved = user?.settings || {};
  const [currency,   setCurrency]   = useState(saved.currency   || 'GBP');
  const [dateFormat, setDateFormat] = useState(saved.dateFormat || 'en-GB');
  const [gbpToInr,   setGbpToInr]  = useState(String(saved.gbpToInr ?? 125.25));
  const [saving, setSaving]         = useState(false);
  const [alert, setAlert]           = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rate = parseFloat(gbpToInr);
    if (isNaN(rate) || rate <= 0) {
      return setAlert({ type: 'error', message: 'Please enter a valid GBP → INR rate.' });
    }
    setSaving(true);
    setAlert({ type: '', message: '' });
    try {
      const res = await api.put('/api/auth/settings', { currency, dateFormat, gbpToInr: rate });
      updateUser({ ...user, settings: res.data.settings });
      setAlert({ type: 'success', message: 'Preferences saved.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const sampleDate = new Date(2025, 11, 31);
  const datePreview = sampleDate.toLocaleDateString(dateFormat, { day: 'numeric', month: 'short', year: 'numeric' });
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.label.split(' ')[0] || '';

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Preferences</h2>
        <p className="settings-section-desc">Customise how Walleto displays numbers and dates.</p>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">DEFAULT CURRENCY</label>
          <select className="form-input form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <p className="form-hint">Amounts will display with the <strong>{currencySymbol}</strong> symbol.</p>
        </div>

        <div className="form-group">
          <label className="form-label">DATE FORMAT</label>
          <select className="form-input form-select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
            {DATE_FORMATS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <p className="form-hint">Preview: <strong>{datePreview}</strong></p>
        </div>

        <div className="form-group">
          <label className="form-label">GBP → INR EXCHANGE RATE</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="1"
            value={gbpToInr}
            onChange={(e) => setGbpToInr(e.target.value)}
            placeholder="e.g. 125.25"
          />
          <p className="form-hint">Used to convert INR account balances to GBP for total balance. Currently: <strong>1 GBP = {parseFloat(gbpToInr) || 125.25} INR</strong></p>
        </div>

        <div className="settings-form-footer">
          <SaveButton saving={saving} />
        </div>
      </form>
    </div>
  );
}

// ── Danger Zone Tab ───────────────────────────────────────────────────────────

function DangerTab({ user, logout }) {
  const navigate  = useNavigate();
  const [confirm, setConfirm]   = useState('');
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert]       = useState({ type: '', message: '' });
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = async () => {
    if (confirm !== user?.email) {
      return setAlert({ type: 'error', message: 'Email does not match. Please try again.' });
    }
    setDeleting(true);
    try {
      await api.delete('/api/auth/account');
      logout();
      navigate('/login');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete account.' });
      setDeleting(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Danger Zone</h2>
        <p className="settings-section-desc">Irreversible actions that permanently affect your account.</p>
      </div>

      <div className="danger-card">
        <div className="danger-card-info">
          <p className="danger-card-title">Delete Account</p>
          <p className="danger-card-desc">
            Permanently delete your account and all associated data — transactions, accounts, categories, bills.
            This cannot be undone.
          </p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowDialog(true)}>Delete Account</button>
      </div>

      {showDialog && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDialog(false)}>
          <div className="confirm-dialog confirm-dialog--danger">
            <div className="confirm-dialog-icon">⚠️</div>
            <p className="confirm-title">Delete your account?</p>
            <p className="confirm-text">
              All your data will be permanently erased. To confirm, type your email address:
              <strong> {user?.email}</strong>
            </p>

            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

            <input
              className="form-input"
              placeholder={user?.email}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => { setShowDialog(false); setConfirm(''); }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting || confirm !== user?.email}>
                {deleting ? <span className="btn-spinner" /> : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your profile, security, and app preferences.</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar nav */}
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-nav-item${activeTab === t.id ? ' settings-nav-item--active' : ''}${t.id === 'danger' ? ' settings-nav-item--danger' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="settings-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'profile'      && <ProfileTab     user={user} updateUser={updateUser} />}
          {activeTab === 'security'     && <SecurityTab />}
          {activeTab === 'preferences'  && <PreferencesTab user={user} updateUser={updateUser} />}
          {activeTab === 'danger'       && <DangerTab      user={user} logout={logout} />}
        </div>
      </div>
    </div>
  );
}
