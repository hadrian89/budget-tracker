const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { trackVisit } = require('../utils/activity');

router.use(auth);

// Helper: get YYYY-MM string for a Date
const toMonthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// Helper: format month display
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Category color map
const CATEGORY_COLORS = {
  'food and drinks': '#ef4444',
  'shopping': '#ec4899',
  'vehicle': '#8b5cf6',
  'leisure': '#f472b6',
  'transport': '#06b6d4',
  'bills': '#10b981',
  'housing': '#f59e0b',
  'health': '#3b82f6',
  'other': '#6366f1',
  'income': '#10b981',
};
const getCategoryColor = (name) => {
  if (!name) return '#6366f1';
  return CATEGORY_COLORS[name.toLowerCase()] || '#6366f1';
};

// Normalize Type to uppercase and Amount_GBP to number in every pipeline
const normStage = {
  $addFields: {
    _typeNorm: { $toUpper: '$Type' },
    _amount: { $toDouble: '$Amount_GBP' },
  },
};

// @route   GET /api/dashboard/home
router.get('/home', async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const monthStr = toMonthStr(now);
    const startOfMonth = `${monthStr}-01`;
    const [_y, _m] = monthStr.split('-').map(Number);
    const endOfMonth = `${monthStr}-${String(new Date(_y, _m, 0).getDate()).padStart(2, '0')}`;

    // Accounts — convert non-GBP balances to GBP using user's exchange rate
    const [accounts, userDoc] = await Promise.all([
      Account.find({ userid: userId }).lean(),
      User.findById(userId).lean(),
    ]);
    const gbpToInr = userDoc?.settings?.gbpToInr || 125.25;
    const toGBP = (acc) => {
      const bal = acc.balance || 0;
      if ((acc.currency || 'GBP').toUpperCase() === 'INR') return bal / gbpToInr;
      return bal;
    };
    const totalBalance = accounts.reduce((sum, a) => sum + toGBP(a), 0);

    // Monthly income/expense
    const monthlyAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startOfMonth, $lte: endOfMonth } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $group: { _id: '$_typeNorm', total: { $sum: '$_amount' } } },
    ]);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthlyAgg.forEach(g => {
      if (g._id === 'INCOME') monthlyIncome = Math.abs(g.total);
      else if (g._id === 'EXPENSE') monthlyExpense = Math.abs(g.total);
    });
    const monthlyNet = monthlyIncome - monthlyExpense;

    // Categories (expense) for current month
    const catAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startOfMonth, $lte: endOfMonth } } },
      normStage,
      { $match: { _typeNorm: 'EXPENSE' } },
      { $group: { _id: '$Category', total: { $sum: { $abs: '$_amount' } }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]);

    const cashflowCategories = catAgg.map(c => ({
      name: c._id || 'Uncategorized',
      amount: c.total,
      count: c.count,
      color: getCategoryColor(c._id),
    }));

    // Recent transactions
    const recentTransactions = await Transaction.find({ userid: userId })
      .sort({ Date: -1 })
      .limit(5)
      .lean();

    // Sparkline data (last 7 days net)
    const sparkline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      sparkline.push({ date: d.toISOString().slice(0, 10), value: 0 });
    }
    const sparkAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: sparkline[0].date, $lte: sparkline[6].date } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $group: { _id: { date: { $substr: ['$Date', 0, 10] }, type: '$_typeNorm' }, total: { $sum: '$_amount' } } },
    ]);
    sparkAgg.forEach(s => {
      const entry = sparkline.find(x => x.date === s._id.date);
      if (entry) {
        if (s._id.type === 'INCOME') entry.value += Math.abs(s.total);
        else if (s._id.type === 'EXPENSE') entry.value -= Math.abs(s.total);
      }
    });

    // Budget limits: categories with a monthlyLimit vs actual spend this month
    const allCats = await Category.find({
      $or: [{ userid: userId }, { isDefault: true }],
      monthlyLimit: { $ne: null },
    }).lean();

    const budgetStatus = allCats.map((cat) => {
      const spent = catAgg.find((c) => c._id === cat.name)?.total || 0;
      const limit = cat.monthlyLimit;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        name: cat.name,
        icon: cat.icon || '📦',
        color: cat.color || '#6366f1',
        limit,
        spent,
        pct,
        over: spent > limit,
      };
    }).sort((a, b) => b.pct - a.pct);

    // Return previous activity first, then update visit time in background
    const lastActivity = userDoc?.lastActivity || {};
    trackVisit(userId, req);

    res.json({
      totalBalance, monthlyIncome, monthlyExpense, monthlyNet,
      accounts, cashflowCategories, recentTransactions, sparkline,
      monthLabel: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
      gbpToInr,
      lastActivity,
      budgetStatus,
    });
  } catch (error) {
    console.error('Home dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching home data' });
  }
});

