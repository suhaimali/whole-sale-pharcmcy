const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Salaries', 'Electricity', 'Internet', 'Marketing', 'Maintenance', 'Miscellaneous'],
    default: 'Miscellaneous',
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  recordedBy: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
