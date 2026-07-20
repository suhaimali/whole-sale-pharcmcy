const Expense = require('../models/Expense');
const CashTx = require('../models/CashTx');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  if (isDbConnected()) {
    try {
      const expenses = await Expense.find({}).sort({ expenseDate: -1 });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const sorted = [...localExpenses].sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
    res.json(sorted);
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { title, amount, category, expenseDate } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ message: 'Title and amount are required' });
  }

  if (isDbConnected()) {
    try {
      const expense = await Expense.create({
        title,
        amount: Number(amount),
        category: category || 'Miscellaneous',
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        recordedBy: req.user.username,
      });

      // Create Cash Book Outflow record
      await CashTx.create({
        txType: 'Cash Out',
        amount: Number(amount),
        source: 'Expense',
        referenceNumber: `EXP-${expense._id.toString().substring(expense._id.toString().length - 4).toUpperCase()}`,
        notes: `Expense: ${title} (${category})`,
        recordedBy: req.user.username,
      });

      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const newExpense = {
      _id: 'mock-exp-' + Math.random().toString(36).substr(2, 9),
      title,
      amount: Number(amount),
      category: category || 'Miscellaneous',
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      recordedBy: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localExpenses.push(newExpense);

    // Save to local cash ledger
    localCashTxs.push({
      _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
      txType: 'Cash Out',
      amount: Number(newExpense.amount),
      source: 'Expense',
      referenceNumber: `EXP-${newExpense._id.substring(newExpense._id.length - 4).toUpperCase()}`,
      notes: `Expense: ${newExpense.title} (${newExpense.category})`,
      recordedBy: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json(newExpense);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin, Administrator)
const deleteExpense = async (req, res) => {
  if (isDbConnected()) {
    try {
      const expense = await Expense.findById(req.params.id);
      if (expense) {
        await Expense.findByIdAndDelete(req.params.id);
        
        // Remove associated cash transactions if any
        const refNum = `EXP-${req.params.id.substring(req.params.id.length - 4).toUpperCase()}`;
        await CashTx.deleteMany({ referenceNumber: refNum });

        res.json({ message: 'Expense removed' });
      } else {
        res.status(404).json({ message: 'Expense not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localExpenses.findIndex((e) => e._id === req.params.id);
    if (index !== -1) {
      const expId = localExpenses[index]._id;
      localExpenses.splice(index, 1);

      // Clean fallback cash transactions
      const refNum = `EXP-${expId.substring(expId.length - 4).toUpperCase()}`;
      const cashIndex = localCashTxs.findIndex((tx) => tx.referenceNumber === refNum);
      if (cashIndex !== -1) {
        localCashTxs.splice(cashIndex, 1);
      }

      res.json({ message: 'Expense removed' });
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
