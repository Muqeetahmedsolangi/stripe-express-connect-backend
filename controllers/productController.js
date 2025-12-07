const { Product, User } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');

// Get all products (no pagination or filtering)
const getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    include: [{
      model: User,
      as: 'seller',
      attributes: ['firstName', 'lastName', 'email']
    }],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

// Get single product
const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ 
    where: {
      id: req.params.id
    },
    include: [{
      model: User,
      as: 'seller',
      attributes: ['firstName', 'lastName', 'email']
    }]
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

// Create new product (sellers only)
const createProduct = catchAsync(async (req, res, next) => {
  const { name, title, description, price, currency, images } = req.body;

  const productData = {
    name,
    title,
    description,
    price,
    currency,
    images,
    sellerId: req.user.id,
  };

  const product = await Product.create(productData);

  res.status(201).json({
    status: 'success',
    message: 'Product created successfully',
    data: {
      product,
    },
  });
});

// Update product (seller/admin only)
const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user owns the product or is admin
  if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to update this product', 403));
  }

  await product.update(req.body);

  const updatedProduct = await Product.findByPk(
    req.params.id,
    {
      include: [{
        model: User,
        as: 'seller',
        attributes: ['firstName', 'lastName', 'email']
      }]
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Product updated successfully',
    data: {
      product: updatedProduct,
    },
  });
});

// Delete product (seller/admin only)
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user owns the product or is admin
  if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to delete this product', 403));
  }

  // Hard delete - remove from database
  await product.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

// Get seller's own products
const getMyProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    where: { sellerId: req.user.id },
    include: [{
      model: User,
      as: 'seller',
      attributes: ['firstName', 'lastName', 'email']
    }],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};