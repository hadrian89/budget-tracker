import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import axiosInstance from '../api/axios';
import StatCard from '../components/StatCard';
import './Dashboard.css';

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
const fmt = (v) => {
  if (v === null || v === undefined) return '£0.00';
  return `£${Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1000) return `£${(abs / 1000).toFixed(1)}k`;
  return `£${abs.toFixed(0)}`;
};

const getTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split(' ');
    return parts[1] ? parts[1].slice(0, 5) : '';
  } catch { return ''; }
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

const TYPE_ICON_COLORS = {
  INCOME:   { bg: 'rgba(0,135,90,0.1)',   emoji: getCategoryEmoji },
  EXPENSE:  { bg: 'rgba(182,0,81,0.1)',   emoji: getCategoryEmoji },
  TRANSFER: { bg: 'rgba(91,91,95,0.08)',  emoji: () => '🔄' },
};

const PIE_COLORS = ['#5b5b5f', '#008080', '#b60051', '#747778', '#abadae', '#4f4f53', '#595c5d', '#dfe3e4'];

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

// ── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const [homeData, setHomeData] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePie, setActivePie] = useState(0);

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

  const totalBalance    = homeData?.totalBalance    ?? 0;
  const monthlyIncome   = homeData?.monthlyIncome   ?? 0;
  const monthlyExpense  = homeData?.monthlyExpense  ?? 0;
  const monthlyNet      = homeData?.monthlyNet      ?? (monthlyIncome - monthlyExpense);
  const accounts        = homeData?.accounts        ?? [];
  const categories      = homeData?.cashflowCategories ?? [];
  const recent          = homeData?.recentTransactions  ?? [];
  const sparkline       = homeData?.sparkline       ?? [];
  const monthLabel      = homeData?.monthLabel      ?? '';

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
                      <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#sparkGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--primary)' }}
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
                  <Bar dataKey="income"  name="Income"   fill="rgba(0,135,90,0.7)"  radius={[6,6,0,0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Expenses" fill="rgba(182,0,81,0.65)" radius={[6,6,0,0]} maxBarSize={28} />
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
                    dataKey="total"
                    nameKey="category"
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
                    key={cat.category}
                    className={`pie-legend-item${activePie === i ? ' pie-legend-item--active' : ''}`}
                    onMouseEnter={() => setActivePie(i)}
                  >
                    <span className="pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="pie-legend-label">{cat.category}</span>
                    <span className="pie-legend-value">{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
              const isIncome = tx.Type === 'INCOME';
              const isTransfer = tx.Type === 'TRANSFER';
              const colorConf = TYPE_ICON_COLORS[tx.Type] || TYPE_ICON_COLORS.EXPENSE;
              const emoji = tx.Type === 'TRANSFER' ? '🔄' : getCategoryEmoji(tx.Category);
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
                    <p className="recent-item-time">{getTime(tx.Date)}</p>
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
