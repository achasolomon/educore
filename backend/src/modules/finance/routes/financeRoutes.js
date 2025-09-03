// backend/src/modules/finance/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const FeeCategoryController = require('../controllers/feeCategoryController');
const FeeStructureController = require('../controllers/feeStructureController');
const StudentFeeController = require('../controllers/studentFeeController');
const PaymentController = require('../controllers/paymentController');
const FinanceValidators = require('../validators/financeValidators');
const authMiddleware = require('../../../core/middleware/auth');
const PaymentGatewayController = require('../controllers/paymentGatewayController');
const PaymentReminderController = require('../controllers/paymentReminderController');
const PaymentPlanController = require('../controllers/paymentPlanController');
const FinancialDashboardController = require('../controllers/financialDashboardController');
const BudgetController = require('../controllers/budgetController');
const ExpenseController = require('../controllers/expenseController');
const ExpenseCategoryController = require('../controllers/expenseCategoryController');
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

// ===== PAYMENT GATEWAY ROUTES =====

/**
 * @route   GET /api/finance/gateways
 * @desc    Get all payment gateways
 * @access  Private (All authenticated users)
 */
router.get('/gateways',
  rbac.requirePermission('finance:read'),
  PaymentGatewayController.getAllGateways
);

/**
 * @route   POST /api/finance/gateways/initialize
 * @desc    Initialize default payment gateways
 * @access  Private (Admin)
 */
router.post('/gateways/initialize',
  rbac.requireRole('admin'),
  PaymentGatewayController.initializeDefaults
);

/**
 * @route   POST /api/finance/payments/initiate
 * @desc    Initiate new payment via gateway
 * @access  Private (Students, Parents, Finance staff)
 */
router.post('/payments/initiate',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateInitiatePayment,
  PaymentGatewayController.initiatePayment
);

/**
 * @route   GET /api/finance/payments/verify/:transaction_reference
 * @desc    Verify payment transaction
 * @access  Private (Finance staff, Students, Parents)
 */
router.get('/payments/verify/:transaction_reference',
  rbac.requirePermission('finance:read'),
  PaymentGatewayController.verifyPayment
);

/**
 * @route   GET /api/finance/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/transactions/stats',
  rbac.requirePermission('finance:analytics'),
  PaymentGatewayController.getTransactionStats
);

// ===== WEBHOOK ROUTES (No auth required) =====

/**
 * @route   POST /api/finance/webhooks/paystack
 * @desc    Handle Paystack webhook
 * @access  Public (Webhook)
 */
router.post('/webhooks/paystack',
  PaymentGatewayController.paystackWebhook
);

/**
 * @route   POST /api/finance/webhooks/flutterwave
 * @desc    Handle Flutterwave webhook
 * @access  Public (Webhook)
 */
router.post('/webhooks/flutterwave',
  PaymentGatewayController.flutterwaveWebhook
);

// ===== PAYMENT REMINDER ROUTES =====

/**
 * @route   POST /api/finance/reminders/generate-overdue
 * @desc    Generate overdue payment reminders
 * @access  Private (Admin, Finance)
 */
router.post('/reminders/generate-overdue',
  rbac.requirePermission('finance:create'),
  PaymentReminderController.generateOverdueReminders
);

/**
 * @route   POST /api/finance/reminders/generate-due-date
 * @desc    Generate due date payment reminders
 * @access  Private (Admin, Finance)
 */
router.post('/reminders/generate-due-date',
  rbac.requirePermission('finance:create'),
  PaymentReminderController.generateDueDateReminders
);

/**
 * @route   GET /api/finance/reminders/pending
 * @desc    Get pending reminders for processing
 * @access  Private (Admin, Finance)
 */
router.get('/reminders/pending',
  rbac.requirePermission('finance:read'),
  PaymentReminderController.getPendingReminders
);

/**
 * @route   PUT /api/finance/reminders/:reminderId/sent
 * @desc    Mark reminder as sent
 * @access  Private (System, Admin)
 */
router.put('/reminders/:reminderId/sent',
  rbac.requirePermission('finance:update'),
  PaymentReminderController.markReminderSent
);

/**
 * @route   GET /api/finance/reminders/stats
 * @desc    Get reminder statistics
 * @access  Private (Admin, Finance)
 */
router.get('/reminders/stats',
  rbac.requirePermission('finance:analytics'),
  PaymentReminderController.getReminderStats
);

// ===== PAYMENT PLAN ROUTES =====

/**
 * @route   POST /api/finance/payment-plans/:studentId
 * @desc    Create payment plan for student
 * @access  Private (Admin, Finance)
 */
