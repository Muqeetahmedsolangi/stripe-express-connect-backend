const { User, Product, Order, OrderItem, Payout } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');
const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all sellers with their stats
const getAllSellers = catchAsync(async (req, res, next) => {
  const sellers = await User.findAll({
    where: {
      role: 'seller'
    },
    attributes: [
      'id', 'email', 'firstName', 'lastName', 'phoneNumber',
      'stripeAccountId', 'onboardingCompleted', 'chargesEnabled', 'payoutsEnabled',
      'createdAt', 'lastLogin'
    ],
    order: [['createdAt', 'DESC']]
  });

  // Get stats for each seller
  const sellersWithStats = await Promise.all(
    sellers.map(async (seller) => {
      // Get product count
      const productCount = await Product.count({
        where: { sellerId: seller.id }
      });

      // Get total sales (orders with this seller's products)
      const ordersWithSellerProducts = await Order.findAll({
        include: [{
          model: OrderItem,
          as: 'orderItems',
          where: { sellerId: seller.id },
          required: true
        }],
        where: {
          paymentStatus: 'succeeded'
        }
      });

      const totalSales = ordersWithSellerProducts.length;
      
      // Get total revenue (sum of seller earnings from payouts)
      const payouts = await Payout.findAll({
        where: {
          sellerId: seller.id,
          status: { [Op.in]: ['completed', 'pending'] }
        }
      });

      const totalRevenue = payouts.reduce((sum, payout) => {
        return sum + (parseFloat(payout.sellerEarnings) / 100);
      }, 0);

      // Get pending payouts
      const pendingPayouts = await Payout.count({
        where: {
          sellerId: seller.id,
          status: 'pending'
        }
      });

      // Get Stripe account details if available
      let stripeAccountDetails = null;
      if (seller.stripeAccountId) {
        try {
          const account = await stripe.accounts.retrieve(seller.stripeAccountId);
          stripeAccountDetails = {
            id: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            country: account.country,
            type: account.type,
            email: account.email
          };
        } catch (error) {
          console.error(`Error fetching Stripe account for seller ${seller.id}:`, error);
        }
      }

      return {
        ...seller.toJSON(),
        stats: {
          productCount,
          totalSales,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingPayouts
        },
        stripeAccount: stripeAccountDetails
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: sellersWithStats.length,
    data: {
      sellers: sellersWithStats
    }
  });
});

// Get single seller details with all info
const getSellerDetails = catchAsync(async (req, res, next) => {
  const { sellerId } = req.params;

  const seller = await User.findByPk(sellerId, {
    attributes: [
      'id', 'email', 'firstName', 'lastName', 'phoneNumber',
      'stripeAccountId', 'onboardingCompleted', 'chargesEnabled', 'payoutsEnabled',
      'createdAt', 'lastLogin', 'role'
    ]
  });

  if (!seller || seller.role !== 'seller') {
    return next(new AppError('Seller not found', 404));
  }

  // Get products
  const products = await Product.findAll({
    where: { sellerId: seller.id },
    order: [['createdAt', 'DESC']]
  });

  // Get orders with this seller's products
  const orders = await Order.findAll({
    include: [{
      model: OrderItem,
      as: 'orderItems',
      where: { sellerId: seller.id },
      required: true,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'title', 'price']
      }]
    }],
    where: {
      paymentStatus: 'succeeded'
    },
    order: [['createdAt', 'DESC']]
  });

  // Get payouts
  const payouts = await Payout.findAll({
    where: { sellerId: seller.id },
    include: [{
      model: Order,
      as: 'order',
      attributes: ['orderNumber', 'createdAt', 'paidAt']
    }],
    order: [['createdAt', 'DESC']]
  });

  // Get Stripe account details
  let stripeAccountDetails = null;
  if (seller.stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(seller.stripeAccountId);
      stripeAccountDetails = {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country,
        type: account.type,
        email: account.email,
        business_profile: account.business_profile,
        requirements: account.requirements
      };
    } catch (error) {
      console.error(`Error fetching Stripe account:`, error);
    }
  }

  // Calculate stats
  const totalSales = orders.length;
  const totalRevenue = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, payout) => sum + (parseFloat(payout.sellerEarnings) / 100), 0);
  const pendingRevenue = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, payout) => sum + (parseFloat(payout.sellerEarnings) / 100), 0);

  res.status(200).json({
    status: 'success',
    data: {
      seller: {
        ...seller.toJSON(),
        stats: {
          productCount: products.length,
          totalSales,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingRevenue: Math.round(pendingRevenue * 100) / 100,
          completedPayouts: payouts.filter(p => p.status === 'completed').length,
          pendingPayouts: payouts.filter(p => p.status === 'pending').length
        }
      },
      products,
      orders: orders.map(order => ({
        ...order.toJSON(),
        sellerItems: order.orderItems
      })),
      payouts: payouts.map(payout => ({
        ...payout.toJSON(),
        sellerEarnings: parseFloat(payout.sellerEarnings) / 100,
        totalAmount: parseFloat(payout.totalAmount) / 100,
        platformFee: parseFloat(payout.platformFee) / 100,
        stripeFee: parseFloat(payout.stripeFee) / 100,
        taxes: parseFloat(payout.taxes) / 100
      })),
      stripeAccount: stripeAccountDetails
    }
  });
});

