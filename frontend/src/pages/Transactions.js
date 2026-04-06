import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';
import TransactionModal from '../components/TransactionModal';
import './Transactions.css';

// ── Icons ────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronIcon = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined) return '£0.00';
  return `£${Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getTime = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split(' ');
  return parts[1] ? parts[1].slice(0, 5) : '';
};

const getDateKey = (dateStr) => {
  if (!dateStr) return 'Unknown';
  return String(dateStr).split(' ')[0] || 'Unknown';
};

const formatDayLabel = (dateKey) => {
  try {
    const d = new Date(dateKey + 'T00:00:00');
    return {
      day: d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit' }),
      monthYear: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    };
  } catch { return { day: dateKey, monthYear: '' }; }
};

const getCategoryEmoji = (cat) => {
  const map = {
    'Food & Dining': '🍔', 'Shopping': '🛍️', 'Transport': '🚗',
    'Entertainment': '🎉', 'Bills & Utilities': '📄', 'Health & Fitness': '💊',
    'Travel': '✈️', 'Education': '🎓', 'Salary': '💰', 'Investments': '📈',
    'Other Income': '💵', 'Personal Care': '🪥', 'Home': '🏠',
  };
  return map[cat] || '📦';
};

// Group transactions by date
const groupByDate = (txs) => {
  const groups = {};
  txs.forEach((tx) => {
    const key = getDateKey(tx.Date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

// ── Transactions Page ────────────────────────────────────────
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: 'all', category: 'all', startDate: '', endDate: '' });
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchTransactions = useCallback(async (page = 1, srch = appliedSearch, filts = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page, limit: 50,
        ...(srch && { search: srch }),
        ...(filts.type !== 'all' && { type: filts.type }),
        ...(filts.category !== 'all' && { category: filts.category }),
        ...(filts.startDate && { startDate: filts.startDate }),
        ...(filts.endDate && { endDate: filts.endDate }),
      });
      const res = await axiosInstance.get(`/api/transactions?${params}`);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedFilters]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/dashboard/categories');
      setCategories(res.data.categories || []);
    } catch {}
  }, []);

  useEffect(() => { fetchTransactions(1, appliedSearch, appliedFilters); }, [appliedSearch, appliedFilters]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search);
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setSearch('');
    setFilters({ type: 'all', category: 'all', startDate: '', endDate: '' });
    setAppliedSearch('');
    setAppliedFilters({ type: 'all', category: 'all', startDate: '', endDate: '' });
  };

  const handleModalSuccess = () => {
    fetchTransactions(pagination.page, appliedSearch, appliedFilters);
    fetchCategories();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/transactions/${deleteId}`);
      setDeleteId(null);
      fetchTransactions(pagination.page, appliedSearch, appliedFilters);
    } catch {
      setError('Failed to delete transaction.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = appliedSearch || appliedFilters.type !== 'all' ||
    appliedFilters.category !== 'all' || appliedFilters.startDate || appliedFilters.endDate;

  // Compute summary
  const totalIncome  = transactions.filter(t => t.Type === 'INCOME').reduce((s, t) => s + Math.abs(t.Amount_GBP || 0), 0);
  const totalExpense = transactions.filter(t => t.Type === 'EXPENSE').reduce((s, t) => s + Math.abs(t.Amount_GBP || 0), 0);
  const net = totalIncome - totalExpense;

  const grouped = groupByDate(transactions);

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="tx-page-header">
        <div>
          <h2 className="tx-page-title">Transactions</h2>
          <p className="tx-page-subtitle">
            {pagination.total.toLocaleString()} transaction{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Search bar */}
      <form className="tx-search-bar" onSubmit={handleSearchSubmit}>
        <span className="tx-search-icon"><SearchIcon /></span>
        <input
          className="tx-search-input"
          type="text"
          placeholder="Search by category, account, note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="tx-filter-apply">Search</button>
        {hasFilters && (
          <button type="button" className="tx-filter-clear" onClick={handleClear}>Clear</button>
        )}
      </form>

      {/* Filters row */}
      <div className="tx-filters-row">
        <select
          className="tx-filter-select"
          value={filters.type}
          onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
        >
          <option value="all">All Types</option>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select
          className="tx-filter-select"
          value={filters.category}
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
        <input
          type="date"
          className="tx-filter-date"
          value={filters.startDate}
          onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
          title="From date"
        />
        <input
          type="date"
          className="tx-filter-date"
          value={filters.endDate}
          onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
          title="To date"
        />
      </div>

      {/* Month summary */}
      {!loading && transactions.length > 0 && (
        <div className="tx-month-row">
          <div className="tx-summary-row">
            <span className="tx-summary-income">+{fmt(totalIncome)}</span>
            <span className="tx-summary-sep">·</span>
            <span className="tx-summary-expense">−{fmt(totalExpense)}</span>
            <span className="tx-summary-sep">·</span>
            <span className="tx-summary-net" style={{ color: net >= 0 ? '#00875a' : 'var(--tertiary)' }}>
              {net >= 0 ? '+' : '−'}{fmt(net)}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="tx-error">
          {error}
          <button onClick={() => fetchTransactions(pagination.page, appliedSearch, appliedFilters)}>Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : transactions.length === 0 ? (
        <div className="tx-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--outline-variant)" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <p>No transactions found</p>
          {hasFilters && (
            <button className="tx-filter-clear" onClick={handleClear} style={{ borderRadius: 'var(--radius-md)', padding: '8px 16px' }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {grouped.map(([dateKey, txs]) => {
            const { day, monthYear } = formatDayLabel(dateKey);
            const dayNet = txs.reduce((s, t) => {
              if (t.Type === 'INCOME')  return s + Math.abs(t.Amount_GBP || 0);
              if (t.Type === 'EXPENSE') return s - Math.abs(t.Amount_GBP || 0);
              return s;
            }, 0);

            return (
              <div className="tx-day-group" key={dateKey}>
                <div className="tx-day-header">
                  <div>
                    <p className="tx-day-label">{day}</p>
                    <p className="tx-day-date">{monthYear}</p>
                  </div>
                  <span className={`tx-day-sum ${dayNet >= 0 ? 'tx-day-sum--positive' : 'tx-day-sum--negative'}`}>
                    {dayNet >= 0 ? '+' : '−'}{fmt(dayNet)}
                  </span>
                </div>

                {txs.map((tx) => {
                  const isIncome   = tx.Type === 'INCOME';
                  const isTransfer = tx.Type === 'TRANSFER';
                  const emoji = isTransfer ? '🔄' : getCategoryEmoji(tx.Category);
                  const iconBg = isIncome
                    ? 'rgba(0,135,90,0.12)'
                    : isTransfer
                      ? 'rgba(91,91,95,0.08)'
                      : 'rgba(182,0,81,0.12)';
                  const amtClass = isIncome
                    ? 'tx-item-amount--income'
                    : isTransfer
                      ? 'tx-item-amount--transfer'
                      : 'tx-item-amount--expense';
                  const sign = isIncome ? '+' : isTransfer ? '' : '−';

                  return (
                    <div className="tx-item" key={tx._id}>
                      <div className="tx-item-icon" style={{ background: iconBg }}>
                        {emoji}
                      </div>
                      <div className="tx-item-info">
                        <p className="tx-item-category">
                          {tx.Category || 'Uncategorized'}
                          {tx.Subcategory ? ` · ${tx.Subcategory}` : ''}
                        </p>
                        <p className="tx-item-account">🏦 {tx.Account}</p>
                      </div>
                      <div className="tx-item-right">
                        <div className="tx-item-actions">
                          <button
                            className="action-btn"
                            onClick={() => { setEditingTx(tx); setModalOpen(true); }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="action-btn action-btn--delete"
                            onClick={() => setDeleteId(tx._id)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                        <p className={`tx-item-amount ${amtClass}`}>
                          {sign}{fmt(tx.Amount_GBP)}
                        </p>
                        <p className="tx-item-time">{getTime(tx.Date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="tx-pagination">
              <p className="tx-pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
              </p>
              <div className="tx-pagination-controls">
                <button
                  className="tx-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => { fetchTransactions(pagination.page - 1, appliedSearch, appliedFilters); setPagination(p => ({ ...p, page: p.page - 1 })); }}
                >
                  <ChevronIcon dir="left" />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let page;
                  if (pagination.pages <= 5)            page = i + 1;
                  else if (pagination.page <= 3)        page = i + 1;
                  else if (pagination.page >= pagination.pages - 2) page = pagination.pages - 4 + i;
                  else                                  page = pagination.page - 2 + i;
                  return (
                    <button
                      key={page}
                      className={`tx-page-btn${pagination.page === page ? ' tx-page-btn--active' : ''}`}
                      onClick={() => { fetchTransactions(page, appliedSearch, appliedFilters); setPagination(p => ({ ...p, page })); }}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className="tx-page-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => { fetchTransactions(pagination.page + 1, appliedSearch, appliedFilters); setPagination(p => ({ ...p, page: p.page + 1 })); }}
                >
                  <ChevronIcon dir="right" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button className="tx-fab" onClick={() => { setEditingTx(null); setModalOpen(true); }} title="Add Transaction">
        +
      </button>

      {/* Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTx(null); }}
        transaction={editingTx}
        onSuccess={handleModalSuccess}
      />

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="confirm-dialog">
            <h3 className="confirm-title">Delete Transaction</h3>
            <p className="confirm-text">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="btn-spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