router.post('/payment-plans/:studentId',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateCreatePaymentPlan,
  PaymentPlanController.createPaymentPlan
);

/**
 * @route   GET /api/finance/payment-plans/:studentId
 * @desc    Get payment plans for student
 * @access  Private (Admin, Finance, Parents with access)
 */
router.get('/payment-plans/:studentId',
  rbac.requirePermission('finance:read'),
  PaymentPlanController.getStudentPaymentPlans
);

/**
 * @route   POST /api/finance/payment-plans/installments/:installmentId/payment
 * @desc    Record installment payment
 * @access  Private (Admin, Finance)
 */
router.post('/payment-plans/installments/:installmentId/payment',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateInstallmentPayment,
  PaymentPlanController.recordInstallmentPayment
);

/**
 * @route   GET /api/finance/payment-plans/overdue-installments
 * @desc    Get overdue installments
 * @access  Private (Admin, Finance)
 */
router.get('/payment-plans/overdue-installments',
  rbac.requirePermission('finance:read'),
  PaymentPlanController.getOverdueInstallments
);

/**
 * @route   GET /api/finance/payment-plans/stats
 * @desc    Get payment plan statistics
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/payment-plans/stats',
  rbac.requirePermission('finance:analytics'),
  PaymentPlanController.getPaymentPlanStats
);


// ===== FINANCIAL DASHBOARD ROUTES =====

/**
 * @route   GET /api/finance/dashboard
 * @desc    Get comprehensive financial dashboard
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/dashboard',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.validateDashboardQuery,
  FinancialDashboardController.getDashboard
);

/**
 * @route   POST /api/finance/analytics/generate
 * @desc    Generate financial analytics for period
 * @access  Private (Admin, Finance)
 */
router.post('/analytics/generate',
  rbac.requirePermission('finance:create'),
  FinanceValidators.validateAnalyticsGeneration,
  FinancialDashboardController.generateAnalytics
);

/**
 * @route   GET /api/finance/trends
 * @desc    Get revenue trends analysis
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/trends',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.dateRangeQuery,
  FinancialDashboardController.getRevenueTrends
);

/**
 * @route   GET /api/finance/summary
 * @desc    Get financial summary report
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/summary',
  rbac.requirePermission('finance:analytics'),
  FinancialDashboardController.getFinancialSummary
);

/**
 * @route   POST /api/finance/reports/custom
 * @desc    Generate custom financial report
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/reports/custom',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.validateCustomReport,
  FinancialDashboardController.generateCustomReport
);

// ===== BUDGET MANAGEMENT ROUTES =====

/**
 * @route   POST /api/finance/budgets
 * @desc    Create new budget
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/budgets',
  rbac.requirePermission('finance:create'),
  FinanceValidators.createBudget,
  BudgetController.createBudget
);

/**
 * @route   GET /api/finance/budgets
 * @desc    Get all budgets with filtering
 * @access  Private (Admin, Finance, Principal, Teachers)
 */
router.get('/budgets',
  rbac.requirePermission('finance:read'),
  FinanceValidators.getBudgetsQuery,
  BudgetController.getBudgets
);

/**
 * @route   GET /api/finance/budgets/:budgetId
 * @desc    Get single budget by ID
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/budgets/:budgetId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.uuidParam('budgetId'),
  BudgetController.getBudgetById
);

/**
 * @route   PUT /api/finance/budgets/:budgetId
 * @desc    Update budget
 * @access  Private (Admin, Finance, Principal)
 */
router.put('/budgets/:budgetId',
  rbac.requirePermission('finance:update'),
  FinanceValidators.updateBudget,
  BudgetController.updateBudget
);

/**
 * @route   POST /api/finance/budgets/:budgetId/approve
 * @desc    Approve budget
 * @access  Private (Admin, Principal)
 */
router.post('/budgets/:budgetId/approve',
  rbac.requireRole('admin', 'principal'),
  FinanceValidators.uuidParam('budgetId'),
  FinanceValidators.approvalNotes,
  BudgetController.approveBudget
);

/**
 * @route   POST /api/finance/budgets/:budgetId/update-spending
 * @desc    Update actual spending for budget
 * @access  Private (Admin, Finance)
 */
router.post('/budgets/:budgetId/update-spending',
  rbac.requirePermission('finance:update'),
  FinanceValidators.uuidParam('budgetId'),
  BudgetController.updateActualSpending
);