// @route   GET /api/dashboard/analytics?month=YYYY-MM
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.userId;
    const monthParam = req.query.month || toMonthStr(new Date());
    const [year, month] = monthParam.split('-').map(Number);

    const startDate = `${monthParam}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = toMonthStr(prevDate);
    const prevLastDay = new Date(year, month - 1, 0).getDate();
    const prevStartDate = `${prevMonthStr}-01`;
    const prevEndDate = `${prevMonthStr}-${String(prevLastDay).padStart(2, '0')}`;

    // Daily transactions
    const dailyAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startDate, $lte: endDate } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $group: { _id: { date: { $substr: ['$Date', 0, 10] }, type: '$_typeNorm' }, total: { $sum: { $abs: '$_amount' } } } },
      { $sort: { '_id.date': 1 } },
    ]);

    const dailyMap = {};
    dailyAgg.forEach(d => {
      const key = d._id.date;
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 };
      if (d._id.type === 'INCOME') dailyMap[key].income = d.total;
      else dailyMap[key].expense = d.total;
    });

    const dailySeries = [];
    let cumIncome = 0, cumExpense = 0;
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${monthParam}-${String(day).padStart(2, '0')}`;
      const dayData = dailyMap[dateStr] || { income: 0, expense: 0 };
      cumIncome += dayData.income;
      cumExpense += dayData.expense;
      dailySeries.push({ date: dateStr, day, income: dayData.income, expense: dayData.expense, cumIncome, cumExpense });
    }

    // Cashflow
    const cashflowAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startDate, $lte: endDate } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $group: { _id: '$_typeNorm', total: { $sum: { $abs: '$_amount' } } } },
    ]);
    let cfIncome = 0, cfExpense = 0;
    cashflowAgg.forEach(g => {
      if (g._id === 'INCOME') cfIncome = g.total;
      else if (g._id === 'EXPENSE') cfExpense = g.total;
    });
    const cashflow = { income: cfIncome, expense: cfExpense, net: cfIncome - cfExpense };

    // Averages
    const averages = {
      dayIncome: cfIncome / lastDay,
      dayExpense: cfExpense / lastDay,
      weekIncome: cfIncome / (lastDay / 7),
      weekExpense: cfExpense / (lastDay / 7),
      monthIncome: cfIncome,
      monthExpense: cfExpense,
    };

    // Previous month
    const prevAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: prevStartDate, $lte: prevEndDate } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $group: { _id: '$_typeNorm', total: { $sum: { $abs: '$_amount' } } } },
    ]);
    let prevIncome = 0, prevExpense = 0;
    prevAgg.forEach(g => {
      if (g._id === 'INCOME') prevIncome = g.total;
      else if (g._id === 'EXPENSE') prevExpense = g.total;
    });

    const diffIncome = cfIncome - prevIncome;
    const diffExpense = cfExpense - prevExpense;
    const compare = {
      prevMonth: `${MONTH_NAMES[prevDate.getMonth()]} ${prevDate.getFullYear()}`,
      prevIncome, prevExpense, diffIncome, diffExpense,
      pctIncome: prevIncome > 0 ? (diffIncome / prevIncome) * 100 : 0,
      pctExpense: prevExpense > 0 ? (diffExpense / prevExpense) * 100 : 0,
    };

    res.json({ dailySeries, cashflow, averages, compare, monthLabel: `${MONTH_NAMES[month - 1]} ${year}` });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/dashboard/categories?month=YYYY-MM
router.get('/categories', async (req, res) => {
  try {
    const userId = req.userId;
    const monthParam = req.query.month || toMonthStr(new Date());
    const [year, month] = monthParam.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${monthParam}-01`;
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    const expCats = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startDate, $lte: endDate } } },
      normStage,
      { $match: { _typeNorm: 'EXPENSE' } },
      { $group: { _id: '$Category', total: { $sum: { $abs: '$_amount' } }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const incomeAgg = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: startDate, $lte: endDate } } },
      normStage,
      { $match: { _typeNorm: 'INCOME' } },
      { $group: { _id: null, total: { $sum: { $abs: '$_amount' } } } },
    ]);

    const totalExpense = expCats.reduce((s, c) => s + c.total, 0);
    const totalIncome = incomeAgg[0]?.total || 0;

    const categories = expCats.map(c => ({
      name: c._id || 'Uncategorized',
      amount: c.total,
      count: c.count,
      color: getCategoryColor(c._id),
      pct: totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : '0.0',
    }));

    res.json({ categories, totalExpense, totalIncome, monthLabel: `${MONTH_NAMES[month - 1]} ${year}` });
  } catch (error) {
    console.error('Categories dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching category data' });
  }
});

// @route   GET /api/dashboard/monthly
router.get('/monthly', async (req, res) => {
  try {
    const userId = req.userId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

    const rawData = await Transaction.aggregate([
      { $match: { userid: userId, Date: { $gte: sixMonthsAgoStr } } },
      normStage,
      { $match: { _typeNorm: { $in: ['INCOME', 'EXPENSE'] } } },
      { $addFields: { monthYear: { $substr: ['$Date', 0, 7] } } },
      { $group: { _id: { month: '$monthYear', type: '$_typeNorm' }, total: { $sum: '$_amount' } } },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const mo = d.getMonth();
      const monthKey = `${year}-${String(mo + 1).padStart(2, '0')}`;
      months.push({ monthKey, name: `${MONTH_NAMES[mo]} ${year}`, shortName: MONTH_NAMES[mo], income: 0, expense: 0 });
    }

    rawData.forEach(item => {
      const monthEntry = months.find(m => m.monthKey === item._id.month);
      if (monthEntry) {
        if (item._id.type === 'INCOME') monthEntry.income = Math.abs(item.total);
        else if (item._id.type === 'EXPENSE') monthEntry.expense = Math.abs(item.total);
      }
    });

    res.json({ monthly: months });
  } catch (error) {
    console.error('Monthly dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching monthly data' });
  }
});

// @route   GET /api/dashboard/recent
router.get('/recent', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userid: req.userId }).sort({ Date: -1 }).limit(10).lean();
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching recent transactions' });
  }
});

module.exports = router;
