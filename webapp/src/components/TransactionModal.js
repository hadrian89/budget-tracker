import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axios';
import WalletoIcon, { getIconMeta } from './WalletoIcon';
import { useAuth } from '../context/AuthContext';
import './TransactionModal.css';

const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', INR: '₹' };

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Extract YYYY-MM-DD from any date string (strips time)
const toDateOnly = (str) => {
  if (!str) return '';
  return String(str).split('T')[0].split(' ')[0];
};

const nowDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
].map((n) => ({ name: n, subcategories: [], icon: 'shopping' }));

const TransactionModal = ({ isOpen, onClose, transaction, onSuccess, prefill }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const isEditing = !!transaction;
  const dateInputRef = useRef(null);
  const { user } = useAuth();
  const currencySymbol = CURRENCY_SYMBOLS[user?.settings?.currency] || '£';

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
      setForm({ ...initialForm, Date: nowDate(), ...(prefill || {}) });
    }
    setError('');
  }, [isOpen, transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAmountChange = (e) => {
    let raw = e.target.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] !== undefined && parts[1].length > 2) raw = parts[0] + '.' + parts[1].slice(0, 2);
    setForm((p) => ({ ...p, Amount: raw }));
    setError('');
  };

  const addPreset = (n) => {
    setForm((p) => {
      const current = parseFloat(p.Amount) || 0;
      return { ...p, Amount: (current + n).toFixed(2).replace(/\.00$/, '') };
    });
  };

  const fmtDisplay = (v) => {
    if (!v && v !== 0) return '';
    const [int, dec] = String(v).split('.');
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
  };

  const toLocalISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const shiftDate = (days) => {
    const d = new Date(form.Date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setForm((p) => ({ ...p, Date: toLocalISO(d) }));
  };

  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setForm((p) => ({ ...p, Date: toLocalISO(d) }));
  };

  const getDateOffset = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(form.Date + 'T00:00:00');
    return Math.round((today - selected) / 86400000);
  };

  const fmtDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
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
            <label className="form-label">Date *</label>
            <div className="date-picker-wrap">
              <div className="date-nav-row">
                <button type="button" className="date-nav-btn" onClick={() => shiftDate(-1)}>
                  <ChevronLeft />
                </button>
                <span className="date-display" onClick={() => dateInputRef.current?.showPicker?.()}>
                  {fmtDateDisplay(form.Date)}
                </span>
                <button type="button" className="date-nav-btn" onClick={() => shiftDate(1)}>
                  <ChevronRight />
                </button>
              </div>
              <div className="date-quick-row">
                {[['Today', 0], ['Yesterday', 1], ['2 days ago', 2]].map(([label, offset]) => (
                  <button
                    key={label}
                    type="button"
                    className={`date-quick-pill${getDateOffset() === offset ? ' date-quick-pill--active' : ''}`}
                    onClick={() => setQuickDate(offset)}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" className="date-calendar-btn" onClick={() => dateInputRef.current?.showPicker?.()} title="Pick a date">
                  <CalendarIcon />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={form.Date}
                  onChange={(e) => setForm((p) => ({ ...p, Date: e.target.value }))}
                  className="date-hidden-input"
                  required
                />
              </div>
            </div>
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
                        <span className="acc-radio-icon" style={{ background: getIconMeta(acc.type || 'bank').tileBg }}><WalletoIcon name={acc.type || 'bank'} size={18} /></span>
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
                        <span className="acc-radio-icon" style={{ background: getIconMeta(acc.type || 'bank').tileBg }}><WalletoIcon name={acc.type || 'bank'} size={18} /></span>
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
                        <span className="acc-radio-icon" style={{ background: getIconMeta(acc.type || 'bank').tileBg }}><WalletoIcon name={acc.type || 'bank'} size={18} /></span>
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

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <div className="amount-display-wrap">
              <span className="amount-currency-symbol">{currencySymbol}</span>
              <input
                type="text"
                inputMode="decimal"
                className="amount-big-input"
                value={fmtDisplay(form.Amount)}
                onChange={handleAmountChange}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                autoComplete="off"
                required
              />
            </div>
            <div className="amount-presets">
              {[5, 10, 20, 50, 100, 500].map((n) => (
                <button key={n} type="button" className="amount-preset-btn" onClick={() => addPreset(n)}>
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Category grid */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="cat-tile-grid">
              {categories.map((cat) => {
                const active = form.Category === cat.name;
                const meta = getIconMeta(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`cat-tile${active ? ' cat-tile--active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, Category: cat.name, Subcategory: '' }))}
                  >
                    <span className="cat-tile-icon" style={{ background: meta.tileBg }}>
                      <WalletoIcon name={cat.name} size={18} />
                    </span>
                    <span className="cat-tile-name">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory chips — only shown when category has subcategories */}
          {subcategories.length > 0 && (
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <div className="subcat-chip-row">
                <button
                  type="button"
                  className={`subcat-pill${!form.Subcategory ? ' subcat-pill--active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, Subcategory: '' }))}
                >
                  None
                </button>
                {subcategories.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`subcat-pill${form.Subcategory === s ? ' subcat-pill--active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, Subcategory: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