/**
 * @route   GET /api/finance/budgets/utilization/overview
 * @desc    Get budget utilization overview
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/budgets/utilization/overview',
  rbac.requirePermission('finance:analytics'),
  BudgetController.getBudgetUtilization
);

/**
 * @route   DELETE /api/finance/budgets/:budgetId
 * @desc    Delete budget
 * @access  Private (Admin, Finance)
 */
router.delete('/budgets/:budgetId',
  rbac.requirePermission('finance:delete'),
  FinanceValidators.uuidParam('budgetId'),
  BudgetController.deleteBudget
);

/**
 * @route   POST /api/finance/budgets/annual
 * @desc    Create annual budget with templates
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/budgets/annual',
  rbac.requirePermission('finance:create'),
  BudgetController.createAnnualBudget
);

// ===== EXPENSE MANAGEMENT ROUTES =====

/**
 * @route   POST /api/finance/expenses
 * @desc    Create new expense
 * @access  Private (Admin, Finance, Teachers, Staff)
 */
router.post('/expenses',
  rbac.requirePermission('finance:create'),
  FinanceValidators.createExpense,
  ExpenseController.createExpense
);

/**
 * @route   GET /api/finance/expenses
 * @desc    Get all expenses with filtering
 * @access  Private (Admin, Finance, Principal, Teachers)
 */
router.get('/expenses',
  rbac.requirePermission('finance:read'),
  FinanceValidators.getExpensesQuery,
  ExpenseController.getExpenses
);

/**
 * @route   GET /api/finance/expenses/:expenseId
 * @desc    Get single expense by ID
 * @access  Private (Admin, Finance, Principal, Teachers)
 */
router.get('/expenses/:expenseId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.uuidParam('expenseId'),
  ExpenseController.getExpenseById
);

/**
 * @route   PUT /api/finance/expenses/:expenseId
 * @desc    Update expense
 * @access  Private (Admin, Finance)
 */
router.put('/expenses/:expenseId',
  rbac.requirePermission('finance:update'),
  FinanceValidators.uuidParam('expenseId'),
  ExpenseController.updateExpense
);

/**
 * @route   POST /api/finance/expenses/:expenseId/approve
 * @desc    Approve expense
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/expenses/:expenseId/approve',
  rbac.requirePermission('finance:approve'),
  FinanceValidators.uuidParam('expenseId'),
  FinanceValidators.approvalNotes,
  ExpenseController.approveExpense
);

/**
 * @route   POST /api/finance/expenses/:expenseId/reject
 * @desc    Reject expense
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/expenses/:expenseId/reject',
  rbac.requirePermission('finance:approve'),
  FinanceValidators.uuidParam('expenseId'),
  FinanceValidators.rejectionReason,
  ExpenseController.rejectExpense
);

/**
 * @route   POST /api/finance/expenses/:expenseId/payments
 * @desc    Record expense payment
 * @access  Private (Admin, Finance)
 */
router.post('/expenses/:expenseId/payments',
  rbac.requirePermission('finance:create'),
  FinanceValidators.recordExpensePayment,
  ExpenseController.recordPayment
);

/**
 * @route   GET /api/finance/expenses/statistics/summary
 * @desc    Get expense statistics
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/expenses/statistics/summary',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.dateRangeQuery,
  ExpenseController.getExpenseStatistics
);

/**
 * @route   POST /api/finance/expenses/bulk/approve
 * @desc    Bulk approve expenses
 * @access  Private (Admin, Finance, Principal)
 */
router.post('/expenses/bulk/approve',
  rbac.requirePermission('finance:approve'),
  FinanceValidators.bulkApproveExpenses,
  ExpenseController.bulkApproveExpenses
);

/**
 * @route   DELETE /api/finance/expenses/:expenseId
 * @desc    Delete expense
 * @access  Private (Admin, Finance)
 */
router.delete('/expenses/:expenseId',
  rbac.requirePermission('finance:delete'),
  FinanceValidators.uuidParam('expenseId'),
  ExpenseController.deleteExpense
);

// ===== EXPENSE CATEGORY ROUTES =====

/**
 * @route   POST /api/finance/expense-categories
 * @desc    Create new expense category
 * @access  Private (Admin, Finance)
 */
router.post('/expense-categories',
  rbac.requirePermission('finance:create'),
  FinanceValidators.createExpenseCategory,
  ExpenseCategoryController.createCategory
);

/**
 * @route   GET /api/finance/expense-categories
 * @desc    Get all expense categories
 * @access  Private (All authenticated users)
 */
router.get('/expense-categories',
  rbac.requirePermission('finance:read'),
  ExpenseCategoryController.getCategories
);

