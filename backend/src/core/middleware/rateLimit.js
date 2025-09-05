const rateLimit = require('express-rate-limit');

// Export a function that creates a new limiter with custom options
module.exports = (options = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
    ...options
  });