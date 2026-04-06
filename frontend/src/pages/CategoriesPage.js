import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../api/axios';
import MonthPicker from '../components/MonthPicker';
import './CategoriesPage.css';

const toMonthStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const fmt = (v) =>
  `£${Math.abs(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRESET_COLORS = [
  '#5b5b5f', '#008080', '#b60051', '#747778', '#595c5d',
  '#4f4f53', '#abadae', '#dfe3e4', '#2c2f30', '#e5e9ea',
  '#eef1f2', '#d9dddf',
];

const PRESET_ICONS = ['🍔','🛍️','🚗','🎉','🚌','📄','🏠','💊','💰','📦','✈️','🎓','💻','🏋️','🎮','🐾'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="cat-tooltip">
      <span className="cat-tooltip-icon">{p.icon}</span>
      <span className="cat-tooltip-name">{name}</span>
      <span className="cat-tooltip-val">{fmt(value)}</span>
    </div>
  );
};

export default function CategoriesPage() {
  const [month, setMonth] = useState(new Date());
  const [catData, setCatData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  const [manageOpen, setManageOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#5b5b5f', icon: '📦', subcategories: [] });
  const [newSub, setNewSub] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const ms = toMonthStr(month);
      const [analyticsRes, txRes, catRes] = await Promise.all([
        axiosInstance.get(`/api/dashboard/analytics?month=${ms}`),
        axiosInstance.get(`/api/transactions?startDate=${ms}-01&endDate=${ms}-31&type=EXPENSE&limit=1000`),
        axiosInstance.get('/api/categories'),
      ]);

      const { cashflow } = analyticsRes.data;
      setTotalExpense(cashflow?.expense || 0);
      setTotalIncome(cashflow?.income || 0);

      // Build lookup: category name → { icon, color }
      const managedMap = {};
      (catRes.data.categories || []).forEach((c) => {
        managedMap[c.name] = { icon: c.icon || '📦', color: c.color || null };
      });

      const txs = txRes.data.transactions || [];
      const map = {};
      txs.forEach((tx) => {
        const cat = tx.Category || 'Uncategorized';
        if (!map[cat]) {
          const mc = managedMap[cat] || {};
          map[cat] = { name: cat, amount: 0, count: 0, icon: mc.icon || '📦', color: mc.color || null };
        }
        map[cat].amount += Math.abs(tx.Amount_GBP || 0);
        map[cat].count += 1;
      });
      setCatData(Object.values(map).sort((a, b) => b.amount - a.amount));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await axiosInstance.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

  const resetForm = () => {
    setEditCat(null);
    setForm({ name: '', color: '#5b5b5f', icon: '📦', subcategories: [] });
    setNewSub('');
    setFormError('');
  };

  const openManage = () => {
    fetchCategories();
    setManageOpen(true);
    resetForm();
  };

  const startEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name, color: cat.color, icon: cat.icon, subcategories: [...(cat.subcategories || [])] });
    setFormError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Category name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editCat) {
        await axiosInstance.put(`/api/categories/${editCat._id}`, form);
      } else {
        await axiosInstance.post('/api/categories', form);
      }
      resetForm();
      fetchCategories();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axiosInstance.delete(`/api/categories/${id}`);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || 'Cannot delete.');
    }
  };

  const addSubcategory = () => {
    const s = newSub.trim();
    if (!s || form.subcategories.includes(s)) return;
    setForm((p) => ({ ...p, subcategories: [...p.subcategories, s] }));
    setNewSub('');
  };

  const removeSubcategory = (s) => {
    setForm((p) => ({ ...p, subcategories: p.subcategories.filter((x) => x !== s) }));
  };

  const enriched = catData.map((c, i) => ({
    ...c,
    color: c.color || PRESET_COLORS[i % PRESET_COLORS.length],
    icon: c.icon || '📦',
  }));

  const grandTotal = enriched.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="categories-page">
      <div className="cat-page-header">
        <div className="cat-page-header-left">
          <MonthPicker month={month} onChange={setMonth} showFilter />
        </div>
        <button className="btn btn-primary" onClick={openManage}>
          Manage Categories
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          {/* Donut chart */}
          <div className="cat-chart-card">
            {enriched.length === 0 ? (
              <div className="cat-empty">No expense data for this month.</div>
            ) : (
              <div className="cat-donut-wrap">
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={enriched}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={130}
                      dataKey="amount"
                      nameKey="name"
                      paddingAngle={2}
                    >
                      {enriched.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="cat-donut-center">
                  <span className="cat-donut-expense">{fmt(totalExpense)}</span>
                  <span className="cat-donut-income">{fmt(totalIncome)} income</span>
                </div>
              </div>
            )}
          </div>

          {/* Category list */}
          <div className="cat-list">
            {enriched.map((cat) => {
              const pct = grandTotal > 0 ? Math.round((cat.amount / grandTotal) * 100) : 0;
              return (
                <div className="cat-list-item" key={cat.name}>
                  <div className="cat-list-icon" style={{ background: cat.color + '1f' }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  </div>
                  <div className="cat-list-info">
                    <div className="cat-list-row">
                      <span className="cat-list-name">{cat.name}</span>
                      <span className="cat-list-amount">{fmt(cat.amount)}</span>
                    </div>
                    <div className="cat-list-bar-row">
                      <div className="cat-list-bar-bg">
                        <div
                          className="cat-list-bar-fill"
                          style={{ width: `${pct}%`, background: cat.color }}
                        />
                      </div>
                      <span className="cat-list-pct">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Manage modal */}
      {manageOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setManageOpen(false)}>
          <div className="cat-modal">
            <div className="cat-modal-header">
              <h2>Manage Categories</h2>
              <button className="modal-close-btn" onClick={() => { setManageOpen(false); resetForm(); }}>✕</button>
            </div>

            <div className="cat-form-section">
              <p className="cat-form-title">{editCat ? 'Edit Category' : 'Add Category'}</p>
              {formError && <div className="form-error">{formError}</div>}

              <div className="cat-form-row">
                <div className="form-group-sm">
                  <label className="form-label-sm">Icon</label>
                  <div className="icon-picker">
                    {PRESET_ICONS.map((ic) => (
                      <button
                        key={ic}
                        className={`icon-btn${form.icon === ic ? ' icon-btn--active' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, icon: ic }))}
                        type="button"
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cat-form-fields">
                  <div className="form-group-sm">
                    <label className="form-label-sm">Name</label>
                    <input
                      className="form-input-sm"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Category name"
                    />
                  </div>

                  <div className="form-group-sm">
                    <label className="form-label-sm">Color</label>
                    <div className="color-picker">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          className={`color-swatch${form.color === c ? ' color-swatch--active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setForm((p) => ({ ...p, color: c }))}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="form-group-sm">
                    <label className="form-label-sm">Subcategories</label>
                    <div className="subcats-list">
                      {form.subcategories.map((s) => (
                        <span key={s} className="subcat-chip">
                          {s}
                          <button onClick={() => removeSubcategory(s)} type="button">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="subcat-add-row">
                      <input
                        className="form-input-sm"
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        placeholder="Add subcategory..."
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubcategory())}
                      />
                      <button className="btn btn-ghost btn-sm" onClick={addSubcategory} type="button">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cat-form-actions">
                {editCat && (
                  <button className="btn btn-ghost" onClick={resetForm} type="button">Cancel</button>
                )}
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : (editCat ? 'Save Changes' : 'Add Category')}
                </button>
              </div>
            </div>

            <div className="cat-manage-list">
              <p className="cat-form-title">All Categories</p>
              {catLoading ? (
                <div className="loading-container"><div className="spinner" /></div>
              ) : (
                categories.map((cat) => (
                  <div key={cat._id} className="cat-manage-item">
                    <div className="cat-manage-icon" style={{ background: (cat.color || '#5b5b5f') + '1f' }}>
                      <span>{cat.icon}</span>
                    </div>
                    <div className="cat-manage-info">
                      <span className="cat-manage-name">{cat.name}</span>
                      {cat.subcategories?.length > 0 && (
                        <span className="cat-manage-subs">{cat.subcategories.join(', ')}</span>
                      )}
                    </div>
                    <div className="cat-manage-actions">
                      <button className="action-btn" onClick={() => startEdit(cat)} title="Edit">✏️</button>
                      {!cat.isDefault && (
                        <button className="action-btn action-btn--delete" onClick={() => handleDelete(cat._id)} title="Delete">🗑️</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
