const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');

router.use(auth);

// ── Helpers ────────────────────────────────────────────────────────────────

function computeNextDueDate(fromDate, frequency, dueDay) {
  const d = new Date(fromDate);
  switch (frequency) {
    case 'weekly':      d.setDate(d.getDate() + 7); break;
    case 'fortnightly': d.setDate(d.getDate() + 14); break;
    case 'monthly': {
      d.setMonth(d.getMonth() + 1);
      if (dueDay) {
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(dueDay, lastDay));
      }
      break;
    }
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
    case 'one-time':  return null;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function buildSummary(bills) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  let totalMonthly = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let paidThisMonth = 0;

  for (const b of bills) {
    if (b.status !== 'active') continue;
    const due = new Date(b.nextDueDate);
    due.setHours(0, 0, 0, 0);
    const remind = new Date(today);
    remind.setDate(remind.getDate() + (b.remindDaysBefore || 3));

    if (due < today) overdueCount++;
    else if (due <= remind) dueSoonCount++;

    // Normalise to monthly equivalent
    switch (b.frequency) {
      case 'weekly':      totalMonthly += b.amount * 52 / 12; break;
      case 'fortnightly': totalMonthly += b.amount * 26 / 12; break;
      case 'monthly':     totalMonthly += b.amount; break;
      case 'quarterly':   totalMonthly += b.amount / 3; break;
      case 'yearly':      totalMonthly += b.amount / 12; break;
      default: break;
    }

    // Count payments made this calendar month
    paidThisMonth += (b.payments || []).filter((p) => {
      const pd = new Date(p.paidAt);
      return pd >= monthStart && pd <= monthEnd;
    }).length;
  }

  return { totalMonthly, overdueCount, dueSoonCount, paidThisMonth };
}

// ── GET /api/bills — all bills for user ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.userId })
      .sort({ nextDueDate: 1 })
      .lean();

    res.json({ bills, summary: buildSummary(bills) });
  } catch (err) {
    console.error('Get bills error:', err);
    res.status(500).json({ message: 'Server error fetching bills' });
  }
});

// ── POST /api/bills — create bill ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      name, amount, currency, category, icon, color, notes,
      type, frequency, dueDay, nextDueDate, startDate, endDate,
      totalInstallments, remindDaysBefore,
    } = req.body;

    if (!name)         return res.status(400).json({ message: 'Name is required' });
    if (!amount)       return res.status(400).json({ message: 'Amount is required' });
    if (!nextDueDate)  return res.status(400).json({ message: 'Next due date is required' });

    const bill = new Bill({
      userId: req.userId,
      name: name.trim(),
      amount: parseFloat(amount),
      currency: currency || 'GBP',
      category: category || 'Bills',
      icon: icon || '📄',
      color: color || '#5b5b5f',
      notes,
      type: type || 'bill',
      frequency: frequency || 'monthly',
      dueDay: dueDay ? parseInt(dueDay) : undefined,
      nextDueDate: new Date(nextDueDate),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      totalInstallments: totalInstallments ? parseInt(totalInstallments) : undefined,
      remindDaysBefore: remindDaysBefore !== undefined ? parseInt(remindDaysBefore) : 3,
    });

    await bill.save();
    res.status(201).json({ message: 'Bill created', bill });
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ message: 'Server error creating bill' });
  }
});

// ── PUT /api/bills/:id — update bill ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const fields = [
      'name', 'amount', 'currency', 'category', 'icon', 'color', 'notes',
      'type', 'frequency', 'dueDay', 'nextDueDate', 'startDate', 'endDate',
      'totalInstallments', 'remindDaysBefore', 'status',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (['amount', 'dueDay', 'totalInstallments', 'remindDaysBefore'].includes(f)) {
          bill[f] = parseFloat(req.body[f]);
        } else if (['nextDueDate', 'startDate', 'endDate'].includes(f)) {
          bill[f] = new Date(req.body[f]);
        } else {
          bill[f] = req.body[f];
        }
      }
    }

    await bill.save();
    res.json({ message: 'Bill updated', bill });
  } catch (err) {
    console.error('Update bill error:', err);
    res.status(500).json({ message: 'Server error updating bill' });
  }
});

// ── DELETE /api/bills/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    console.error('Delete bill error:', err);
    res.status(500).json({ message: 'Server error deleting bill' });
  }
});

// ── POST /api/bills/:id/pay — record a payment ───────────────────────────
router.post('/:id/pay', async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const payAmount = parseFloat(req.body.amount) || bill.amount;
    const payNotes  = req.body.notes || '';

    // Record payment
    bill.payments.push({ paidAt: new Date(), amount: payAmount, notes: payNotes });

    // Advance nextDueDate
    if (bill.frequency === 'one-time') {
      bill.status = 'completed';
    } else {
      const next = computeNextDueDate(bill.nextDueDate, bill.frequency, bill.dueDay);
      if (next) bill.nextDueDate = next;
    }

    // EMI tracking
    if (bill.type === 'emi') {
      bill.paidInstallments = (bill.paidInstallments || 0) + 1;
      if (bill.totalInstallments && bill.paidInstallments >= bill.totalInstallments) {
        bill.status = 'completed';
      }
    }

    await bill.save();
    res.json({ message: 'Payment recorded', bill });
  } catch (err) {
    console.error('Pay bill error:', err);
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

module.exports = router;
