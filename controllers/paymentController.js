const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, Product, OrderItem, User, Payout } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');

// Create Stripe payment intent
const createPaymentIntent = catchAsync(async (req, res, next) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Items are required', 400));
  }

  try {
    // Validate provided items
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({ 
      where: { 
        id: productIds
      }
    });

    if (products.length !== items.length) {
      const missingIds = productIds.filter(id => !products.find(p => p.id === id));
      return next(new AppError(`Invalid product IDs: ${missingIds.join(', ')}`, 400));
    }

    // Validate items and calculate totals
    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return next(new AppError(`Product not found`, 400));
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product,
        quantity: item.quantity,
        priceAtTime: product.price,
      });
    }

    // Calculate taxes and fees
    const governmentTax = subtotal * 0.0725; // 7.25%
    const platformFee = subtotal * 0.0325; // 3.25%
    const totalPrice = subtotal + governmentTax + platformFee;

    const amounts = {
      subtotal: Math.round(subtotal * 100) / 100,
      governmentTax: Math.round(governmentTax * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      total: Math.round(totalPrice * 100) / 100,
    };

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amounts.total * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        userId: req.user.id.toString(),
        totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0).toString(),
        subtotal: amounts.subtotal.toString(),
        governmentTax: amounts.governmentTax.toString(),
        platformFee: amounts.platformFee.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Generate order number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${timestamp.slice(-8)}-${random}`;

    // Create pending order
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      subtotal: amounts.subtotal,
      governmentTax: amounts.governmentTax,
      platformFee: amounts.platformFee,
      total: amounts.total,
      governmentTaxRate: 0.0725,
      platformFeeRate: 0.0325,
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'pending',
      currency: 'USD',
      status: 'pending',
    });

    // Create order items
    const orderItemsData = orderItems.map(item => ({
      orderId: order.id,
      productId: item.product.id,
      sellerId: item.product.sellerId,
      name: item.product.name,
      price: item.priceAtTime,
      quantity: item.quantity,
    }));

    await OrderItem.bulkCreate(orderItemsData);

    res.status(200).json({
      status: 'success',
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amounts.total,
        order: order,
        breakdown: {
          subtotal: amounts.subtotal,
          governmentTax: amounts.governmentTax,
          platformFee: amounts.platformFee,
          total: amounts.total,
          governmentTaxRate: '7.25%',
          platformFeeRate: '3.25%',
        },
      },
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return next(new AppError('Failed to create payment intent', 500));
  }
});

// Confirm payment and complete order
const confirmPayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId } = req.body;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return next(new AppError('Payment intent not found', 404));
    }

    // Find the order
    const order = await Order.findOne({ 
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId: req.user.id 
      },
      include: [{
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Update order based on payment status
    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'succeeded';
      order.paidAt = new Date();
      order.status = 'confirmed';

      // Product inventory management removed for simplified model

      await order.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment confirmed successfully',
        data: {
          order,
          paymentStatus: paymentIntent.status,
        },
      });
    } else {
      order.paymentStatus = 'failed';
      order.status = 'canceled';
      await order.save();

      res.status(400).json({
        status: 'fail',
        message: 'Payment failed',
        data: {
          order,
          paymentStatus: paymentIntent.status,
        },
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return next(new AppError('Failed to confirm payment', 500));
  }
});

// Get payment history
const getPaymentHistory = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const offset = (page - 1) * limit;

  const { count: totalOrders, rows: orders } = await Order.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    offset: offset,
    limit: limit,
    include: [{
      model: OrderItem,
      as: 'orderItems',
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name']
      }]
    }]
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
      hasPrevPage: page > 1,
    },
    data: {
      orders,
    },
  });
});

// Get single order
const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: [{
      model: OrderItem,
      as: 'orderItems',
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'title']
      }]
    }]
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

// Stripe webhook handler
const handleWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  
  console.log('🔔 Webhook received:', {
    signature: sig ? 'present' : 'missing',
    bodyType: typeof req.body,
    bodyLength: req.body ? req.body.length : 0
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📡 Processing webhook event: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
        await handlePaymentSucceeded(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`💔 Payment failed: ${failedPayment.id}`);
        await handlePaymentFailed(failedPayment);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
    
    console.log(`✅ Webhook processed successfully: ${event.type}`);
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to prevent Stripe from retrying
  }

  res.status(200).json({ received: true });
});

// Helper function to handle successful payment
const handlePaymentSucceeded = async (paymentIntent) => {
  console.log(`🔍 Looking for order with payment intent: ${paymentIntent.id}`);
  
  const order = await Order.findOne({
    where: { stripePaymentIntentId: paymentIntent.id },
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

  if (order) {
    console.log(`📦 Found order #${order.orderNumber} - updating status`);
    
    order.paymentStatus = 'succeeded';
    order.paidAt = new Date();
    order.status = 'confirmed';
    await order.save();

    console.log(`✅ Order #${order.orderNumber} confirmed - processing seller payouts`);
    
    // Process payouts for sellers
    await processSellerPayouts(order);
  } else {
    console.log(`⚠️ No order found for payment intent: ${paymentIntent.id}`);
  }
};

