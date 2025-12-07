const { AppError } = require('../utils/errors');

const handleCastErrorDB = (err) => {
  console.error('=== CAST ERROR ===');
  console.error('Path:', err.path);
  console.error('Value:', err.value);
  console.error('==================');
  
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  console.error('=== DUPLICATE FIELD ERROR ===');
  console.error('Error message:', err.errmsg);
  console.error('Error code:', err.code);
  console.error('============================');
  
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  console.error('=== VALIDATION ERROR ===');
  console.error('Validation errors:', err.errors);
  console.error('========================');
  
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
  console.error('=== DEVELOPMENT ERROR ===');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Status Code:', err.statusCode);
  console.error('Stack Trace:', err.stack);
  console.error('Full Error Object:', err);
  console.error('========================');
  
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    console.error('=== OPERATIONAL ERROR (PROD) ===');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Status Code:', err.statusCode);
    console.error('===============================');
    
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('=== PROGRAMMING ERROR (PROD) ===');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);
    console.error('Full Error Object:', err);
    console.error('===============================');

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  console.error('=== ERROR HANDLER TRIGGERED ===');
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Error received:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
  });
  console.error('================================');
  
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') {
      console.error('Handling CastError');
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      console.error('Handling Duplicate Field Error');
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      console.error('Handling Validation Error');
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      console.error('Handling JWT Error');
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      console.error('Handling JWT Expired Error');
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};