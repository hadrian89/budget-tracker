import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import axiosInstance from '../api/axios';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';
import './Dashboard.css';
import { formatDate } from '../utils/dateUtils';

// ── Icons ────────────────────────────────────────────────────
const IncomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ExpenseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const BalanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────
const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const fmt = (v) => {
  if (v === null || v === undefined) return '£0.00';
  return `£${Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1000) return `£${(abs / 1000).toFixed(1)}k`;
  return `£${abs.toFixed(0)}`;
};

// formatDate imported from dateUtils

const getCategoryEmoji = (cat) => {
  const map = {
    'Food & Dining': '🍔', 'Shopping': '🛍️', 'Transport': '🚗',
    'Entertainment': '🎉', 'Bills & Utilities': '📄', 'Health & Fitness': '💊',
    'Travel': '✈️', 'Education': '🎓', 'Salary': '💰', 'Investments': '📈',
    'Other Income': '💵', 'Personal Care': '🪥', 'Home': '🏠',
  };
  return map[cat] || '📦';
};

const TYPE_ICON_COLORS = {
  INCOME:   { bg: 'rgba(5,150,105,0.1)',   emoji: getCategoryEmoji },
  EXPENSE:  { bg: 'rgba(220,38,38,0.1)',   emoji: getCategoryEmoji },
  TRANSFER: { bg: 'rgba(42,20,180,0.08)',  emoji: () => '🔄' },
};

const PIE_COLORS = ['#2a14b4', '#4338ca', '#4700ab', '#006c49', '#0891b2', '#7c3aed', '#db2777', '#d97706'];

// ── Custom Tooltip ───────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

const SparkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ fontWeight: 600 }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

const QUICK_ADD_ICONS = ['🛒','☕','🍕','🚌','⛽','💊','🎬','🏋️','📚','🐾','🍺','🧴','🍔','✈️','🎮','🛍️'];

// ── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const [homeData, setHomeData] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePie, setActivePie] = useState(0);

  // Quick Add
  const [presets, setPresets] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [editPreset, setEditPreset] = useState(null);
  const [presetForm, setPresetForm] = useState({ label: '', icon: '🛒', type: 'Expense', amount: '', category: '', subcategory: '', account: '', notes: '' });
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetError, setPresetError] = useState('');
  const [txOpen, setTxOpen] = useState(false);
  const [txPrefill, setTxPrefill] = useState(null);
  const [quickCats, setQuickCats] = useState([]);
  const [quickAccounts, setQuickAccounts] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [homeRes, monthlyRes] = await Promise.all([
        axiosInstance.get('/api/dashboard/home'),
        axiosInstance.get('/api/dashboard/monthly'),
      ]);
      setHomeData(homeRes.data);
      setMonthly(monthlyRes.data.monthly || []);
    } catch (err) {
      // Fallback to old endpoints if /home doesn't exist
      try {
        const [statsRes, monthlyRes, catRes, recentRes] = await Promise.all([
          axiosInstance.get('/api/transactions/stats'),
          axiosInstance.get('/api/dashboard/monthly'),
          axiosInstance.get('/api/dashboard/categories'),
          axiosInstance.get('/api/dashboard/recent'),
        ]);
        setHomeData({
          totalBalance: statsRes.data.balance,
          monthlyIncome: statsRes.data.totalIncome,
          monthlyExpense: statsRes.data.totalExpense,
          monthlyNet: (statsRes.data.totalIncome || 0) - (statsRes.data.totalExpense || 0),
          accounts: [],
          cashflowCategories: catRes.data.categories || [],
          recentTransactions: recentRes.data.transactions || [],
          sparkline: [],
          monthLabel: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        });
        setMonthly(monthlyRes.data.monthly || []);
      } catch (err2) {
        setError('Failed to load dashboard data.');
        console.error(err2);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Quick Add ──────────────────────────────────────────────
  const fetchPresets = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/auth/quick-add');
      setPresets(res.data.presets || []);
    } catch {}
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const openManage = async () => {
    setManageOpen(true);
    setEditPreset(null);
    setPresetForm({ label: '', icon: '🛒', type: 'Expense', amount: '', category: '', subcategory: '', account: '', notes: '' });
    setPresetError('');
    try {
      const [catRes, accRes] = await Promise.all([
        axiosInstance.get('/api/categories'),
        axiosInstance.get('/api/accounts'),
      ]);
      setQuickCats(catRes.data.categories || []);
      setQuickAccounts(accRes.data.accounts || []);
    } catch {}
  };

  const startEditPreset = (p) => {
    setEditPreset(p);
    setPresetForm({
      label: p.label, icon: p.icon, type: p.type,
      amount: p.amount != null ? String(p.amount) : '',
      category: p.category || '', subcategory: p.subcategory || '', account: p.account || '', notes: p.notes || '',
    });
    setPresetError('');
  };

  const resetPresetForm = () => {
    setEditPreset(null);
    setPresetForm({ label: '', icon: '🛒', type: 'Expense', amount: '', category: '', subcategory: '', account: '', notes: '' });
    setPresetError('');
  };

  const handlePresetSave = async () => {
    if (!presetForm.label.trim()) { setPresetError('Label is required.'); return; }
    setPresetSaving(true);
    setPresetError('');
    try {
      const payload = { ...presetForm, amount: presetForm.amount ? parseFloat(presetForm.amount) : null };
      let res;
      if (editPreset) {
        res = await axiosInstance.put(`/api/auth/quick-add/${editPreset._id}`, payload);
      } else {
        res = await axiosInstance.post('/api/auth/quick-add', payload);
      }
      setPresets(res.data.presets);
      resetPresetForm();
    } catch (e) {
      setPresetError(e.response?.data?.message || 'Failed to save.');
    } finally {
      setPresetSaving(false);
    }
  };

  const handlePresetDelete = async (id) => {
    try {
      const res = await axiosInstance.delete(`/api/auth/quick-add/${id}`);
      setPresets(res.data.presets);
      if (editPreset?._id === id) resetPresetForm();
    } catch {}
  };

  const handleQuickAdd = (p) => {
    setTxPrefill({
      Type: p.type || 'Expense',
      Category: p.category || '',
      Subcategory: p.subcategory || '',
      Account: p.account || '',
      Amount: p.amount ? String(p.amount) : '',
      Notes: p.notes || '',
    });
    setTxOpen(true);
  };

  const totalBalance    = homeData?.totalBalance    ?? 0;
  const monthlyIncome   = homeData?.monthlyIncome   ?? 0;
  const monthlyExpense  = homeData?.monthlyExpense  ?? 0;
  const monthlyNet      = homeData?.monthlyNet      ?? (monthlyIncome - monthlyExpense);
  const accounts        = homeData?.accounts        ?? [];
  const categories      = homeData?.cashflowCategories ?? [];
  const recent          = homeData?.recentTransactions  ?? [];
  const sparkline       = homeData?.sparkline       ?? [];
  const monthLabel      = homeData?.monthLabel      ?? '';
  const lastActivity    = homeData?.lastActivity    ?? {};
  const budgetStatus    = homeData?.budgetStatus    ?? [];

  const netPositive = monthlyNet >= 0;

  return (
    <div className="dashboard">
      {error && (
        <div className="dashboard-error">
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="dashboard-stats">
        <StatCard
          icon={<IncomeIcon />}
          label="Monthly Income"
          value={fmt(monthlyIncome)}
          color="success"
          loading={loading}
        />
        <StatCard
          icon={<ExpenseIcon />}
          label="Monthly Expenses"
          value={fmt(monthlyExpense)}
          color="danger"
          loading={loading}
        />
        <StatCard
          icon={<BalanceIcon />}
          label="Net this Month"
          value={`${netPositive ? '+' : '−'}${fmt(monthlyNet)}`}
          color={netPositive ? 'success' : 'danger'}
          loading={loading}
        />
      </div>

      {/* Quick Add */}
      <div className="quick-add-section">
        <div className="quick-add-header">
          <span className="quick-add-title">Quick Add</span>
          <button className="quick-add-manage-btn" onClick={openManage}>Manage</button>
        </div>
        <div className="quick-add-chips">
          {presets.length === 0 && (
            <span className="quick-add-empty">No shortcuts yet — click Manage to add one.</span>
          )}
          {presets.map((p) => (
            <button key={p._id} className="quick-chip" onClick={() => handleQuickAdd(p)}>
              <span className="quick-chip-icon">{p.icon}</span>
              <span className="quick-chip-label">{p.label}</span>
              {p.amount ? <span className="quick-chip-amount">£{p.amount}</span> : null}
            </button>
          ))}
          <button className="quick-chip quick-chip--new" onClick={openManage} title="Add shortcut">＋</button>
        </div>
      </div>

      {/* Hero bento: balance card + accounts panel */}
      <div className="dashboard-bento">
        {/* Balance card */}
        <div className="balance-card">
          <span className="balance-card-bg-icon">💳</span>
          <div>
            <p className="balance-label">Total Balance</p>
            {loading ? (
              <div className="stat-card-skeleton" style={{ height: 48, width: '60%', borderRadius: 12 }} />
            ) : (
              <p className="balance-amount">{fmt(totalBalance)}</p>
            )}
          </div>
          <div className="balance-row">
            <span className={`balance-badge ${netPositive ? 'balance-badge--positive' : 'balance-badge--negative'}`}>
              {netPositive ? '▲' : '▼'} {fmt(Math.abs(monthlyNet))} this month
            </span>
            {monthLabel && (
              <span className="balance-month-label">{monthLabel}</span>
            )}
          </div>
          {sparkline.length > 0 && (
            <div className="balance-sparkline">
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="rgba(255,255,255,0.5)" stopOpacity={1} />
                      <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                    fill="url(#sparkGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'white' }}
                  />
                  <Tooltip content={<SparkTooltip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Accounts panel */}
        <div className="accounts-panel">
          <div className="accounts-panel-header">
            <span className="accounts-panel-title">Managed Accounts</span>
            <Link to="/accounts" className="accounts-panel-link">See all</Link>
          </div>
          {loading ? (
            <div className="loading-container" style={{ minHeight: 120 }}>
              <div className="spinner" />
            </div>
          ) : accounts.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--outline)', fontFamily: 'Inter, sans-serif' }}>
              No accounts yet.
            </p>
          ) : (
            accounts.slice(0, 4).map((acc) => (
              <div className="account-row" key={acc._id || acc.name}>
                <div className="account-row-icon">
                  {acc.icon || '🏦'}
                </div>
                <div className="account-row-info">
                  <p className="account-row-name">{acc.name}</p>
                  <p className="account-row-type">{acc.type || 'Account'}</p>
                </div>
                <span className="account-row-balance">{fmt(acc.balance)}</span>
              </div>
            ))
          )}
          <Link to="/accounts" className="accounts-add-btn">+ Add Account</Link>
        </div>
      </div>

      {/* Middle row: Cash Flow + Asset Allocation */}
      <div className="dashboard-mid">
        {/* Cash Flow bar chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Monthly Flux</h3>
            <p className="chart-card-subtitle">Income vs Expenses — Last 7 months</p>
          </div>
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : monthly.length === 0 ? (
            <div className="chart-empty">No data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthly} barGap={4} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: 'var(--outline)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--outline)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtShort}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(91,91,95,0.04)' }} />
                  <Bar dataKey="income"  name="Income"   fill="rgba(5,150,105,0.75)"  radius={[6,6,0,0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Expenses" fill="rgba(220,38,38,0.65)" radius={[6,6,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
              <div className="cashflow-stats">
                <div className="cashflow-stat-box">
                  <p className="cashflow-stat-label">Inflow</p>
                  <p className="cashflow-stat-value cashflow-stat-value--income">{fmt(monthlyIncome)}</p>
                </div>
                <div className="cashflow-stat-box">
                  <p className="cashflow-stat-label">Outflow</p>
                  <p className="cashflow-stat-value cashflow-stat-value--expense">{fmt(monthlyExpense)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Asset allocation donut */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Asset Allocation</h3>
            <p className="chart-card-subtitle">Spending by category</p>
          </div>
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : categories.length === 0 ? (
            <div className="chart-empty">No category data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={80}
                    dataKey="amount"
                    nameKey="name"
                    onMouseEnter={(_, i) => setActivePie(i)}
                    paddingAngle={2}
                  >
                    {categories.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={activePie === i ? 1 : 0.75}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [fmt(v), '']}
                    contentStyle={{
                      background: 'var(--surface-lowest)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-float)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {categories.slice(0, 5).map((cat, i) => (
                  <div
                    key={cat.name}
                    className={`pie-legend-item${activePie === i ? ' pie-legend-item--active' : ''}`}
                    onMouseEnter={() => setActivePie(i)}
                  >
                    <span className="pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="pie-legend-label">{cat.name}</span>
                    <span className="pie-legend-value">{fmt(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Budget limits widget */}
      {!loading && budgetStatus.length > 0 && (
        <div className="budget-widget">
          <div className="budget-widget-header">
            <h3 className="budget-widget-title">Budget Limits — {monthLabel}</h3>
            <Link to="/categories" className="budget-widget-link">Manage →</Link>
          </div>
          <div className="budget-widget-list">
            {budgetStatus.map((b) => {
              const isOver    = b.over;
              const isWarning = !isOver && b.pct >= 80;
              const barColor  = isOver ? 'var(--error)' : isWarning ? '#f59e0b' : b.color;
              return (
                <div key={b.name} className="budget-row">
                  <span className="budget-row-icon">{b.icon}</span>
                  <div className="budget-row-body">
                    <div className="budget-row-top">
                      <span className="budget-row-name">{b.name}</span>
                      <span className={`budget-row-amount${isOver ? ' budget-row-amount--over' : ''}`}>
                        {fmt(b.spent)} / {fmt(b.limit)}
                      </span>
                    </div>
                    <div className="budget-bar-bg">
                      <div className="budget-bar-fill" style={{ width: `${Math.min(b.pct, 100)}%`, background: barColor }} />
                    </div>
                  </div>
                  <span className={`budget-pct${isOver ? ' budget-pct--over' : isWarning ? ' budget-pct--warn' : ''}`}>
                    {isOver ? '⚠' : `${b.pct}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity strip */}
      {!loading && (lastActivity.lastVisit || lastActivity.lastUpdate) && (
        <div className="activity-strip">
          <span className="activity-strip-icon">🕐</span>
          <div className="activity-strip-items">
            {lastActivity.lastVisit && (
              <span className="activity-strip-item">
                <span className="activity-strip-label">Last visit</span>
                <span className="activity-strip-value">{timeAgo(lastActivity.lastVisit)}</span>
              </span>
            )}
            {lastActivity.lastUpdate && (
              <span className="activity-strip-item">
                <span className="activity-strip-label">Last update</span>
                <span className="activity-strip-value">{timeAgo(lastActivity.lastUpdate)}</span>
              </span>
            )}
            {lastActivity.lastDevice && (
              <span className="activity-strip-item">
                <span className="activity-strip-label">Device</span>
                <span className="activity-strip-value">{lastActivity.lastDevice}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Add manage modal */}
      {manageOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setManageOpen(false)}>
          <div className="cat-modal">
            <div className="cat-modal-header">
              <h2>Quick Add Shortcuts</h2>
              <button className="modal-close-btn" onClick={() => { setManageOpen(false); resetPresetForm(); }}>✕</button>
            </div>

            {/* Form */}
            <div className="cat-form-section">
              <p className="cat-form-title">{editPreset ? 'Edit Shortcut' : 'New Shortcut'}</p>
              {presetError && <div className="form-error">{presetError}</div>}

              <div className="cat-form-row">
                {/* Icon picker */}
                <div className="form-group-sm">
                  <label className="form-label-sm">Icon</label>
                  <div className="icon-picker">
                    {QUICK_ADD_ICONS.map((ic) => (
                      <button
                        key={ic} type="button"
                        className={`icon-btn${presetForm.icon === ic ? ' icon-btn--active' : ''}`}
                        onClick={() => setPresetForm((p) => ({ ...p, icon: ic }))}
                      >{ic}</button>
                    ))}
                  </div>
                </div>

                <div className="cat-form-fields">
                  <div className="form-group-sm">
                    <label className="form-label-sm">Label *</label>
                    <input
                      className="form-input-sm"
                      value={presetForm.label}
                      onChange={(e) => setPresetForm((p) => ({ ...p, label: e.target.value }))}
                      placeholder="e.g. Grocery run"
                    />
                  </div>

                  <div className="form-group-sm">
                    <label className="form-label-sm">Type</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Expense', 'Income'].map((t) => (
                        <button
                          key={t} type="button"
                          className={`icon-btn${presetForm.type === t ? ' icon-btn--active' : ''}`}
                          style={{ flex: 1, fontSize: 12, padding: '6px 0' }}
                          onClick={() => setPresetForm((p) => ({ ...p, type: t }))}
                        >{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group-sm">
                    <label className="form-label-sm">Default Amount (£) — optional</label>
                    <input
                      className="form-input-sm"
                      type="number" min="0" step="0.01"
                      value={presetForm.amount}
                      onChange={(e) => setPresetForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="Leave blank to enter at time of adding"
                    />
                  </div>

                  <div className="form-group-sm">
                    <label className="form-label-sm">Category — optional</label>
                    <select
                      className="form-input-sm"
                      value={presetForm.category}
                      onChange={(e) => setPresetForm((p) => ({ ...p, category: e.target.value, subcategory: '' }))}
                    >
                      <option value="">None</option>
                      {quickCats.map((c) => (
                        <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const subs = quickCats.find((c) => c.name === presetForm.category)?.subcategories || [];
                    if (!subs.length) return null;
                    return (
                      <div className="form-group-sm">
                        <label className="form-label-sm">Subcategory — optional</label>
                        <select
                          className="form-input-sm"
                          value={presetForm.subcategory}
                          onChange={(e) => setPresetForm((p) => ({ ...p, subcategory: e.target.value }))}
                        >
                          <option value="">None</option>
                          {subs.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  <div className="form-group-sm">
                    <label className="form-label-sm">Account — optional</label>
                    <select
                      className="form-input-sm"
                      value={presetForm.account}
                      onChange={(e) => setPresetForm((p) => ({ ...p, account: e.target.value }))}
                    >
                      <option value="">Default (primary)</option>
                      {quickAccounts.map((a) => (
                        <option key={a._id} value={a.name}>{a.icon || '🏦'} {a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="cat-form-actions">
                {editPreset && (
                  <button className="btn btn-ghost" onClick={resetPresetForm} type="button">Cancel</button>
                )}
                <button className="btn btn-primary" onClick={handlePresetSave} disabled={presetSaving}>
                  {presetSaving ? <span className="btn-spinner" /> : (editPreset ? 'Save Changes' : 'Add Shortcut')}
                </button>
              </div>
            </div>

            {/* Existing presets list */}
            {presets.length > 0 && (
              <div className="cat-manage-list">
                <p className="cat-form-title">Your Shortcuts</p>
                {presets.map((p) => (
                  <div key={p._id} className="cat-manage-item">
                    <div className="cat-manage-icon" style={{ background: 'var(--surface-container)' }}>
                      <span>{p.icon}</span>
                    </div>
                    <div className="cat-manage-info">
                      <span className="cat-manage-name">{p.label}</span>
                      <span className="cat-manage-subs">
                        {p.type}{p.amount ? ` · £${p.amount}` : ''}{p.category ? ` · ${p.category}` : ''}{p.subcategory ? ` › ${p.subcategory}` : ''}
                      </span>
                    </div>
                    <div className="cat-manage-actions">
                      <button className="action-btn" onClick={() => startEditPreset(p)} title="Edit">✏️</button>
                      <button className="action-btn action-btn--delete" onClick={() => handlePresetDelete(p._id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction modal (from quick add) */}
      <TransactionModal
        isOpen={txOpen}
        onClose={() => { setTxOpen(false); setTxPrefill(null); }}
        transaction={null}
        prefill={txPrefill}
        onSuccess={() => { fetchData(); setTxOpen(false); setTxPrefill(null); }}
      />

      {/* Recent transactions */}
      <div className="recent-section">
        <div className="recent-header">
          <h3 className="recent-title">Recent Movements</h3>
          <Link to="/transactions" className="recent-view-all">View History →</Link>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : recent.length === 0 ? (
          <div className="recent-empty">No transactions yet.</div>
        ) : (
          <div className="recent-list">
            {recent.slice(0, 8).map((tx) => {
              const typeNorm = tx.Type?.toUpperCase();
              const isIncome = typeNorm === 'INCOME';
              const isTransfer = typeNorm === 'TRANSFER';
              const colorConf = TYPE_ICON_COLORS[typeNorm] || TYPE_ICON_COLORS.EXPENSE;
              const emoji = isTransfer ? '🔄' : getCategoryEmoji(tx.Category);
              const amountClass = isIncome ? 'recent-item-amount--income' : isTransfer ? 'recent-item-amount--transfer' : 'recent-item-amount--expense';
              const sign = isIncome ? '+' : isTransfer ? '' : '−';

              return (
                <div className="recent-item" key={tx._id}>
                  <div className="recent-item-left">
                    <div className="recent-item-icon" style={{ background: colorConf.bg }}>
                      {emoji}
                    </div>
                    <div className="recent-item-info">
                      <p className="recent-item-name">{tx.Category || 'Transaction'}</p>
                      <p className="recent-item-meta">{tx.Subcategory ? `${tx.Subcategory} · ` : ''}{tx.Account}</p>
                    </div>
                  </div>
                  <div className="recent-item-right">
                    <p className={`recent-item-amount ${amountClass}`}>
                      {sign}{fmt(tx.Amount_GBP)}
                    </p>
                    <p className="recent-item-time">{formatDate(tx.Date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
