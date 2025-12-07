const { body, param, validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  next();
};

// User validation rules
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name is required and must be less than 50 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Product validation rules
const validateProduct = [
  body('name')
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Product name is required and must be less than 200 characters'),
  body('title')
    .isLength({ min: 1, max: 300 })
    .trim()
    .withMessage('Product title is required and must be less than 300 characters'),
  body('description')
    .isLength({ min: 1, max: 2000 })
    .trim()
    .withMessage('Product description is required and must be less than 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  handleValidationErrors,
];


// Payment validation rules
const validatePaymentIntent = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must not be empty'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  handleValidationErrors,
];

// Generic MongoDB ID validation
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors,
];

// Stripe Connect validation rules
const validateOnboardingRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validatePaymentIntent,
  validateMongoId,
  validateOnboardingRequest,
  handleValidationErrors,
};