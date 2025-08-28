// backend/src/core/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  let error = {
    message: err.message || 'Server Error',
    statusCode: err.statusCode || 500
  };

  // PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique constraint violation
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    error.message = 'Referenced record does not exist';
    error.statusCode = 400;
  }

  if (err.code === '23502') {
    // Not null violation
    error.message = 'Required field is missing';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;