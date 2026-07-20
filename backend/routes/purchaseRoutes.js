const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, collectPayment } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getPurchases)
  .post(protect, authorize('Admin', 'Administrator', 'Purchase Staff'), createPurchase);

router
  .route('/:id/pay')
  .put(protect, collectPayment);

module.exports = router;
