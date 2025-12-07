class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      console.error('=== CATCH ASYNC ERROR ===');
      console.error('Function name:', fn.name || 'Anonymous');
      console.error('Route:', req.originalUrl);
      console.error('Method:', req.method);
      console.error('Error caught:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines
      });
      console.error('=========================');
      next(error);
    });
  };
};

module.exports = {
  AppError,
  catchAsync,
};