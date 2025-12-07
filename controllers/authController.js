const { User } = require('../models');
const { AppError, catchAsync } = require('../utils/errors');
const { createSendToken } = require('../utils/jwt');

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    emailVerified: true,
    lastLogin: new Date(),
  });

  createSendToken(user, 201, res, 'User registered successfully');
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  createSendToken(user, 200, res, 'Logged in successfully');
});

// Get current user (needed for token verification)
const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// Logout user (clear token)
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};