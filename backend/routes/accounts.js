const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/accounts — get all accounts for user
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userid: req.userId }).sort({ createdAt: 1 }).lean();
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error fetching accounts' });
  }
});

// POST /api/accounts — create account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Account name is required' });

    const iconMap = { bank: '🏦', cash: '💵', card: '💳', investment: '📈' };
    const account = new Account({
      name,
      type: type || 'bank',
      balance: parseFloat(balance) || 0,
      currency: currency || 'GBP',
      color: color || '#6366f1',
      icon: icon || iconMap[type] || '🏦',
      userid: req.userId,
    });
    await account.save();
    res.status(201).json({ message: 'Account created', account });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error creating account' });
  }
});

// PUT /api/accounts/:id — update account
router.put('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userid: req.userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const { name, type, balance, currency, color, icon } = req.body;
    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (balance !== undefined) account.balance = parseFloat(balance);
    if (currency !== undefined) account.currency = currency;
    if (color !== undefined) account.color = color;
    if (icon !== undefined) account.icon = icon;

    await account.save();
    res.json({ message: 'Account updated', account });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error updating account' });
  }
});

// PUT /api/accounts/:id/set-primary — mark one account as primary, clear others
router.put('/:id/set-primary', async (req, res) => {
  try {
    await Account.updateMany({ userid: req.userId }, { isPrimary: false });
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userid: req.userId },
      { isPrimary: true },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Primary account updated', account });
  } catch (error) {
    console.error('Set primary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/accounts/:id — delete account
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userid: req.userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;
