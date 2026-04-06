const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

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

// @route   GET /api/dashboard/home
// @desc    Home dashboard: totalBalance, cashflow, categories, accounts, recent
// @access  Private
router.get('/home', async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const monthStr = toMonthStr(now);
    const startOfMonth = `${monthStr}-01`;
    const [_y, _m] = monthStr.split('-').map(Number);
    const endOfMonth = `${monthStr}-${String(new Date(_y, _m, 0).getDate()).padStart(2, '0')}`;

    // Accounts
    const accounts = await Account.find({ userid: userId }).lean();
    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // Monthly income/expense
    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: startOfMonth, $lte: endOfMonth },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: '$Type',
          total: { $sum: '$Amount_GBP' },
        },
      },
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
      {
        $match: {
          userid: userId,
          Date: { $gte: startOfMonth, $lte: endOfMonth },
          Type: 'EXPENSE',
        },
      },
      {
        $group: {
          _id: '$Category',
          total: { $sum: { $abs: '$Amount_GBP' } },
          count: { $sum: 1 },
        },
      },
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
      const dateStr = d.toISOString().slice(0, 10);
      sparkline.push({ date: dateStr, value: 0 });
    }
    const sparkDates = sparkline.map(s => s.date);
    const sparkAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: sparkDates[0], $lte: sparkDates[sparkDates.length - 1] },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: { date: { $substr: ['$Date', 0, 10] }, type: '$Type' },
          total: { $sum: '$Amount_GBP' },
        },
      },
    ]);
    sparkAgg.forEach(s => {
      const entry = sparkline.find(x => x.date === s._id.date);
      if (entry) {
        if (s._id.type === 'INCOME') entry.value += Math.abs(s.total);
        else if (s._id.type === 'EXPENSE') entry.value -= Math.abs(s.total);
      }
    });

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyNet,
      accounts,
      cashflowCategories,
      recentTransactions,
      sparkline,
      monthLabel: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
    });
  } catch (error) {
    console.error('Home dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching home data' });
  }
});

// @route   GET /api/dashboard/analytics?month=YYYY-MM
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.userId;
    const monthParam = req.query.month || toMonthStr(new Date());
    const [year, month] = monthParam.split('-').map(Number);

    const startDate = `${monthParam}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    // Previous month
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = toMonthStr(prevDate);
    const prevLastDay = new Date(year, month - 1, 0).getDate();
    const prevStartDate = `${prevMonthStr}-01`;
    const prevEndDate = `${prevMonthStr}-${String(prevLastDay).padStart(2, '0')}`;

    // Daily transactions for current month
    const dailyAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: startDate, $lte: endDate },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: { date: { $substr: ['$Date', 0, 10] }, type: '$Type' },
          total: { $sum: { $abs: '$Amount_GBP' } },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Build daily series
    const dailyMap = {};
    dailyAgg.forEach(d => {
      const key = d._id.date;
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 };
      if (d._id.type === 'INCOME') dailyMap[key].income = d.total;
      else dailyMap[key].expense = d.total;
    });

    const dailySeries = [];
    let cumIncome = 0;
    let cumExpense = 0;
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${monthParam}-${String(day).padStart(2, '0')}`;
      const dayData = dailyMap[dateStr] || { income: 0, expense: 0 };
      cumIncome += dayData.income;
      cumExpense += dayData.expense;
      dailySeries.push({
        date: dateStr,
        day,
        income: dayData.income,
        expense: dayData.expense,
        cumIncome,
        cumExpense,
      });
    }

    // Cashflow for current month
    const cashflowAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: startDate, $lte: endDate },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      { $group: { _id: '$Type', total: { $sum: { $abs: '$Amount_GBP' } } } },
    ]);
    let cfIncome = 0;
    let cfExpense = 0;
    cashflowAgg.forEach(g => {
      if (g._id === 'INCOME') cfIncome = g.total;
      else if (g._id === 'EXPENSE') cfExpense = g.total;
    });
    const cashflow = { income: cfIncome, expense: cfExpense, net: cfIncome - cfExpense };

    // Averages
    const daysInMonth = lastDay;
    const weeksInMonth = daysInMonth / 7;
    const averages = {
      dayIncome: cfIncome / daysInMonth,
      dayExpense: cfExpense / daysInMonth,
      weekIncome: cfIncome / weeksInMonth,
      weekExpense: cfExpense / weeksInMonth,
      monthIncome: cfIncome,
      monthExpense: cfExpense,
    };

    // Previous month cashflow
    const prevAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: prevStartDate, $lte: prevEndDate },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      { $group: { _id: '$Type', total: { $sum: { $abs: '$Amount_GBP' } } } },
    ]);
    let prevIncome = 0;
    let prevExpense = 0;
    prevAgg.forEach(g => {
      if (g._id === 'INCOME') prevIncome = g.total;
      else if (g._id === 'EXPENSE') prevExpense = g.total;
    });

    const diffIncome = cfIncome - prevIncome;
    const diffExpense = cfExpense - prevExpense;
    const pctIncome = prevIncome > 0 ? ((diffIncome / prevIncome) * 100).toFixed(1) : '0.0';
    const pctExpense = prevExpense > 0 ? ((diffExpense / prevExpense) * 100).toFixed(1) : '0.0';

    const compare = {
      prevMonth: `${MONTH_NAMES[prevDate.getMonth()]} ${prevDate.getFullYear()}`,
      prevIncome,
      prevExpense,
      diffIncome,
      diffExpense,
      pctIncome,
      pctExpense,
    };

    res.json({ dailySeries, cashflow, averages, compare, monthLabel: `${MONTH_NAMES[month - 1]} ${year}` });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/dashboard/categories?month=YYYY-MM
// @access  Private
router.get('/categories', async (req, res) => {
  try {
    const userId = req.userId;
    const monthParam = req.query.month || toMonthStr(new Date());
    const [year, month] = monthParam.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${monthParam}-01`;
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    const expCats = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: startDate, $lte: endDate },
          Type: 'EXPENSE',
        },
      },
      { $group: { _id: '$Category', total: { $sum: { $abs: '$Amount_GBP' } }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const incomeAgg = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: startDate, $lte: endDate },
          Type: 'INCOME',
        },
      },
      { $group: { _id: null, total: { $sum: { $abs: '$Amount_GBP' } } } },
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

// @route   GET /api/dashboard/monthly — kept for backward compat
router.get('/monthly', async (req, res) => {
  try {
    const userId = req.userId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

    const rawData = await Transaction.aggregate([
      {
        $match: {
          userid: userId,
          Date: { $gte: sixMonthsAgoStr },
          Type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      { $addFields: { monthYear: { $substr: ['$Date', 0, 7] } } },
      { $group: { _id: { month: '$monthYear', type: '$Type' }, total: { $sum: '$Amount_GBP' } } },
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
