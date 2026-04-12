const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['bank', 'cash', 'card', 'investment'],
      default: 'bank',
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'GBP',
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '🏦',
    },
    userid: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'budget_tracker_accounts',
  }
);

accountSchema.index({ userid: 1 });

module.exports = mongoose.model('Account', accountSchema);
