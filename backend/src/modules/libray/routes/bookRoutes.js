// backend/src/modules/library/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const { BookController } = require('../controllers/bookController');
const {
  createBookValidator,
  searchBooksValidator,
  updateBookStatusValidator,
} = require('../validators/bookValidators');
const { paramIdValidator } = require('../validators/transactionValidators');
const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/role');


// Create a new book (librarian only)
router.post('/',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  createBookValidator,
  BookController.createBook
);

// Get all books for school with filters
router.get('/',
  authMiddleware,
  BookController.getBooks
);

// Search books with advanced filters
router.get('/search',
  authMiddleware,
  searchBooksValidator,
  BookController.searchBooks
);

// Get book recommendations for a member
router.get('/recommendations/:memberId?',
  authMiddleware,
  BookController.getRecommendations
);

// Get a specific book by ID
router.get('/:id',
  authMiddleware,
  paramIdValidator,
  BookController.getBookById
);

// Update book status (librarian only)
router.patch('/:id/status',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  updateBookStatusValidator,
  BookController.updateBookStatus
);