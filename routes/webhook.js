const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Stripe webhook (must use raw body parsing)
router.post('/', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleWebhook
);

module.exports = router;