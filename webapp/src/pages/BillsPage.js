import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import './BillsPage.css';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = ['All', 'Upcoming', 'Subscriptions', 'EMIs', 'Overdue'];

const FREQUENCIES = [
  { value: 'weekly',      label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly',     label: 'Monthly' },
  { value: 'quarterly',   label: 'Quarterly' },
  { value: 'yearly',      label: 'Yearly' },
  { value: 'one-time',    label: 'One-time' },
];

const PRESET_ICONS = ['📄','🏠','💡','💧','📱','📺','🌐','🚗','🏋️','🎬','🏥','🎓','💳','🏦','🛡️','🎵','☁️','🔥','🧾','🛒'];
const PRESET_COLORS = ['#2a14b4','#4338ca','#4700ab','#006c49','#dc2626','#db2777','#7c3aed','#0891b2','#d97706','#059669','#0ea5e9','#f97316'];

const TYPE_META = {
  bill:         { label: 'Bill',         emoji: '📄', description: 'Utilities, rent, insurance…' },
  subscription: { label: 'Subscription', emoji: '🔁', description: 'Netflix, Spotify, software…' },
  emi:          { label: 'EMI / Loan',   emoji: '🏦', description: 'Car loan, home loan, credit…' },
};

const FREQ_LABELS = {
  weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly',
  quarterly: 'Quarterly', yearly: 'Yearly', 'one-time': 'One-time',
};

// ── Formatting helpers ────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function getDueStatus(bill) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(bill.nextDueDate); due.setHours(0, 0, 0, 0);
  const remind = new Date(today); remind.setDate(remind.getDate() + (bill.remindDaysBefore ?? 3));
  const diffDays = Math.round((due - today) / 86400000);

  if (due < today)   return { status: 'overdue',   label: `Overdue by ${Math.abs(diffDays)}d`,  color: '#b31b25' };
  if (due <= remind) return { status: 'due-soon',  label: diffDays === 0 ? 'Due today' : `Due in ${diffDays}d`, color: '#c47a00' };
  return               { status: 'upcoming',    label: `Due ${fmtDate(bill.nextDueDate)}`, color: '#64748b' };
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = () => ({
  name: '', amount: '', currency: 'GBP', category: 'Bills',
  icon: '📄', color: '#2a14b4', notes: '',
  type: 'bill', frequency: 'monthly', dueDay: '',
  nextDueDate: new Date().toISOString().slice(0, 10),
  totalInstallments: '', remindDaysBefore: '3',
});

// ── Main component ────────────────────────────────────────────────────────────

export default function BillsPage() {
  const [bills, setBills]         = useState([]);
  const [summary, setSummary]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBill, setEditBill]   = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [payingId, setPayingId]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError]         = useState('');
  const [formError, setFormError] = useState('');

  const fetchBills = useCallback(async () => {
    try {
      const res = await api.get('/api/bills');
      setBills(res.data.bills || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredBills = bills.filter((b) => {
    if (activeTab === 'Overdue')       return getDueStatus(b).status === 'overdue' && b.status === 'active';
    if (activeTab === 'Upcoming')      return getDueStatus(b).status !== 'overdue' && b.status === 'active';
    if (activeTab === 'Subscriptions') return b.type === 'subscription';
    if (activeTab === 'EMIs')          return b.type === 'emi';
    return true;
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditBill(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (bill) => {
    setEditBill(bill);
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      currency: bill.currency || 'GBP',
      category: bill.category || 'Bills',
      icon: bill.icon || '📄',
      color: bill.color || '#2a14b4',
      notes: bill.notes || '',
      type: bill.type || 'bill',
      frequency: bill.frequency || 'monthly',
      dueDay: bill.dueDay ? String(bill.dueDay) : '',
      nextDueDate: new Date(bill.nextDueDate).toISOString().slice(0, 10),
      totalInstallments: bill.totalInstallments ? String(bill.totalInstallments) : '',
      remindDaysBefore: String(bill.remindDaysBefore ?? 3),
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditBill(null); };

  const setF = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError('Name is required');
    if (!form.amount || isNaN(parseFloat(form.amount))) return setFormError('Valid amount is required');
    if (!form.nextDueDate) return setFormError('Next due date is required');
    setSaving(true); setFormError('');
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
        totalInstallments: form.totalInstallments ? parseInt(form.totalInstallments) : undefined,
        remindDaysBefore: parseInt(form.remindDaysBefore) || 3,
      };
      if (editBill) await api.put(`/api/bills/${editBill._id}`, payload);
      else          await api.post('/api/bills', payload);
      closeModal();
      fetchBills();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Pay ────────────────────────────────────────────────────────────────────

  const handlePay = async (bill) => {
    setPayingId(bill._id);
    try {
      await api.post(`/api/bills/${bill._id}/pay`, {});
      fetchBills();
    } catch {
      setError('Failed to record payment');
    } finally {
      setPayingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/bills/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchBills();
    } catch {
      setError('Failed to delete bill');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bills-page">

      {/* Header */}
      <div className="bills-header">
        <div>
          <h1 className="bills-title">Bills & Reminders</h1>
          <p className="bills-subtitle">Track recurring bills, EMIs, and subscriptions</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Bill</button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bills-error">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Overdue alert */}
      {summary.overdueCount > 0 && (
        <div className="bills-alert">
          <span className="bills-alert-icon">⚠️</span>
          <span>You have <strong>{summary.overdueCount}</strong> overdue bill{summary.overdueCount > 1 ? 's' : ''} — please review them.</span>
          <button onClick={() => setActiveTab('Overdue')}>View Overdue</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="bills-summary">
        <div className="bills-stat-card">
          <span className="bills-stat-label">Monthly Total</span>
          <span className="bills-stat-value">{fmt(summary.totalMonthly)}</span>
          <span className="bills-stat-sub">across all active bills</span>
        </div>
        <div className="bills-stat-card bills-stat-card--danger">
          <span className="bills-stat-label">Overdue</span>
          <span className="bills-stat-value bills-stat-value--danger">{summary.overdueCount ?? 0}</span>
          <span className="bills-stat-sub">need attention</span>
        </div>
        <div className="bills-stat-card bills-stat-card--warn">
          <span className="bills-stat-label">Due Soon</span>
          <span className="bills-stat-value bills-stat-value--warn">{summary.dueSoonCount ?? 0}</span>
          <span className="bills-stat-sub">within reminder window</span>
        </div>
        <div className="bills-stat-card bills-stat-card--success">
          <span className="bills-stat-label">Paid This Month</span>
          <span className="bills-stat-value bills-stat-value--success">{summary.paidThisMonth ?? 0}</span>
          <span className="bills-stat-sub">payments recorded</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bills-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`bills-tab${activeTab === t ? ' bills-tab--active' : ''}${t === 'Overdue' && summary.overdueCount > 0 ? ' bills-tab--badge' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
            {t === 'Overdue' && summary.overdueCount > 0 && (
              <span className="bills-tab-badge">{summary.overdueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bill list */}
      {loading ? (
        <div className="bills-loading">
          <div className="spinner" />
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="bills-empty">
          <div className="bills-empty-icon">📋</div>
          <p>No bills here yet.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add your first bill</button>
        </div>
      ) : (
        <div className="bills-list">
          {filteredBills.map((bill) => {
            const due = getDueStatus(bill);
            const isEmi = bill.type === 'emi' && bill.totalInstallments;
            const emiPct = isEmi ? Math.min((bill.paidInstallments / bill.totalInstallments) * 100, 100) : 0;

            return (
              <div key={bill._id} className={`bill-card bill-card--${due.status}`}>
                {/* Icon */}
                <div className="bill-icon" style={{ background: bill.color + '22', color: bill.color }}>
                  {bill.icon}
                </div>

                {/* Info */}
                <div className="bill-info">
                  <div className="bill-name-row">
                    <span className="bill-name">{bill.name}</span>
                    <span className="bill-type-badge bill-type-badge--bill">
                      {TYPE_META[bill.type]?.emoji} {TYPE_META[bill.type]?.label}
                    </span>
                  </div>
                  <div className="bill-meta-row">
                    <span className="bill-freq">{FREQ_LABELS[bill.frequency]}</span>
                    {bill.category && <span className="bill-cat">· {bill.category}</span>}
                  </div>

                  {/* EMI progress */}
                  {isEmi && (
                    <div className="bill-emi-wrap">
                      <div className="bill-emi-bar-bg">
                        <div className="bill-emi-bar-fill" style={{ width: `${emiPct}%`, background: bill.color }} />
                      </div>
                      <span className="bill-emi-label">
                        {bill.paidInstallments}/{bill.totalInstallments} paid
                        {bill.status === 'completed' && ' · ✓ Complete'}
                      </span>
                    </div>
                  )}

                  {/* Due status */}
                  <div className="bill-due-row">
                    <span className="bill-due-badge" style={{ color: due.color, background: due.color + '15' }}>
                      {due.status === 'overdue' ? '🔴' : due.status === 'due-soon' ? '🟡' : '📅'} {due.label}
                    </span>
                    {bill.notes && <span className="bill-notes">{bill.notes}</span>}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="bill-right">
                  <span className="bill-amount">{fmt(bill.amount)}</span>
                  <div className="bill-actions">
                    {bill.status === 'active' && (
                      <button
                        className="bill-pay-btn"
                        onClick={() => handlePay(bill)}
                        disabled={payingId === bill._id}
                        title="Mark as paid"
                      >
                        {payingId === bill._id ? '…' : '✓ Pay'}
                      </button>
                    )}
                    {bill.status === 'completed' && (
                      <span className="bill-completed-badge">✓ Done</span>
                    )}
                    <button className="action-btn" onClick={() => openEdit(bill)} title="Edit">✏️</button>
                    <button className="action-btn action-btn--delete" onClick={() => setDeleteTarget(bill)} title="Delete">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal bills-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editBill ? 'Edit Bill' : 'Add Bill'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="bills-modal-body">
              {/* Type selector */}
              <div className="form-group">
                <label className="form-label">TYPE</label>
                <div className="bills-type-grid">
                  {Object.entries(TYPE_META).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      className={`bills-type-btn${form.type === key ? ' bills-type-btn--active' : ''}`}
                      onClick={() => setF('type', key)}
                    >
                      <span className="bills-type-emoji">{meta.emoji}</span>
                      <span className="bills-type-label">{meta.label}</span>
                      <span className="bills-type-desc">{meta.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Icon row */}
              <div className="modal-row">
                <div className="form-group">
                  <label className="form-label">NAME</label>
                  <input className="form-input" value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Netflix, Rent…" />
                </div>
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <input className="form-input" value={form.category} onChange={(e) => setF('category', e.target.value)} placeholder="Bills" />
                </div>
              </div>

              {/* Amount + Frequency */}
              <div className="modal-row">
                <div className="form-group">
                  <label className="form-label">AMOUNT (£)</label>
                  <div className="form-input-prefix">
                    <span className="form-prefix">£</span>
                    <input className="form-input form-input--prefixed" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setF('amount', e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">FREQUENCY</label>
                  <select className="form-input form-select" value={form.frequency} onChange={(e) => setF('frequency', e.target.value)}>
                    {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Next due date + remind days */}
              <div className="modal-row">
                <div className="form-group">
                  <label className="form-label">NEXT DUE DATE</label>
                  <input className="form-input" type="date" value={form.nextDueDate} onChange={(e) => setF('nextDueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">REMIND (DAYS BEFORE)</label>
                  <input className="form-input" type="number" min="0" max="30" value={form.remindDaysBefore} onChange={(e) => setF('remindDaysBefore', e.target.value)} />
                </div>
              </div>

              {/* EMI-only fields */}
              {form.type === 'emi' && (
                <div className="modal-row">
                  <div className="form-group">
                    <label className="form-label">TOTAL INSTALLMENTS</label>
                    <input className="form-input" type="number" min="1" value={form.totalInstallments} onChange={(e) => setF('totalInstallments', e.target.value)} placeholder="e.g. 36" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DAY OF MONTH (for monthly)</label>
                    <input className="form-input" type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setF('dueDay', e.target.value)} placeholder="e.g. 1" />
                  </div>
                </div>
              )}

              {/* Icon picker */}
              <div className="form-group">
                <label className="form-label">ICON</label>
                <div className="icon-picker">
                  {PRESET_ICONS.map((ic) => (
                    <button type="button" key={ic} className={`icon-btn${form.icon === ic ? ' icon-btn--active' : ''}`} onClick={() => setF('icon', ic)}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div className="form-group">
                <label className="form-label">COLOR</label>
                <div className="color-picker">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`color-swatch${form.color === c ? ' color-swatch--active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setF('color', c)}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">NOTES (OPTIONAL)</label>
                <textarea className="form-input form-textarea" value={form.notes} onChange={(e) => setF('notes', e.target.value)} placeholder="Account number, provider notes…" rows={2} />
              </div>

              {formError && <div className="modal-error">⚠ {formError}</div>}

              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : editBill ? 'Update' : 'Add Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="confirm-dialog">
            <p className="confirm-title">Delete "{deleteTarget.name}"?</p>
            <p className="confirm-text">All payment history for this bill will be permanently removed.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