// Helper function to handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  const order = await Order.findOne({
    where: { stripePaymentIntentId: paymentIntent.id }
  });

  if (order) {
    order.paymentStatus = 'failed';
    order.status = 'canceled';
    await order.save();
  }
};

// Process seller payouts for an order
const processSellerPayouts = async (order) => {
  try {
    // Group order items by seller
    const sellerGroups = {};
    
    for (const item of order.orderItems) {
      const sellerId = item.product.sellerId;
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = {
          seller: item.product.seller,
          items: [],
          totalAmount: 0
        };
      }
      
      const itemTotal = parseFloat(item.price) * item.quantity;
      sellerGroups[sellerId].items.push(item);
      sellerGroups[sellerId].totalAmount += itemTotal;
    }

    // Process payout for each seller
    for (const [sellerId, group] of Object.entries(sellerGroups)) {
      const seller = group.seller;
      const sellerTotal = group.totalAmount;
      
      // Calculate fees and earnings
      const stripeFeeRate = 0.029; // 2.9% + 30¢ (simplified to percentage only)
      const platformFeeRate = 0.0325; // 3.25%
      const taxRate = 0.0725; // 7.25%
      
      const stripeFee = sellerTotal * stripeFeeRate;
      const platformFee = sellerTotal * platformFeeRate;
      const taxes = sellerTotal * taxRate;
      
      // Seller earnings = total - all fees and taxes
      const sellerEarnings = sellerTotal - stripeFee - platformFee - taxes;
      
      // Create payout record
      const payout = await Payout.create({
        sellerId: sellerId,
        orderId: order.id,
        totalAmount: Math.round(sellerTotal * 100), // Store in cents
        platformFee: Math.round(platformFee * 100),
        stripeFee: Math.round(stripeFee * 100),
        taxes: Math.round(taxes * 100),
        sellerEarnings: Math.round(sellerEarnings * 100),
        status: 'pending' 
      });

      // Only process transfer if seller has connected Stripe account and payouts enabled
      if (seller && seller.stripeAccountId && seller.payoutsEnabled && sellerEarnings > 0) {
        try {
          // Create Stripe transfer to connected account
          const transfer = await stripe.transfers.create({
            amount: Math.round(sellerEarnings * 100), // Amount in cents
            currency: 'usd',
            destination: seller.stripeAccountId,
            metadata: {
              orderId: order.id.toString(),
              sellerId: sellerId.toString(),
              payoutId: payout.id.toString(),
              orderNumber: order.orderNumber
            }
          });

          // Update payout record with transfer details
          payout.stripeTransferId = transfer.id;
          payout.status = 'completed';
          payout.transferDate = new Date();
          await payout.save();

          console.log(`✅ Payout processed for seller ${sellerId}: $${sellerEarnings.toFixed(2)}`);
        } catch (transferError) {
          console.error(`❌ Transfer failed for seller ${sellerId}:`, transferError);
          
          // Update payout record with failure
          payout.status = 'failed';
          payout.failureReason = transferError.message;
          await payout.save();
        }
      } else {
        console.log(`⚠️ Payout pending for seller ${sellerId}: Stripe account not connected or payouts disabled`);
      }
    }
  } catch (error) {
    console.error('Error processing seller payouts:', error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getOrder,
  handleWebhook,
};