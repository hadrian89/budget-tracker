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
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
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
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
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

async function findOrCreateOAuthUser({ provider, providerId, email, name }) {
  // 1. Look up by provider ID
  const query = provider === 'google' ? { googleId: providerId } : { facebookId: providerId };
  let user = await User.findOne(query);
  if (user) return user;

  // 2. Link to existing email account
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      if (provider === 'google')   user.googleId   = providerId;
      if (provider === 'facebook') user.facebookId = providerId;
      await user.save();
      return user;
    }
  }

  // 3. Create new OAuth user (no password)
  const newUser = new User({
    name: name || 'User',
    email: email || `${provider}_${providerId}@noemail.walleto`,
    googleId:   provider === 'google'   ? providerId : undefined,
    facebookId: provider === 'facebook' ? providerId : undefined,
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

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return res.status(401).json({ message: 'Invalid Google access token' });

    const { sub: googleId, email, name } = await response.json();
    if (!googleId) return res.status(401).json({ message: 'Could not retrieve Google profile' });

    const user = await findOrCreateOAuthUser({ provider: 'google', providerId: googleId, email, name });
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

// @route   POST /api/auth/facebook
// @desc    Verify Facebook access token, sign in / register
// @access  Public
router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token required' });

  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!response.ok) return res.status(401).json({ message: 'Invalid Facebook access token' });

    const data = await response.json();
    if (data.error) return res.status(401).json({ message: data.error.message || 'Facebook token invalid' });

    const { id: facebookId, name, email } = data;
    const user = await findOrCreateOAuthUser({ provider: 'facebook', providerId: facebookId, email, name });
    const token = generateToken(user._id.toString());

    res.json({
      message: 'Facebook login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt, settings: user.settings },
    });
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ message: 'Facebook login failed' });
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
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
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
