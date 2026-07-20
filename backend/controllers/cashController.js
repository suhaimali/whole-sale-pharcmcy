const CashTx = require('../models/CashTx');

// @desc    Get all cash transactions and calculate cash in hand balance
// @route   GET /api/cash
// @access  Private
const getCashTransactions = async (req, res) => {
  if (isDbConnected()) {
    try {
      const txs = await CashTx.find({}).sort({ createdAt: -1 });
      
      // Calculate balance
      let balance = 0;
      txs.forEach((tx) => {
        if (tx.txType === 'Cash In') {
          balance += tx.amount;
        } else {
          balance -= tx.amount;
        }
      });

      res.json({ transactions: txs, balance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const sorted = [...localCashTxs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let balance = 0;
    sorted.forEach((tx) => {
      if (tx.txType === 'Cash In') {
        balance += tx.amount;
      } else {
        balance -= tx.amount;
      }
    });

    res.json({ transactions: sorted, balance });
  }
};

// @desc    Create a manual cash transaction (Deposit or Withdrawal)
// @route   POST /api/cash
// @access  Private
const createCashTransaction = async (req, res) => {
  const { txType, amount, source, referenceNumber, notes } = req.body;

  if (!txType || !amount || !source) {
    return res.status(400).json({ message: 'Type, amount, and source are required' });
  }

  if (isDbConnected()) {
    try {
      const tx = await CashTx.create({
        txType,
        amount: Number(amount),
        source,
        referenceNumber: referenceNumber || '',
        notes: notes || '',
        recordedBy: req.user.username,
      });
      res.status(201).json(tx);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const newTx = {
      _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
      txType,
      amount: Number(amount),
      source,
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      recordedBy: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localCashTxs.push(newTx);
    res.status(201).json(newTx);
  }
};

// @desc    Delete a cash transaction record
// @route   DELETE /api/cash/:id
// @access  Private (Admin, Administrator)
const deleteCashTransaction = async (req, res) => {
  if (isDbConnected()) {
    try {
      const tx = await CashTx.findById(req.params.id);
      if (tx) {
        await CashTx.findByIdAndDelete(req.params.id);
        res.json({ message: 'Cash record deleted successfully' });
      } else {
        res.status(404).json({ message: 'Cash record not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localCashTxs.findIndex((tx) => tx._id === req.params.id);
    if (index !== -1) {
      localCashTxs.splice(index, 1);
      res.json({ message: 'Cash record deleted successfully' });
    } else {
      res.status(404).json({ message: 'Cash record not found' });
    }
  }
};

module.exports = {
  getCashTransactions,
  createCashTransaction,
  deleteCashTransaction,
};
