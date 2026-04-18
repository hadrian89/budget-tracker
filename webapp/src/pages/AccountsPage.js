import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WalletoIcon from '../components/WalletoIcon';
import { ALL_ACCOUNT_KEYS } from '../data/icons';
import './AccountsPage.css';

const formatCurrency = (v) =>
  `£${(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_ICONS = { bank: 'bank', cash: 'cash', card: 'card', investment: 'investment' };
const TYPE_LABELS = { bank: 'Bank', cash: 'Cash', card: 'Card', investment: 'Investment' };

const PRESET_COLORS = [
  '#6366f1', '#10b981', '#ef4444', '#f59e0b', '#ec4899',
  '#06b6d4', '#8b5cf6', '#f97316', '#3b82f6', '#14b8a6',
];


const emptyForm = { name: '', type: 'bank', balance: '', currency: 'GBP', color: '#6366f1', icon: 'bank', isPrimary: false };

export default function AccountsPage() {
  const { user } = useAuth();
  const gbpToInr = user?.settings?.gbpToInr || 125.25;
  const toGBP = (acc) => {
    const bal = acc.balance || 0;
    return (acc.currency || 'GBP').toUpperCase() === 'INR' ? bal / gbpToInr : bal;
  };

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/accounts');
      setAccounts(res.data.accounts || []);
    } catch (e) {
      setError('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalBalance = accounts.reduce((s, a) => s + toGBP(a), 0);

  const openAdd = () => {
    setEditAccount(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (acc) => {
    setEditAccount(acc);
    setForm({
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency || 'GBP',
      color: acc.color || '#6366f1',
      icon: TYPE_ICONS[acc.type] || acc.icon || 'bank',
      isPrimary: acc.isPrimary || false,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleTypeChange = (type) => {
    setForm((p) => ({ ...p, type, icon: TYPE_ICONS[type] || 'bank' }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Account name is required.'); return; }
    const bal = parseFloat(form.balance);
    if (isNaN(bal)) { setFormError('Enter a valid balance.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, balance: bal };

      if (editAccount) {
        await axiosInstance.put(`/api/accounts/${editAccount._id}`, payload);
      } else {
        await axiosInstance.post('/api/accounts', payload);
      }

      setModalOpen(false);
      fetchAccounts();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to save account.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrimary = async (acc) => {
    setSettingPrimary(acc._id);
    try {
      await axiosInstance.put(`/api/accounts/${acc._id}/set-primary`);
      fetchAccounts();
    } catch {
      setError('Failed to update primary status.');
    } finally {
      setSettingPrimary(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/accounts/${deleteId}`);
      setDeleteId(null);
      fetchAccounts();
    } catch {
      setError('Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="accounts-page">
      {/* Header */}
      <div className="acc-page-header">
        <div>
          <h2 className="acc-page-title">Accounts</h2>
          <p className="acc-page-subtitle">TOTAL BALANCE · {formatCurrency(totalBalance)} GBP</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Account
        </button>
      </div>

      {error && <div className="acc-error">{error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : accounts.length === 0 ? (
        <div className="acc-empty">
          <WalletoIcon name="bank" size={48} />
          <p>No accounts yet. Add your first account.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add Account</button>
        </div>
      ) : (
        <div className="acc-grid">
          {accounts.map((acc) => (
            <div key={acc._id} className="acc-card" style={{ '--acc-color': acc.color || '#6366f1' }}>
              <div className="acc-card-top">
                <div className="acc-icon-wrap">
                  <WalletoIcon name={TYPE_ICONS[acc.type] || acc.icon || 'bank'} size={24} className="acc-icon" />
                </div>
                <div className="acc-actions">
                  <button
                    className={`acc-action-btn acc-action-btn--star${acc.isPrimary ? ' acc-action-btn--star-active' : ''}`}
                    onClick={() => handleTogglePrimary(acc)}
                    disabled={settingPrimary === acc._id}
                    title={acc.isPrimary ? 'Remove primary' : 'Set as primary'}
                  >
                    {acc.isPrimary ? '★' : '☆'}
                  </button>
                  <button className="acc-action-btn" onClick={() => openEdit(acc)} title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </button>
                  <button className="acc-action-btn acc-action-btn--danger" onClick={() => setDeleteId(acc._id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="acc-card-body">
                <p className="acc-name">{acc.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="acc-type-badge">
                    <span>{TYPE_LABELS[acc.type] || acc.type}</span>
                  </div>
                  {acc.isPrimary && (
                    <span className="acc-primary-badge">Primary</span>
                  )}
                </div>
              </div>

              <div className="acc-card-footer">
                <span className="acc-balance">{formatCurrency(acc.balance)}</span>
                <span className="acc-currency">{acc.currency || 'GBP'}</span>
              </div>

              <div className="acc-color-bar" style={{ background: acc.color || '#6366f1' }} />
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="acc-modal">
            <div className="acc-modal-header">
              <h2>{editAccount ? 'Edit Account' : 'Add Account'}</h2>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <div className="acc-modal-body">
              {formError && <div className="form-error">{formError}</div>}

              {/* Type selector */}
              <div className="form-group-sm">
                <label className="form-label-sm">Account Type</label>
                <div className="acc-type-grid">
                  {Object.keys(TYPE_ICONS).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`acc-type-btn ${form.type === t ? 'acc-type-btn--active' : ''}`}
                      onClick={() => handleTypeChange(t)}
                    >
                      <WalletoIcon name={TYPE_ICONS[t]} size={20} className="acc-type-btn-icon" />
                      <span>{TYPE_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon selector */}
              <div className="form-group-sm">
                <label className="form-label-sm">Icon</label>
                <div className="icon-picker icon-picker--svg">
                  {ALL_ACCOUNT_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`icon-btn icon-btn--svg${form.icon === key ? ' icon-btn--active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, icon: key }))}
                      title={key}
                    >
                      <WalletoIcon name={key} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="form-group-sm">
                <label className="form-label-sm">Account Name *</label>
                <input
                  className="form-input-sm"
                  value={form.name}
                  disabled={editAccount}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. UK Bank account"
                />
              </div>

              {/* Balance + Currency */}
              <div className="acc-form-row">
                <div className="form-group-sm" style={{ flex: 2 }}>
                  <label className="form-label-sm">Balance</label>
                  <div className="acc-prefix-input">
                    <span className="acc-prefix">£</span>
                    <input
                      className="form-input-sm"
                      type="number"
                      step="0.01"
                      value={form.balance}
                      onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-group-sm" style={{ flex: 1 }}>
                  <label className="form-label-sm">Currency</label>
                  <select
                    className="form-input-sm"
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                  >
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              {/* Color */}
              <div className="form-group-sm">
                <label className="form-label-sm">Color</label>
                <div className="color-picker">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${form.color === c ? 'color-swatch--active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                    />
                  ))}
                </div>
              </div>

              {/* Primary toggle */}
              <div className="acc-primary-toggle">
                <label className={`acc-primary-checkbox${form.isPrimary ? ' acc-primary-checkbox--checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                  />
                  <span className="acc-primary-checkbox-indicator" />
                  <div className="acc-primary-checkbox-label">
                    <span className="acc-primary-checkbox-title">★ Primary account</span>
                    <span className="acc-primary-checkbox-desc">
                      Primary accounts appear as quick-select options in new transactions
                    </span>
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="acc-preview">
                <div className="acc-preview-icon" style={{ background: (form.color || '#6366f1') + '22' }}>
                  <WalletoIcon name={form.icon} size={26} />
                </div>
                <div>
                  <p className="acc-preview-name">{form.name || 'Account name'}</p>
                  <p className="acc-preview-balance" style={{ color: form.color }}>
                    {formatCurrency(parseFloat(form.balance) || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="acc-modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="btn-spinner" /> : (editAccount ? 'Save Changes' : 'Add Account')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="confirm-dialog">
            <h3 className="confirm-title">Delete Account</h3>
            <p className="confirm-text">Are you sure? This will not delete transactions.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="btn-spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
