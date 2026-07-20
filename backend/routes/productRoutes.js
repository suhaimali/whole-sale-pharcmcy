const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorize('Admin', 'Administrator', 'Inventory Staff'), createProduct);

router
  .route('/:id')
  .put(protect, authorize('Admin', 'Administrator', 'Inventory Staff'), updateProduct)
  .delete(protect, authorize('Admin', 'Administrator'), deleteProduct);

module.exports = router;
