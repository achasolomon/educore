// backend/src/modules/library/routes/transactionRoutes.js
const express = require('express');
const Router = express.Router();
const TransactionController = require('../controllers/transactionController');
const {
  checkoutBookValidator,
  returnBookValidator,
  renewBookValidator,
  reserveBookValidator
} = require('../validators/transactionValidators');

const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');

// Checkout a book (librarian only)
Router.post('/checkout',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  checkoutBookValidator,
  TransactionController.checkoutBook
);

// Return a book (librarian only)
Router.post('/return',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  returnBookValidator,
  TransactionController.returnBook
);

// Renew a book (member or librarian)
Router.post('/renew',
  authMiddleware,
  renewBookValidator,
  TransactionController.renewBook
);

// Reserve a book (member or librarian)
Router.post('/reserve',
  authMiddleware,
  reserveBookValidator,
  TransactionController.reserveBook
);

// Get overdue books (librarian only)
Router.get('/overdue',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  TransactionController.getOverdueBooks
);

// Get library statistics (librarian only)
Router.get('/statistics',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  TransactionController.getLibraryStatistics
);

module.exports = Router;