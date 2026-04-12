const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
  },
  googleId:   { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  settings: {
    currency:   { type: String,  default: 'GBP' },
    dateFormat: { type: String,  default: 'en-GB' },
    theme:      { type: String,  default: 'light' },
    gbpToInr:   { type: Number,  default: 125.25 },
  },
  lastActivity: {
    lastVisit:  { type: Date },
    lastUpdate: { type: Date },
    lastDevice: { type: String, default: '' },
  },
  quickAdd: [{
    label:       { type: String, required: true },
    icon:        { type: String, default: '📦' },
    type:        { type: String, default: 'Expense' },
    amount:      { type: Number, default: null },
    category:    { type: String, default: '' },
    subcategory: { type: String, default: '' },
    account:     { type: String, default: '' },
    notes:       { type: String, default: '' },
  }],
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
