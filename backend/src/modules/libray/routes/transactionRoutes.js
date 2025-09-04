// backend/src/modules/library/routes/transactionRoutes.js
const transactionRouter = express.Router();
const TransactionController = require('../controllers/transactionController');
const {
  checkoutBookValidator,
  returnBookValidator,
  renewBookValidator,
  reserveBookValidator
} = require('../validators/transactionValidators');

const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/role');

// Checkout a book (librarian only)
transactionRouter.post('/checkout',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  checkoutBookValidator,
  TransactionController.checkoutBook
);

// Return a book (librarian only)
transactionRouter.post('/return',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  returnBookValidator,
  TransactionController.returnBook
);

// Renew a book (member or librarian)
transactionRouter.post('/renew',
  authMiddleware,
  renewBookValidator,
  TransactionController.renewBook
);

// Reserve a book (member or librarian)
transactionRouter.post('/reserve',
  authMiddleware,
  reserveBookValidator,
  TransactionController.reserveBook
);

// Get overdue books (librarian only)
transactionRouter.get('/overdue',
  authMiddleware,
  roleMiddleware(['librarian', 'admin']),
  TransactionController.getOverdueBooks
);

// Get library statistics (librarian only)
transactionRouter.get('/statistics',
  authMiddleware,
  roleMiddleware(['librarian', 'admin']),
  TransactionController.getLibraryStatistics
);