import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import axiosInstance from '../api/axios';
import MonthPicker from '../components/MonthPicker';
import './Analytics.css';

const toMonthStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const formatFull = (v) =>
  `£${Math.abs(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1000) return `£${(abs / 1000).toFixed(0)}k`;
  return `£${abs.toFixed(0)}`;
};

const pctStr = (v) => {
  if (v === null || v === undefined) return '—';
  const num = parseFloat(v);
  if (!isFinite(num)) return '—';
  return `${num > 0 ? '+' : ''}${num.toFixed(0)}%`;
};

const pctClass = (v) => {
  if (v === null || v === undefined) return '';
  const num = parseFloat(v);
  return num >= 0 ? 'text-green' : 'text-red';
};

const TAB_OPTIONS = ['Income', 'Expenses', 'Total'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip-label">Day {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="an-tooltip-row">
          {p.name}: {formatFull(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [month, setMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Total');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const ms = toMonthStr(month);
      const res = await axiosInstance.get(`/api/dashboard/analytics?month=${ms}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to load analytics.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthName = month.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const dailySeries = data?.dailySeries || [];

  const formatXAxis = (day) => {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    return d.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' });
  };

  const cashflow = data?.cashflow  || { income: 0, expense: 0, net: 0 };
  const averages  = data?.averages  || {};
  const compare   = data?.compare   || {};

  return (
    <div className="analytics-page">
      {/* Header with month picker */}
      <div className="an-header">
        <MonthPicker month={month} onChange={setMonth} showFilter />
      </div>

      {/* Tab switcher */}
      <div className="an-tabs">
        {TAB_OPTIONS.map((t) => (
          <button
            key={t}
            className={`an-tab${activeTab === t ? ' an-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : error ? (
        <div className="an-error">{error} <button onClick={fetchData}>Retry</button></div>
      ) : (
        <>
          {/* Area chart */}
          <div className="an-chart-card">
            <div className="an-chart-axes-label">
              <span>
                {formatShort(Math.max(
                  ...dailySeries.map((d) => Math.max(d.cumIncome || 0, d.cumExpense || 0, 1))
                ))}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00875a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00875a" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatXAxis}
                  tick={{ fill: 'var(--outline)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(dailySeries.length / 5)}
                />
                <YAxis
                  tick={{ fill: 'var(--outline)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatShort}
                />
                <Tooltip content={<CustomTooltip />} />
                {(activeTab === 'Income' || activeTab === 'Total') && (
                  <Area
                    type="monotone"
                    dataKey="cumIncome"
                    name="Income"
                    stroke="#00875a"
                    strokeWidth={2}
                    fill="url(#gradIncome)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#00875a' }}
                  />
                )}
                {(activeTab === 'Expenses' || activeTab === 'Total') && (
                  <Area
                    type="monotone"
                    dataKey="cumExpense"
                    name="Expenses"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fill="url(#gradExpense)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#dc2626' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cash flow card */}
          <div className="an-card">
            <div className="an-card-header">
              <span className="an-card-title">Cash flow</span>
              <span className="an-card-subtitle">{monthName}</span>
            </div>
            <div className="an-cf-row">
              <div className="an-cf-icon an-cf-icon--income">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </div>
              <span className="an-cf-label">Income</span>
              <span className="an-cf-value text-green">{formatFull(cashflow.income)}</span>
            </div>
            <div className="an-cf-row">
              <div className="an-cf-icon an-cf-icon--expense">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                </svg>
              </div>
              <span className="an-cf-label">Expenses</span>
              <span className="an-cf-value text-red">{formatFull(cashflow.expense)}</span>
            </div>
            <div className="an-cf-divider" />
            <div className="an-cf-row an-cf-total">
              <span className="an-cf-label">Total:</span>
              <span className={`an-cf-value fw-700 ${cashflow.net >= 0 ? 'text-green' : 'text-red'}`}>
                {cashflow.net >= 0 ? '+' : ''}{formatFull(cashflow.net)}
              </span>
            </div>
          </div>

          {/* Averages card */}
          <div className="an-card">
            <div className="an-card-header">
              <span className="an-card-title">Averages</span>
              <span className="an-card-subtitle">{monthName}</span>
            </div>
            <table className="an-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-green">Income</th>
                  <th className="text-red">Expense</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="an-table-label">Per day</td>
                  <td className="text-green">{formatFull(averages.dayIncome)}</td>
                  <td className="text-red">{formatFull(averages.dayExpense)}</td>
                </tr>
                <tr>
                  <td className="an-table-label">Per week</td>
                  <td className="text-green">{formatFull(averages.weekIncome)}</td>
                  <td className="text-red">{formatFull(averages.weekExpense)}</td>
                </tr>
                <tr>
                  <td className="an-table-label">Monthly</td>
                  <td className="text-green">{formatFull(averages.monthIncome)}</td>
                  <td className="text-red">{formatFull(averages.monthExpense)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compare card */}
          {compare.prevMonth && (
            <div className="an-card">
              <div className="an-card-header">
                <span className="an-card-title">Compare</span>
                <span className="an-card-subtitle">vs. {compare.prevMonth}</span>
              </div>
              <table className="an-table">
                <thead>
                  <tr>
                    <th></th>
                    <th className="text-green">Income</th>
                    <th className="text-red">Expense</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="an-table-label">Previous</td>
                    <td className="text-green">{formatFull(compare.prevIncome)}</td>
                    <td className="text-red">{formatFull(compare.prevExpense)}</td>
                  </tr>
                  <tr>
                    <td className="an-table-label">Difference</td>
                    <td className={pctClass(compare.diffIncome)}>{formatFull(compare.diffIncome)}</td>
                    <td className={pctClass(-compare.diffExpense)}>{formatFull(compare.diffExpense)}</td>
                  </tr>
                  <tr>
                    <td className="an-table-label">Change %</td>
                    <td className={pctClass(compare.pctIncome)}>{pctStr(compare.pctIncome)}</td>
                    <td className={pctClass(-compare.pctExpense)}>{pctStr(compare.pctExpense)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
