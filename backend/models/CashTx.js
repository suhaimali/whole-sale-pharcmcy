const mongoose = require('mongoose');

const cashTxSchema = new mongoose.Schema({
  txType: {
    type: String,
    required: true,
    enum: ['Cash In', 'Cash Out'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  source: {
    type: String,
    required: true,
    enum: ['Sale', 'Purchase', 'Expense', 'Deposit', 'Withdrawal'],
  },
  referenceNumber: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  recordedBy: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('CashTx', cashTxSchema);