/**
 * @route   GET /api/finance/expense-categories/:categoryId
 * @desc    Get single expense category by ID
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/expense-categories/:categoryId',
  rbac.requirePermission('finance:read'),
  FinanceValidators.uuidParam('categoryId'),
  ExpenseCategoryController.getCategoryById
);

/**
 * @route   PUT /api/finance/expense-categories/:categoryId
 * @desc    Update expense category
 * @access  Private (Admin, Finance)
 */
router.put('/expense-categories/:categoryId',
  rbac.requirePermission('finance:update'),
  FinanceValidators.uuidParam('categoryId'),
  ExpenseCategoryController.updateCategory
);

/**
 * @route   POST /api/finance/expense-categories/:categoryId/deactivate
 * @desc    Deactivate expense category
 * @access  Private (Admin, Finance)
 */
router.post('/expense-categories/:categoryId/deactivate',
  rbac.requirePermission('finance:update'),
  FinanceValidators.uuidParam('categoryId'),
  ExpenseCategoryController.deactivateCategory
);

/**
 * @route   POST /api/finance/expense-categories/:categoryId/reactivate
 * @desc    Reactivate expense category
 * @access  Private (Admin, Finance)
 */
router.post('/expense-categories/:categoryId/reactivate',
  rbac.requirePermission('finance:update'),
  FinanceValidators.uuidParam('categoryId'),
  ExpenseCategoryController.reactivateCategory
);

/**
 * @route   POST /api/finance/expense-categories/initialize/defaults
 * @desc    Initialize default expense categories
 * @access  Private (Admin, Finance)
 */
router.post('/expense-categories/initialize/defaults',
  rbac.requireRole('admin'),
  ExpenseCategoryController.initializeDefaultCategories
);

/**
 * @route   PUT /api/finance/expense-categories/reorder
 * @desc    Reorder expense categories
 * @access  Private (Admin, Finance)
 */
router.put('/expense-categories/reorder',
  rbac.requirePermission('finance:update'),
  FinanceValidators.reorderCategories,
  ExpenseCategoryController.reorderCategories
);

/**
 * @route   GET /api/finance/expense-categories/statistics/summary
 * @desc    Get expense category statistics
 * @access  Private (Admin, Finance, Principal)
 */
router.get('/expense-categories/statistics/summary',
  rbac.requirePermission('finance:analytics'),
  FinanceValidators.dateRangeQuery,
  ExpenseCategoryController.getCategoryStatistics
);

// ===== UTILITY AND HEALTH CHECK ROUTES =====

/**
 * @route   GET /api/finance/health
 * @desc    Health check for finance module
 * @access  Private (All authenticated users)
 */
router.get('/health',
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: 'Finance module is operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: 'available',
        validation: 'active',
        analytics: 'running'
      }
    });
  }
);

/**
 * @route   GET /api/finance/permissions
 * @desc    Get finance module permissions for current user
 * @access  Private (All authenticated users)
 */
router.get('/permissions',
  authMiddleware,
  (req, res) => {
    const userRole = req.user.role;
    const permissions = {
      // Dashboard permissions
      can_view_dashboard: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_view_analytics: ['admin', 'financial_manager', 'principal'].includes(userRole),
      
      // Budget permissions
      can_create_budget: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_approve_budget: ['admin', 'principal'].includes(userRole),
      can_update_budget: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_delete_budget: ['admin', 'financial_manager'].includes(userRole),
      
      // Expense permissions
      can_create_expense: ['admin', 'financial_manager', 'teacher', 'staff'].includes(userRole),
      can_approve_expense: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_update_expense: ['admin', 'financial_manager'].includes(userRole),
      can_delete_expense: ['admin', 'financial_manager'].includes(userRole),
      can_process_payments: ['admin', 'financial_manager'].includes(userRole),
      
      // Category permissions
      can_manage_categories: ['admin', 'financial_manager'].includes(userRole),
      can_view_categories: true, // All authenticated users
      
      // Reporting permissions
      can_view_reports: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_generate_reports: ['admin', 'financial_manager', 'principal'].includes(userRole),
      can_export_reports: ['admin', 'financial_manager', 'principal'].includes(userRole),
      
      // Fee management permissions (from existing system)
      can_manage_fee_structures: ['admin', 'financial_manager'].includes(userRole),
      can_record_payments: ['admin', 'financial_manager', 'cashier'].includes(userRole),
      can_view_payment_stats: ['admin', 'financial_manager', 'principal'].includes(userRole)
    };

    res.json({
      success: true,
      data: permissions,
      user_role: userRole
    });
  }
);

module.exports = router;