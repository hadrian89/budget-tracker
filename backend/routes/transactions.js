const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics for authenticated user
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Transaction.aggregate([
      { $match: { userid: userId } },
      {
        $group: {
          _id: '$Type',
          total: { $sum: '$Amount_GBP' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalCount = 0;

    stats.forEach((stat) => {
      totalCount += stat.count;
      if (stat._id === 'INCOME') {
        totalIncome = Math.abs(stat.total);
      } else if (stat._id === 'EXPENSE') {
        totalExpense = Math.abs(stat.total);
      }
    });

    const balance = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      balance,
      count: totalCount,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// @route   GET /api/transactions
// @desc    Get all transactions with optional filters and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sort = '-Date',
    } = req.query;

    const filter = { userid: userId };

    if (type && type !== 'all') {
      filter.Type = type.toUpperCase();
    }

    if (category && category !== 'all') {
      filter.Category = { $regex: category, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.Date = {};
      if (startDate) filter.Date.$gte = startDate;
      if (endDate) filter.Date.$lte = endDate;
    }

    if (search) {
      filter.$or = [
        { Category: { $regex: search, $options: 'i' } },
        { Subcategory: { $regex: search, $options: 'i' } },
        { Account: { $regex: search, $options: 'i' } },
        { Notes: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post(
  '/',
  [
    body('Date').notEmpty().withMessage('Date is required'),
    body('Type')
      .notEmpty()
      .isIn(['EXPENSE', 'INCOME', 'TRANSFER'])
      .withMessage('Type must be EXPENSE, INCOME, or TRANSFER'),
    body('Account').notEmpty().withMessage('Account is required'),
    body('Amount').isNumeric().withMessage('Amount must be a number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const userId = req.userId;
      const { Date: txDate, Type, Account, Currency, Amount, Category, Subcategory, Notes } = req.body;

      const amountNum = parseFloat(Amount);
      const amount_gbp = Currency === 'GBP' ? amountNum : amountNum;

      const transaction = new Transaction({
        Date: txDate,
        Type: Type.toUpperCase(),
        Account,
        Currency: Currency || 'GBP',
        Amount: amountNum,
        Amount_GBP: amount_gbp,
        Category: Category || 'Uncategorized',
        Subcategory: Subcategory || '',
        Notes: Notes || '',
        userid: userId,
      });

      await transaction.save();

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ message: 'Server error creating transaction' });
    }
  }
);

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, userid: userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or access denied' });
    }

    const { Date: txDate, Type, Account, Currency, Amount, Category, Subcategory, Notes } = req.body;

    if (txDate !== undefined) transaction.Date = txDate;
    if (Type !== undefined) transaction.Type = Type.toUpperCase();
    if (Account !== undefined) transaction.Account = Account;
    if (Currency !== undefined) transaction.Currency = Currency;
    if (Amount !== undefined) {
      transaction.Amount = parseFloat(Amount);
      transaction.Amount_GBP = parseFloat(Amount);
    }
    if (Category !== undefined) transaction.Category = Category;
    if (Subcategory !== undefined) transaction.Subcategory = Subcategory;
    if (Notes !== undefined) transaction.Notes = Notes;

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error updating transaction' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({ _id: id, userid: userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or access denied' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
});

module.exports = router;
