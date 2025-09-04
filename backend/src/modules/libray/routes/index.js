// backend/src/modules/library/routes/index.js
const express = require('express');
const router = express.Router();
const bookRoutes = require('./bookRoutes');
const memberRouter = require('./memberRoutes');
const transactionRouter = require('./transactionRoutes');   

// Import sub-routes
router.use('/books', bookRoutes);
router.use('/members', memberRouter);
router.use('/transactions', transactionRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Library module is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;

// Export individual routers as well
module.exports.bookRoutes = bookRoutes;
module.exports.memberRoutes = memberRouter;
module.exports.transactionRoutes = transactionRouter;
