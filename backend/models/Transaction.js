const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    Date: {
      type: String,
      required: [true, 'Date is required'],
    },
    Type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['EXPENSE', 'INCOME', 'TRANSFER'],
      uppercase: true,
    },
    Account: {
      type: String,
      required: [true, 'Account is required'],
      trim: true,
    },
    Currency: {
      type: String,
      default: 'GBP',
      trim: true,
      uppercase: true,
    },
    Amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    Amount_GBP: {
      type: Number,
      required: [true, 'Amount_GBP is required'],
    },
    Category: {
      type: String,
      trim: true,
      default: 'Uncategorized',
    },
    Subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    Notes: {
      type: String,
      trim: true,
      default: '',
    },
    ToAccount: {
      type: String,
      trim: true,
      default: '',
    },
    userid: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  {
    collection: 'budget_tracker_transactions',
    timestamps: false,
  }
);

// Index for common queries
transactionSchema.index({ userid: 1, Date: -1 });
transactionSchema.index({ userid: 1, Type: 1 });
transactionSchema.index({ userid: 1, Category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
