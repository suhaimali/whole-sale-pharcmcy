const express = require('express');
const router = express.Router();
const { getCashTransactions, createCashTransaction, updateCashTransaction, deleteCashTransaction } = require('../controllers/cashController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getCashTransactions)
  .post(protect, createCashTransaction);

router
  .route('/:id')
  .put(protect, authorize('Administrator', 'Admin'), updateCashTransaction)
  .delete(protect, authorize('Administrator', 'Admin'), deleteCashTransaction);

module.exports = router;
