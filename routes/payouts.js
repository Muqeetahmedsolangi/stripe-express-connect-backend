const express = require('express');
const payoutsController = require('../controllers/payoutsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get seller earnings dashboard
router.get('/earnings', payoutsController.getSellerEarnings);

// Get payout history
router.get('/history', payoutsController.getPayoutHistory);

// Get single payout details
router.get('/:id', payoutsController.getPayout);

module.exports = router;