// Get all orders with payment hold information
const getAllOrders = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const { count: totalOrders, rows: orders } = await Order.findAndCountAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'firstName', 'lastName']
    }, {
      model: OrderItem,
      as: 'orderItems',
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'title', 'price'],
        include: [{
          model: User,
          as: 'seller',
          attributes: ['id', 'email', 'firstName', 'lastName', 'stripeAccountId']
        }]
      }]
    }],
    order: [['createdAt', 'DESC']],
    offset,
    limit
  });

  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalOrders,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    data: {
      orders: orders.map(order => ({
        ...order.toJSON(),
        paymentHeld: order.paymentHeld || false,
        paymentReleased: order.paymentReleased || false,
        paymentReleaseDate: order.paymentReleaseDate,
        paymentReleasedAt: order.paymentReleasedAt,
        paymentHoldDays: order.paymentHoldDays || 5
      }))
    }
  });
});

// Update payment release date for an order
const updatePaymentReleaseDate = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { releaseDate, holdDays } = req.body;

  const order = await Order.findByPk(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.paymentReleased) {
    return next(new AppError('Payment has already been released', 400));
  }

  if (releaseDate) {
    const newReleaseDate = new Date(releaseDate);
    if (isNaN(newReleaseDate.getTime())) {
      return next(new AppError('Invalid release date', 400));
    }
    order.paymentReleaseDate = newReleaseDate;
  }

  if (holdDays !== undefined && holdDays !== null) {
    const days = parseInt(holdDays);
    if (isNaN(days) || days < 1 || days > 30) {
      return next(new AppError('Hold days must be between 1 and 30 days', 400));
    }
    order.paymentHoldDays = days;
    if (!releaseDate) {
      // Recalculate release date based on paid date or current date
      const baseDate = order.paidAt || order.createdAt;
      const newReleaseDate = new Date(baseDate);
      newReleaseDate.setDate(newReleaseDate.getDate() + days);
      order.paymentReleaseDate = newReleaseDate;
    }
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Payment release date updated successfully',
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentReleaseDate: order.paymentReleaseDate,
        paymentHoldDays: order.paymentHoldDays,
        paymentHeld: order.paymentHeld,
        paymentReleased: order.paymentReleased
      }
    }
  });
});

// Manually release payment for an order
const releasePayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    where: { id: orderId },
    include: [{
      model: OrderItem,
      as: 'orderItems',
      include: [{
        model: Product,
        as: 'product',
        include: [{
          model: User,
          as: 'seller'
        }]
      }]
    }]
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.paymentStatus !== 'succeeded') {
    return next(new AppError('Payment has not succeeded yet', 400));
  }

  if (order.paymentReleased) {
    return next(new AppError('Payment has already been released', 400));
  }

  // Import the processSellerPayouts function
  const { processSellerPayouts } = require('./paymentController');
  
  try {
    await processSellerPayouts(order);
    
    res.status(200).json({
      status: 'success',
      message: 'Payment released successfully to sellers',
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentReleased: order.paymentReleased,
          paymentReleasedAt: order.paymentReleasedAt
        }
      }
    });
  } catch (error) {
    console.error('Error releasing payment:', error);
    return next(new AppError('Failed to release payment: ' + error.message, 500));
  }
});

// Release multiple payments (for orders ready to be released)
const releaseReadyPayments = catchAsync(async (req, res, next) => {
  const { releaseHeldPayments } = require('./paymentController');
  
  try {
    const result = await releaseHeldPayments();
    res.status(200).json(result);
  } catch (error) {
    return next(new AppError('Failed to release payments: ' + error.message, 500));
  }
});

module.exports = {
  getAllSellers,
  getSellerDetails,
  getAllOrders,
  updatePaymentReleaseDate,
  releasePayment,
  releaseReadyPayments
};

