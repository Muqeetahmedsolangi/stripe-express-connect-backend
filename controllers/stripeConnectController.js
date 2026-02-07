const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');

// Create Stripe Connect account and onboarding link
const createOnboardingLink = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return next(new AppError('User not found with this email', 404));
    }

    let stripeAccountId = user.stripeAccountId;

    // Create Stripe Express account if doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        country: 'US', // You can make this dynamic based on user location
        business_type: 'individual', // or 'company'
      });

      stripeAccountId = account.id;

      // Update user with Stripe account ID
      await user.update({ 
        stripeAccountId: stripeAccountId,
        role: 'seller' // Update role to seller when they start onboarding
      });
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/connect/refresh?account_id=${stripeAccountId}`,
      return_url: `${process.env.CLIENT_URL}/connect/success?account_id=${stripeAccountId}`,
      type: 'account_onboarding',
    });

    // Get account details to check current status
    const accountDetails = await stripe.accounts.retrieve(stripeAccountId);

    res.status(200).json({
      status: 'success',
      message: 'Onboarding link created successfully',
      data: {
        onboardingUrl: accountLink.url,
        stripeAccountId: stripeAccountId,
        accountDetails: {
          id: accountDetails.id,
          charges_enabled: accountDetails.charges_enabled,
          payouts_enabled: accountDetails.payouts_enabled,
          details_submitted: accountDetails.details_submitted,
          requirements: accountDetails.requirements,
        },
        returnUrl: `${process.env.CLIENT_URL}/connect/success?account_id=${stripeAccountId}`,
        refreshUrl: `${process.env.CLIENT_URL}/connect/refresh?account_id=${stripeAccountId}`,
      },
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return next(new AppError('Failed to create onboarding link', 500));
  }
});

// Check onboarding status
const checkOnboardingStatus = catchAsync(async (req, res, next) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    // Find user with this Stripe account
    const user = await User.findOne({ where: { stripeAccountId: accountId } });
    
    if (!user) {
      return next(new AppError('User not found for this account', 404));
    }

    // Create Stripe Customer if not exists (needed for making payments)
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId && account.details_submitted) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id.toString(),
            accountId: accountId,
          },
        });
        stripeCustomerId = customer.id;
        console.log('Created Stripe customer during status check:', stripeCustomerId);
      } catch (customerError) {
        console.error('Failed to create Stripe customer during status check:', customerError);
      }
    }

    // Update user status based on Stripe account status
    await user.update({
      onboardingCompleted: account.details_submitted && account.charges_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      stripeCustomerId: stripeCustomerId || user.stripeCustomerId,
    });

    res.status(200).json({
      status: 'success',
      data: {
        accountId: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        onboarding_completed: account.details_submitted && account.charges_enabled,
        requirements: account.requirements,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return next(new AppError('Failed to check onboarding status', 500));
  }
});

// Handle onboarding success/completion
const handleOnboardingSuccess = catchAsync(async (req, res, next) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const user = await User.findOne({ where: { stripeAccountId: accountId } });

    if (!user) {
      return next(new AppError('User not found for this account', 404));
    }

    // Update user with final onboarding status
    const isCompleted = account.details_submitted && account.charges_enabled;
    
    // Create Stripe Customer if not exists (needed for making payments)
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id.toString(),
            accountId: accountId,
          },
        });
        stripeCustomerId = customer.id;
        console.log('Created Stripe customer:', stripeCustomerId);
      } catch (customerError) {
        console.error('Failed to create Stripe customer:', customerError);
        // Continue without customer creation - not critical for Connect onboarding
      }
    }
    
    await user.update({
      onboardingCompleted: isCompleted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      stripeCustomerId: stripeCustomerId,
    });

    res.status(200).json({
      status: 'success',
      message: isCompleted ? 'Onboarding completed successfully!' : 'Onboarding in progress',
      data: {
        accountId: account.id,
        onboarding_completed: isCompleted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          onboardingCompleted: isCompleted,
        }
      },
    });
  } catch (error) {
    console.error('Onboarding success handler error:', error);
    return next(new AppError('Failed to process onboarding completion', 500));
  }
});

// Get user's Connect account info
const getConnectAccountInfo = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let connectInfo = {
      hasConnectAccount: !!user.stripeAccountId,
      onboardingCompleted: user.onboardingCompleted,
      chargesEnabled: user.chargesEnabled,
      payoutsEnabled: user.payoutsEnabled,
      role: user.role,
    };

    // If user has Stripe account, get current status from Stripe
    if (user.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        connectInfo = {
          ...connectInfo,
          stripeAccountId: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements,
        };
      } catch (stripeError) {
        console.error('Error fetching Stripe account:', stripeError);
        // Continue with local database info if Stripe call fails
      }
    }

    res.status(200).json({
      status: 'success',
      data: connectInfo,
    });
  } catch (error) {
    console.error('Get connect account info error:', error);
    return next(new AppError('Failed to get account information', 500));
  }
});

// Get official Stripe payouts for connected account
const getStripePayouts = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { limit = 10, starting_after } = req.query;

  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.stripeAccountId) {
      return next(new AppError('No Stripe Connect account found', 404));
    }

    // Check Stripe account status directly and sync with database
    try {
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      
      // Sync payouts enabled status with database
      if (user.payoutsEnabled !== account.payouts_enabled) {
        await user.update({ payoutsEnabled: account.payouts_enabled });
        user.payoutsEnabled = account.payouts_enabled;
      }

      // Check if payouts are actually enabled in Stripe
      if (!account.payouts_enabled) {
        return next(new AppError('Payouts not enabled for your Stripe account. Please complete your account setup.', 403));
      }
    } catch (stripeError) {
      console.error('Error checking Stripe account:', stripeError);
      // Fallback to database value if Stripe check fails
      if (!user.payoutsEnabled) {
        return next(new AppError('Payouts not enabled for your account', 403));
      }
    }

    // Fetch payouts from Stripe using the connected account
    const payoutsParams = {
      limit: parseInt(limit),
    };

    if (starting_after) {
      payoutsParams.starting_after = starting_after;
    }

    const payouts = await stripe.payouts.list(payoutsParams, {
      stripeAccount: user.stripeAccountId,
    });

    // Format payout data for frontend
    const formattedPayouts = payouts.data.map(payout => ({
      id: payout.id,
      amount: (payout.amount / 100).toFixed(2), // Convert from cents
      currency: payout.currency.toUpperCase(),
      status: payout.status,
      method: payout.method,
      type: payout.type,
      description: payout.description,
      arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
      createdDate: new Date(payout.created * 1000).toISOString(),
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
      destination: payout.destination,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        payouts: formattedPayouts,
        hasMore: payouts.has_more,
        total: payouts.total_count || formattedPayouts.length,
      },
    });
  } catch (error) {
    console.error('Get Stripe payouts error:', error);
    return next(new AppError('Failed to fetch payout information', 500));
  }
});

// Get payout balance from Stripe
const getPayoutBalance = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.stripeAccountId) {
      return next(new AppError('No Stripe Connect account found', 404));
    }

    // Fetch balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripeAccountId,
    });

    // Format balance data
    const formattedBalance = {
      available: balance.available.map(item => ({
        amount: (item.amount / 100).toFixed(2),
        currency: item.currency.toUpperCase(),
      })),
      pending: balance.pending.map(item => ({
        amount: (item.amount / 100).toFixed(2),
        currency: item.currency.toUpperCase(),
      })),
    };

    res.status(200).json({
      status: 'success',
      data: {
        balance: formattedBalance,
      },
    });
  } catch (error) {
    console.error('Get payout balance error:', error);
    return next(new AppError('Failed to fetch balance information', 500));
  }
});

module.exports = {
  createOnboardingLink,
  checkOnboardingStatus,
  handleOnboardingSuccess,
  getConnectAccountInfo,
  getStripePayouts,
  getPayoutBalance,
};