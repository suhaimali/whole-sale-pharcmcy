const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router
  .route('/:id')
  .put(protect, authorize('Administrator', 'Admin'), updateExpense)
  .delete(protect, authorize('Administrator', 'Admin'), deleteExpense);

module.exports = router;
