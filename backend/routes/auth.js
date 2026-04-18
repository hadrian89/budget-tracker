const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const Bill = require('../models/Bill');

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create new user
      const user = new User({ name, email, password });
      await user.save();

      const token = generateToken(user._id.toString());

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          settings: user.settings,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = generateToken(user._id.toString());

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          settings: user.settings,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        settings: req.user.settings,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── OAuth helpers ─────────────────────────────────────────────────────────────

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const options = { headers };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function findOrCreateGoogleUser({ googleId, email, name }) {
  let user = await User.findOne({ googleId });
  if (user) return user;

  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      await user.save();
      return user;
    }
  }

  const newUser = new User({
    name: name || 'User',
    email: email || `google_${googleId}@noemail.walleto`,
    googleId,
  });
  await newUser.save();
  return newUser;
}

// @route   POST /api/auth/google
// @desc    Verify Google access token, sign in / register
// @access  Public
router.post('/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token required' });
  console.log("Received Google access token:", accessToken) // Debug log
  try {
    const { status, body } = await httpsGet(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { Authorization: `Bearer ${accessToken}` }
    );
    console.log("body",body)
    if (status !== 200) return res.status(401).json({ message: 'Invalid Google access token' });
    
    const { sub: googleId, email, name } = body;
    if (!googleId) return res.status(401).json({ message: 'Could not retrieve Google profile' });

    const user = await findOrCreateGoogleUser({ googleId, email, name });
    const token = generateToken(user._id.toString());

    res.json({
      message: 'Google login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt, settings: user.settings },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update name and/or email
// @access  Private
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email } = req.body;
    try {
      const user = req.user;

      if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });
        user.email = email;
      }
      if (name) user.name = name;

      await user.save();
      res.json({
        message: 'Profile updated',
        user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt, settings: user.settings },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user._id);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/auth/settings
// @desc    Update app preferences (currency, dateFormat, theme)
// @access  Private
router.put('/settings', auth, async (req, res) => {
  const allowed = ['currency', 'dateFormat', 'theme', 'gbpToInr'];
  try {
    const user = req.user;
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) user.settings[key] = req.body[key];
    });
    await user.save();
    res.json({
      message: 'Settings updated',
      settings: user.settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/quick-add
router.get('/quick-add', auth, async (req, res) => {
  try {
    res.json({ presets: req.user.quickAdd || [] });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/quick-add
router.post('/quick-add', auth, async (req, res) => {
  try {
    const { label, icon, type, amount, category, subcategory, account, notes } = req.body;
    if (!label) return res.status(400).json({ message: 'Label is required' });
    req.user.quickAdd.push({
      label, icon: icon || '📦', type: type || 'Expense',
      amount: amount ? parseFloat(amount) : null,
      category: category || '', subcategory: subcategory || '',
      account: account || '', notes: notes || '',
    });
    await req.user.save();
    res.json({ presets: req.user.quickAdd });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/quick-add/:id
router.put('/quick-add/:id', auth, async (req, res) => {
  try {
    const preset = req.user.quickAdd.id(req.params.id);
    if (!preset) return res.status(404).json({ message: 'Preset not found' });
    const { label, icon, type, amount, category, subcategory, account, notes } = req.body;
    if (label !== undefined) preset.label = label;
    if (icon !== undefined) preset.icon = icon;
    if (type !== undefined) preset.type = type;
    if (amount !== undefined) preset.amount = amount ? parseFloat(amount) : null;
    if (category !== undefined) preset.category = category;
    if (subcategory !== undefined) preset.subcategory = subcategory;
    if (account !== undefined) preset.account = account;
    if (notes !== undefined) preset.notes = notes;
    await req.user.save();
    res.json({ presets: req.user.quickAdd });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/quick-add/:id
router.delete('/quick-add/:id', auth, async (req, res) => {
  try {
    req.user.quickAdd = req.user.quickAdd.filter((p) => p._id.toString() !== req.params.id);
    await req.user.save();
    res.json({ presets: req.user.quickAdd });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/account
// @desc    Permanently delete account and all user data
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all user data across collections
    await Promise.all([
      Transaction.deleteMany({ userId }).catch(() => {}),
      Account.deleteMany({ userId }).catch(() => {}),
      Category.deleteMany({ userId }).catch(() => {}),
      Bill.deleteMany({ userId }).catch(() => {}),
    ]);

    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
