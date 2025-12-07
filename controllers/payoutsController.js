const { Payout, Order, OrderItem, Product, User } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');
const { Op } = require('sequelize');

// Get seller earnings dashboard
const getSellerEarnings = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id;

  // Get all payouts for this seller
  const payouts = await Payout.findAll({
    where: { sellerId },
    include: [{
      model: Order,
      as: 'order',
      attributes: ['orderNumber', 'createdAt', 'paidAt']
    }],
    order: [['createdAt', 'DESC']]
  });

  // Calculate earnings summary
  const totalEarnings = payouts.reduce((sum, payout) => {
    return sum + (payout.status === 'completed' ? parseFloat(payout.sellerEarnings) : 0);
  }, 0) / 100; // Convert from cents

  const pendingEarnings = payouts.reduce((sum, payout) => {
    return sum + (payout.status === 'pending' ? parseFloat(payout.sellerEarnings) : 0);
  }, 0) / 100;

  const totalSales = payouts.reduce((sum, payout) => {
    return sum + parseFloat(payout.totalAmount);
  }, 0) / 100;

  const totalFees = payouts.reduce((sum, payout) => {
    const fees = parseFloat(payout.platformFee) + parseFloat(payout.stripeFee) + parseFloat(payout.taxes);
    return sum + fees;
  }, 0) / 100;

  // Group by month for earnings chart
  const monthlyEarnings = {};
  payouts.forEach(payout => {
    if (payout.status === 'completed') {
      const month = new Date(payout.transferDate).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyEarnings[month]) {
        monthlyEarnings[month] = 0;
      }
      monthlyEarnings[month] += parseFloat(payout.sellerEarnings) / 100;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        totalSales: Math.round(totalSales * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalPayouts: payouts.length,
        completedPayouts: payouts.filter(p => p.status === 'completed').length,
        pendingPayouts: payouts.filter(p => p.status === 'pending').length,
        failedPayouts: payouts.filter(p => p.status === 'failed').length,
      },
      monthlyEarnings,
      recentPayouts: payouts.slice(0, 10).map(payout => ({
        id: payout.id,
        orderNumber: payout.order.orderNumber,
        totalAmount: parseFloat(payout.totalAmount) / 100,
        sellerEarnings: parseFloat(payout.sellerEarnings) / 100,
        platformFee: parseFloat(payout.platformFee) / 100,
        stripeFee: parseFloat(payout.stripeFee) / 100,
        taxes: parseFloat(payout.taxes) / 100,
        status: payout.status,
        transferDate: payout.transferDate,
        createdAt: payout.createdAt,
        orderDate: payout.order.createdAt,
        paidDate: payout.order.paidAt,
      }))
    }
  });
});

// Get payout history with pagination
const getPayoutHistory = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { count: totalPayouts, rows: payouts } = await Payout.findAndCountAll({
    where: { sellerId },
    include: [{
      model: Order,
      as: 'order',
      attributes: ['orderNumber', 'createdAt', 'paidAt'],
      include: [{
        model: OrderItem,
        as: 'orderItems',
        where: { sellerId },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'title']
        }]
      }]
    }],
    order: [['createdAt', 'DESC']],
    offset,
    limit
  });

  const totalPages = Math.ceil(totalPayouts / limit);

  res.status(200).json({
    status: 'success',
    results: payouts.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalPayouts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: {
      payouts: payouts.map(payout => ({
        id: payout.id,
        orderNumber: payout.order.orderNumber,
        products: payout.order.orderItems.map(item => ({
          name: item.product.name,
          title: item.product.title,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        totalAmount: parseFloat(payout.totalAmount) / 100,
        sellerEarnings: parseFloat(payout.sellerEarnings) / 100,
        platformFee: parseFloat(payout.platformFee) / 100,
        stripeFee: parseFloat(payout.stripeFee) / 100,
        taxes: parseFloat(payout.taxes) / 100,
        status: payout.status,
        stripeTransferId: payout.stripeTransferId,
        transferDate: payout.transferDate,
        failureReason: payout.failureReason,
        createdAt: payout.createdAt,
        orderDate: payout.order.createdAt,
        paidDate: payout.order.paidAt,
      }))
    }
  });
});

// Get single payout details
const getPayout = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id;
  const payoutId = req.params.id;

  const payout = await Payout.findOne({
    where: { 
      id: payoutId,
      sellerId 
    },
    include: [{
      model: Order,
      as: 'order',
      attributes: ['orderNumber', 'createdAt', 'paidAt', 'subtotal', 'total'],
      include: [{
        model: OrderItem,
        as: 'orderItems',
        where: { sellerId },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'title', 'description']
        }]
      }]
    }]
  });

  if (!payout) {
    return next(new AppError('Payout not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payout: {
        id: payout.id,
        orderNumber: payout.order.orderNumber,
        products: payout.order.orderItems.map(item => ({
          name: item.product.name,
          title: item.product.title,
          description: item.product.description,
          quantity: item.quantity,
          priceAtTime: parseFloat(item.price),
          totalForItem: parseFloat(item.price) * item.quantity
        })),
        breakdown: {
          totalAmount: parseFloat(payout.totalAmount) / 100,
          platformFee: parseFloat(payout.platformFee) / 100,
          platformFeeRate: '3.25%',
          stripeFee: parseFloat(payout.stripeFee) / 100,
          stripeFeeRate: '2.9%',
          taxes: parseFloat(payout.taxes) / 100,
          taxRate: '7.25%',
          sellerEarnings: parseFloat(payout.sellerEarnings) / 100,
        },
        status: payout.status,
        stripeTransferId: payout.stripeTransferId,
        transferDate: payout.transferDate,
        failureReason: payout.failureReason,
        createdAt: payout.createdAt,
        orderDate: payout.order.createdAt,
        paidDate: payout.order.paidAt,
      }
    }
  });
});

module.exports = {
  getSellerEarnings,
  getPayoutHistory,
  getPayout,
};