import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import './TransactionModal.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Extract YYYY-MM-DD from any date string (strips time)
const toDateOnly = (str) => {
  if (!str) return '';
  return String(str).split('T')[0].split(' ')[0];
};

const nowDate = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  Date: nowDate(),
  Type: 'Expense',
  Account: '',
  ToAccount: '',
  Currency: 'GBP',
  Amount: '',
  Category: '',
  Subcategory: '',
  Notes: '',
};

const FALLBACK_CATEGORIES = [
  'Food & Dining', 'Shopping', 'Transport', 'Entertainment',
  'Bills & Utilities', 'Health & Fitness', 'Travel', 'Education',
  'Personal Care', 'Home', 'Salary', 'Investments', 'Other Income', 'Uncategorized',
].map((n) => ({ name: n, subcategories: [], icon: '📦' }));

const TransactionModal = ({ isOpen, onClose, transaction, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const isEditing = !!transaction;

  // Load accounts and categories when modal opens
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      axiosInstance.get('/api/categories').catch(() => ({ data: { categories: [] } })),
      axiosInstance.get('/api/accounts').catch(() => ({ data: { accounts: [] } })),
    ]).then(([catRes, accRes]) => {
      const cats = catRes.data.categories || [];
      setCategories(cats.length ? cats : FALLBACK_CATEGORIES);
      const all = accRes.data.accounts || [];
      setAccounts(all);
      // Auto-select when adding a new transaction
      if (!transaction) {
        const primaries = all.filter((a) => a.isPrimary);
        const first = (primaries.length ? primaries : all)[0];
        if (first) setForm((p) => ({ ...p, Account: p.Account || first.name }));
      }
    });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update subcategory options when category changes
  useEffect(() => {
    const cat = categories.find((c) => c.name === form.Category);
    setSubcategories(cat?.subcategories || []);
    // Clear subcategory if it no longer belongs to the selected category
    if (cat && cat.subcategories?.length > 0 && form.Subcategory && !cat.subcategories.includes(form.Subcategory)) {
      setForm((p) => ({ ...p, Subcategory: '' }));
    }
  }, [form.Category, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (!isOpen) return;
    if (transaction) {
      setForm({
        Date: toDateOnly(transaction.Date),
        Type: transaction.Type ? transaction.Type.charAt(0).toUpperCase() + transaction.Type.slice(1).toLowerCase() : 'Expense',
        Account: transaction.Account || '',
        ToAccount: transaction.ToAccount || '',
        Currency: transaction.Currency || 'GBP',
        Amount: Math.abs(transaction.Amount) || '',
        Category: transaction.Category || '',
        Subcategory: transaction.Subcategory || '',
        Notes: transaction.Notes || '',
      });
    } else {
      setForm({ ...initialForm, Date: nowDate() });
    }
    setError('');
  }, [isOpen, transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.Date || !form.Type || !form.Account || !form.Amount) {
      setError('Please fill in all required fields.');
      return;
    }

    if (form.Type === 'Transfer') {
      if (!form.ToAccount) {
        setError('Please select a destination account for the transfer.');
        return;
      }
      if (form.ToAccount === form.Account) {
        setError('Source and destination accounts must be different.');
        return;
      }
    }

    const amount = parseFloat(form.Amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const signedAmount = form.Type === 'Expense' ? -Math.abs(amount) : Math.abs(amount);

    const payload = {
      Date: form.Date,
      Type: form.Type.toUpperCase(),
      Account: form.Account,
      ToAccount: form.Type === 'Transfer' ? form.ToAccount : '',
      Currency: "GBP",
      Amount: signedAmount,
      Amount_GBP: signedAmount,
      Category: form.Category || 'Uncategorized',
      Subcategory: form.Subcategory || '',
      Notes: form.Notes || '',
    };

    setLoading(true);
    try {
      if (isEditing) {
        await axiosInstance.put(`/api/transactions/${transaction._id}`, payload);
      } else {
        await axiosInstance.post('/api/transactions', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeColors = {
    Expense:  { bg: 'rgba(182,0,81,0.1)',    color: 'var(--tertiary)' },
    Income:   { bg: 'rgba(0,135,90,0.12)',   color: '#00875a' },
    Transfer: { bg: 'rgba(91,91,95,0.1)',    color: 'var(--primary)' },
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button className="modal-close" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          {/* Type selector */}
          <div className="form-group">
            <label className="form-label">Type *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Expense', 'Income', 'Transfer'].map((t) => {
                const active = form.Type === t;
                const tc = typeColors[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, Type: t }))}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 10,
                      border: 'none',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: active ? tc.bg : 'var(--surface-low)',
                      color: active ? tc.color : 'var(--outline)',
                    }}
                  >
                    {t === 'Expense' ? '↓ Expense' : t === 'Income' ? '↑ Income' : '⇄ Transfer'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date picker */}
          <div className="form-group">
            <label className="form-label">Date & Time *</label>
            <input
              type="date"
              name="Date"
              className="form-input"
              value={form.Date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Account — for non-transfer show only primaries (fallback: all); for transfer show all */}
          {form.Type !== 'Transfer' ? (
            <div className="form-group">
              <label className="form-label">Account *</label>
              {accounts.length > 0 ? (
                <div className="acc-radio-list">
                  {(accounts.filter((a) => a.isPrimary).length ? accounts.filter((a) => a.isPrimary) : accounts).map((acc) => {
                    const selected = form.Account === acc.name;
                    return (
                      <label
                        key={acc._id}
                        className={`acc-radio-card${selected ? ' acc-radio-card--selected' : ''}`}
                        style={{ '--acc-clr': acc.color || '#6366f1' }}
                      >
                        <input type="radio" name="Account" value={acc.name} checked={selected} onChange={handleChange} required />
                        <span className="acc-radio-icon">{acc.icon || '🏦'}</span>
                        <div className="acc-radio-info">
                          <span className="acc-radio-name">{acc.name}</span>
                          <span className="acc-radio-bal">
                            {(acc.balance || 0).toLocaleString('en-GB', { style: 'currency', currency: acc.currency || 'GBP' })}
                          </span>
                        </div>
                        {acc.isPrimary && <span className="acc-radio-star" title="Primary">★</span>}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input type="text" name="Account" className="form-input" value={form.Account} onChange={handleChange} placeholder="e.g. Monzo, NatWest" required />
              )}
            </div>
          ) : (
            /* Transfer: From + To account selectors */
            <div className="modal-row" style={{ alignItems: 'flex-start' }}>
              <div className="form-group">
                <label className="form-label">From Account *</label>
                <div className="acc-radio-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {accounts.map((acc) => {
                    const selected = form.Account === acc.name;
                    return (
                      <label
                        key={acc._id}
                        className={`acc-radio-card${selected ? ' acc-radio-card--selected' : ''}${form.ToAccount === acc.name ? ' acc-radio-card--disabled' : ''}`}
                        style={{ '--acc-clr': acc.color || '#6366f1', width: '100%', opacity: form.ToAccount === acc.name ? 0.4 : 1 }}
                      >
                        <input
                          type="radio" name="Account" value={acc.name} checked={selected}
                          onChange={handleChange} required disabled={form.ToAccount === acc.name}
                        />
                        <span className="acc-radio-icon">{acc.icon || '🏦'}</span>
                        <div className="acc-radio-info">
                          <span className="acc-radio-name">{acc.name}</span>
                          <span className="acc-radio-bal">
                            {(acc.balance || 0).toLocaleString('en-GB', { style: 'currency', currency: acc.currency || 'GBP' })}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">To Account *</label>
                <div className="acc-radio-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {accounts.map((acc) => {
                    const selected = form.ToAccount === acc.name;
                    return (
                      <label
                        key={acc._id}
                        className={`acc-radio-card${selected ? ' acc-radio-card--selected' : ''}${form.Account === acc.name ? ' acc-radio-card--disabled' : ''}`}
                        style={{ '--acc-clr': acc.color || '#6366f1', width: '100%', opacity: form.Account === acc.name ? 0.4 : 1 }}
                      >
                        <input
                          type="radio" name="ToAccount" value={acc.name} checked={selected}
                          onChange={handleChange} required disabled={form.Account === acc.name}
                        />
                        <span className="acc-radio-icon">{acc.icon || '🏦'}</span>
                        <div className="acc-radio-info">
                          <span className="acc-radio-name">{acc.name}</span>
                          <span className="acc-radio-bal">
                            {(acc.balance || 0).toLocaleString('en-GB', { style: 'currency', currency: acc.currency || 'GBP' })}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Amount + Currency */}
          <div className="modal-row">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <div className="form-input-prefix">
                <span className="form-prefix">£</span>
                <input
                  type="number"
                  name="Amount"
                  className="form-input form-input--prefixed"
                  value={form.Amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            {/* <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                name="Currency"
                className="form-input form-select"
                value={form.Currency}
                onChange={handleChange}
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div> */}
          </div>

          {/* Category + Subcategory */}
          <div className="modal-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="Category"
                className="form-input form-select"
                value={form.Category}
                onChange={handleChange}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              {subcategories.length > 0 ? (
                <select
                  name="Subcategory"
                  className="form-input form-select"
                  value={form.Subcategory}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {subcategories.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="Subcategory"
                  className="form-input"
                  value={form.Subcategory}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="Notes"
              className="form-input form-textarea"
              value={form.Notes}
              onChange={handleChange}
              placeholder="Add a note (optional)..."
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : isEditing ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
