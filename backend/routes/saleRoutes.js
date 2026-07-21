const express = require('express');
const router = express.Router();
const { getSales, createSale, collectPayment, deleteSale } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getSales)
  .post(protect, authorize('Admin', 'Administrator', 'Sales Staff'), createSale);

router
  .route('/:id')
  .delete(protect, authorize('Admin', 'Administrator', 'Sales Staff'), deleteSale);

router
  .route('/:id/pay')
  .put(protect, collectPayment);

module.exports = router;
