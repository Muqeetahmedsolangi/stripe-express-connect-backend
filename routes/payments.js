const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validatePaymentIntent } = require('../middleware/validation');

const router = express.Router();

// Stripe webhook (must be before body parsing middleware)
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleWebhook
);

// All other routes require authentication
router.use(protect);

// Create payment intent
router.post('/create-payment-intent', 
  validatePaymentIntent, 
  paymentController.createPaymentIntent
);

// Confirm payment
router.post('/confirm-payment', paymentController.confirmPayment);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

// Get single order
router.get('/orders/:id', paymentController.getOrder);

// Release held payments (can be called manually or by cron job)
router.post('/release-held-payments', paymentController.releaseHeldPayments);

module.exports = router;