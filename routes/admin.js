const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictToAdmin);

// Get all sellers with stats
router.get('/sellers', adminController.getAllSellers);

// Get single seller details
router.get('/sellers/:sellerId', adminController.getSellerDetails);

// Get all orders with payment hold info
router.get('/orders', adminController.getAllOrders);

// Update payment release date for an order
router.patch('/orders/:orderId/release-date', adminController.updatePaymentReleaseDate);

// Release payment for a specific order
router.post('/orders/:orderId/release', adminController.releasePayment);

// Release all ready payments
router.post('/payments/release-ready', adminController.releaseReadyPayments);

module.exports = router;

