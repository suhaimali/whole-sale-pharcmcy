const express = require('express');
const router = express.Router();
const { getUsers, createUser, toggleUserActive } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, authorize('Admin', 'Administrator'), getUsers)
  .post(protect, authorize('Admin', 'Administrator'), createUser);

router
  .route('/:id/toggle')
  .put(protect, authorize('Admin', 'Administrator'), toggleUserActive);

module.exports = router;
