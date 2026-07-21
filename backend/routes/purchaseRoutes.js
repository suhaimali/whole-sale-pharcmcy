const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, collectPayment, deletePurchase, updatePurchase } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, authorize('Admin', 'Administrator', 'Purchase Staff'), getPurchases)
  .post(protect, authorize('Admin', 'Administrator', 'Purchase Staff'), createPurchase);

router
  .route('/:id')
  .delete(protect, authorize('Admin', 'Administrator', 'Purchase Staff'), deletePurchase)
  .put(protect, authorize('Admin', 'Administrator', 'Purchase Staff'), updatePurchase);

router
  .route('/:id/pay')
  .put(protect, collectPayment);

module.exports = router;
