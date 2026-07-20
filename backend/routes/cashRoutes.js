const express = require('express');
const router = express.Router();
const { getCashTransactions, createCashTransaction, deleteCashTransaction } = require('../controllers/cashController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getCashTransactions)
  .post(protect, createCashTransaction);

router
  .route('/:id')
  .delete(protect, authorize('Administrator', 'Admin'), deleteCashTransaction);

module.exports = router;
