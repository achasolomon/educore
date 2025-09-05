// backend/src/modules/library/routes/bookRoutes.js
const express = require('express');
const Router = express.Router();

const BookController  = require('../controllers/bookController');
const {
  createBookValidator,
  searchBooksValidator,
  updateBookStatusValidator,
} = require('../validators/bookValidators');
const { paramIdValidator } = require('../validators/transactionValidators');
const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');


// Create a new book (librarian only)
Router.post('/',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  createBookValidator,
  BookController.createBook
);

// Get all books for school with filters
Router.get('/',
  authMiddleware,
  BookController.getBooks
);

// Search books with advanced filters
Router.get('/search',
  authMiddleware,
  searchBooksValidator,
  BookController.searchBooks
);

// Get book recommendations for a member
Router.get('/recommendations/:memberId?',
  authMiddleware,
  BookController.getRecommendations
);

// Get a specific book by ID
Router.get('/:id',
  authMiddleware,
  paramIdValidator,
  BookController.getBookById
);

// Update book status (librarian only)
Router.patch('/:id/status',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  updateBookStatusValidator,
  BookController.updateBookStatus
);

module.exports = Router
;