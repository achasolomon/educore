// backend/src/modules/finance/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const FeeCategoryController = require('../controllers/feeCategoryController');
const FeeStructureController = require('../controllers/feeStructureController');
const StudentFeeController = require('../controllers/studentFeeController');
const PaymentController = require('../controllers/paymentController');
const FinanceValidators = require('../validators/financeValidators');
const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');

// Apply auth middleware to all routes
router.use(authMiddleware);

// ===== FEE CATEGORY ROUTES =====

/**
 * @route   GET /api/finance/categories
 * @desc    Get all fee categories
 * @access  Private (All authenticated users)
 */
router.get('/categories',
  rbac.requirePermission('finance:read'),
  FeeCategoryController.getAllCategories
);

/**
 * @route   POST /api/finance/categories
 * @desc    Create fee category
 * @access  Private (Admin, Finance)
 */
router.post('/categories',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateCreateCategory,
  FeeCategoryController.createCategory
);

/**
 * @route   POST /api/finance/categories/initialize
 * @desc    Initialize default fee categories
 * @access  Private (Admin)
 */
router.post('/categories/initialize',
  rbac.requireRole('admin'),
  FeeCategoryController.initializeDefaults
);

/**
 * @route   PUT /api/finance/categories/:categoryId
 * @desc    Update fee category
 * @access  Private (Admin, Finance)
 */
router.put('/categories/:categoryId',
  rbac.requirePermission('finance:update'),
  FinanceValidators.validateUpdateCategory,
  FeeCategoryController.updateCategory
);

/**
 * @route   DELETE /api/finance/categories/:categoryId
 * @desc    Delete fee category
 * @access  Private (Admin)
 */
router.delete('/categories/:categoryId',
  rbac.requireRole('admin'),
  FeeCategoryController.deleteCategory
);

// ===== FEE STRUCTURE ROUTES =====

/**
 * @route   GET /api/finance/structures
 * @desc    Get fee structures with filters
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/structures',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateGetStructures,
  FeeStructureController.getFeeStructures
);

/**
 * @route   POST /api/finance/structures
 * @desc    Create fee structure
 * @access  Private (Admin, Finance)
 */
router.post('/structures',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateCreateStructure,
  FeeStructureController.createStructure
);

/**
 * @route   POST /api/finance/structures/class/:classId/bulk
 * @desc    Bulk create fee structures for class
 * @access  Private (Admin, Finance)
 */
router.post('/structures/class/:classId/bulk',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateBulkCreateStructures,
  FeeStructureController.bulkCreateForClass
);

/**
 * @route   GET /api/finance/structures/class/:classId/total
 * @desc    Get total fee amount for class
 * @access  Private (Admin, Finance, Teachers)
 */
router.get('/structures/class/:classId/total',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateGetClassTotal,
  FeeStructureController.getClassFeeTotal
);

/**
 * @route   POST /api/finance/structures/copy-previous-year
 * @desc    Copy fee structures from previous academic year
 * @access  Private (Admin, Finance)
 */
router.post('/structures/copy-previous-year',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateCopyPreviousYear,
  FeeStructureController.copyFromPreviousYear
);

// ===== STUDENT FEE ROUTES =====

/**
 * @route   GET /api/finance/student-fees/:studentId
 * @desc    Get fees for specific student
 * @access  Private (Admin, Finance, Parents with access)
 */
router.get('/student-fees/:studentId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateStudentId,
  StudentFeeController.getStudentFees
);

/**
 * @route   GET /api/finance/student-fees/:studentId/summary
 * @desc    Get fee summary for student
 * @access  Private (Admin, Finance, Parents with access)
 */
router.get('/student-fees/:studentId/summary',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateStudentId,
  FinanceValidators.validateGetSummary,
  StudentFeeController.getStudentFeeSummary
);

/**
 * @route   POST /api/finance/student-fees/:studentId/generate
 * @desc    Generate fees for student
 * @access  Private (Admin, Finance)
 */
router.post('/student-fees/:studentId/generate',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateGenerateStudentFees,
  StudentFeeController.generateFeesForStudent
);

/**
 * @route   POST /api/finance/student-fees/class/:classId/bulk-generate
 * @desc    Bulk generate fees for entire class
 * @access  Private (Admin, Finance)
 */
router.post('/student-fees/class/:classId/bulk-generate',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateBulkGenerateFees,
  StudentFeeController.bulkGenerateForClass
);

/**
 * @route   PUT /api/finance/student-fees/:studentFeeId/discount
 * @desc    Apply discount to student fee
 * @access  Private (Admin, Finance)
 */
router.put('/student-fees/:studentFeeId/discount',
  rbac.requirePermission('finance:update'),
  FinanceValidators.validateApplyDiscount,
  StudentFeeController.applyDiscount
);

/**
 * @route   GET /api/finance/outstanding-fees
 * @desc    Get outstanding fees across school
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/outstanding-fees',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateGetOutstandingFees,
  StudentFeeController.getOutstandingFees
);

/**
 * @route   PUT /api/finance/update-overdue
 * @desc    Update overdue status for all fees
 * @access  Private (Admin, Finance)
 */
router.put('/update-overdue',
  rbac.requirePermission('finance:update'),
  StudentFeeController.updateOverdueStatus
);

// ===== PAYMENT ROUTES =====

/**
 * @route   GET /api/finance/payments
 * @desc    Get all payments with filters
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/payments',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateGetPayments,
  PaymentController.getAllPayments
);

/**
 * @route   POST /api/finance/payments
 * @desc    Record new payment
 * @access  Private (Admin, Finance, Cashier)
 */
router.post('/payments',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateCreatePayment,
  PaymentController.recordPayment
);

/**
 * @route   GET /api/finance/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Private (Admin, Finance, Cashier)
 */
router.get('/payments/:paymentId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validatePaymentId,
  PaymentController.getPaymentById
);

/**
 * @route   GET /api/finance/payments/student/:studentId
 * @desc    Get payments for specific student
 * @access  Private (Admin, Finance, Parents with access)
 */
router.get('/payments/student/:studentId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.validateStudentId,
  FinanceValidators.validateGetStudentPayments,
  PaymentController.getStudentPayments
);

/**
 * @route   PUT /api/finance/payments/:paymentId/verify
 * @desc    Verify payment
 * @access  Private (Admin, Finance)
 */
router.put('/payments/:paymentId/verify',
  rbac.requirePermission('finance:update'),
  FinanceValidators.validatePaymentId,
  FinanceValidators.validateVerifyPayment,
  PaymentController.verifyPayment
);

/**
 * @route   GET /api/finance/payments/statistics
 * @desc    Get payment statistics
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/payments/statistics',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.validateGetStatistics,
  PaymentController.getPaymentStatistics
);

/**
 * @route   POST /api/finance/payments/:paymentId/receipt
 * @desc    Generate receipt for payment
 * @access  Private (Admin, Finance, Cashier)
 */
router.post('/payments/:paymentId/receipt',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validatePaymentId,
  PaymentController.generateReceipt
);

module.exports = router;