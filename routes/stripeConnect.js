const express = require('express');
const stripeConnectController = require('../controllers/stripeConnectController');
const { protect } = require('../middleware/auth');
const { validateOnboardingRequest } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create onboarding link for Stripe Connect account
router.post('/create-onboarding-link', 
  validateOnboardingRequest, 
  stripeConnectController.createOnboardingLink
);

// Check onboarding status
router.get('/status/:accountId', stripeConnectController.checkOnboardingStatus);

// Handle onboarding success/completion
router.get('/success/:accountId', stripeConnectController.handleOnboardingSuccess);

// Get current user's Connect account info
router.get('/account-info', stripeConnectController.getConnectAccountInfo);

// Get official Stripe payouts for connected account
router.get('/payouts', stripeConnectController.getStripePayouts);

// Get payout balance from Stripe
router.get('/balance', stripeConnectController.getPayoutBalance);

module.exports = router;