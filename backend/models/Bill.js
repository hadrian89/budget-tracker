const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GBP' },
    category: { type: String, default: 'Bills' },
    icon: { type: String, default: '📄' },
    color: { type: String, default: '#5b5b5f' },
    notes: { type: String, maxlength: 500 },

    // Type: regular bill, loan EMI, or recurring subscription
    type: {
      type: String,
      enum: ['bill', 'emi', 'subscription'],
      default: 'bill',
    },

    // How often it recurs
    frequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly', 'one-time'],
      default: 'monthly',
    },

    // Day of month for monthly bills (1-31)
    dueDay: { type: Number, min: 1, max: 31 },

    // Next due date — updated each time a payment is recorded
    nextDueDate: { type: Date, required: true },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }, // optional: when the bill ends (EMIs, fixed-term)

    // EMI tracking
    totalInstallments: { type: Number, min: 1 },
    paidInstallments: { type: Number, default: 0, min: 0 },

    // How many days before due date to flag as "due soon"
    remindDaysBefore: { type: Number, default: 3, min: 0 },

    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'paused'],
      default: 'active',
    },

    // Log of payments made
    payments: [
      {
        paidAt: { type: Date, default: Date.now },
        amount: Number,
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, nextDueDate: 1 });
billSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Bill', billSchema);
