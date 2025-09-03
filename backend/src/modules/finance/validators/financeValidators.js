// backend/src/modules/finance/validators/financeValidators.js
const { body, query, param, validationResult } = require('express-validator');

class FinanceValidators {
  static handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  };

  // Validate create fee category
  static validateCreateCategory = [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),

    body('code')
      .notEmpty()
      .withMessage('Category code is required')
      .matches(/^[A-Z_]{2,20}$/)
      .withMessage('Category code must be 2-20 uppercase letters/underscores'),

    body('category_type')
      .isIn(['mandatory', 'optional'])
      .withMessage('Category type must be mandatory or optional'),

    body('billing_cycle')
      .isIn(['term', 'session', 'monthly', 'one_time'])
      .withMessage('Billing cycle must be term, session, monthly, or one_time'),

    body('default_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Default amount must be a positive number'),

    body('late_fee_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Late fee amount must be a positive number'),

    body('late_fee_days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Late fee days must be between 1 and 365'),

    this.handleValidationErrors
  ];

  // Validate update fee category
  static validateUpdateCategory = [
    param('categoryId')
      .isUUID()
      .withMessage('Valid category ID is required'),

    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),

    body('default_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Default amount must be a positive number'),

    this.handleValidationErrors
  ];

  // Validate create fee structure
  static validateCreateStructure = [
    body('academic_year_id')
      .isUUID()
      .withMessage('Valid academic year ID is required'),

    body('class_id')
      .isUUID()
      .withMessage('Valid class ID is required'),

    body('fee_category_id')
      .isUUID()
      .withMessage('Valid fee category ID is required'),

    body('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),

    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),

    body('early_payment_discount')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Early payment discount must be between 0 and 100'),

    this.handleValidationErrors
  ];

  // Validate get fee structures
  static validateGetStructures = [
    query('academic_year_id')
      .optional()
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    query('class_id')
      .optional()
      .isUUID()
      .withMessage('Class ID must be a valid UUID'),

    query('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate bulk create structures
  static validateBulkCreateStructures = [
    param('classId')
      .isUUID()
      .withMessage('Valid class ID is required'),

    body('academic_year_id')
      .isUUID()
      .withMessage('Valid academic year ID is required'),

    body('fee_structures')
      .isArray({ min: 1 })
      .withMessage('Fee structures array is required with at least one structure'),

    body('fee_structures.*.fee_category_id')
      .isUUID()
      .withMessage('Valid fee category ID is required for each structure'),

    body('fee_structures.*.amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number for each structure'),

    this.handleValidationErrors
  ];

  // Validate get class total
  static validateGetClassTotal = [
    param('classId')
      .isUUID()
      .withMessage('Valid class ID is required'),

    query('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    query('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate copy from previous year
  static validateCopyPreviousYear = [
    body('from_academic_year_id')
      .isUUID()
      .withMessage('Source academic year ID is required'),

    body('to_academic_year_id')
      .isUUID()
      .withMessage('Target academic year ID is required'),

    body('adjustment_percentage')
      .optional()
      .isFloat({ min: -100, max: 1000 })
      .withMessage('Adjustment percentage must be between -100 and 1000'),

    this.handleValidationErrors
  ];

  // Validate student ID parameter
  static validateStudentId = [
    param('studentId')
      .isUUID()
      .withMessage('Valid student ID is required'),

    this.handleValidationErrors
  ];

  // Validate payment ID parameter
  static validatePaymentId = [
    param('paymentId')
      .isUUID()
      .withMessage('Valid payment ID is required'),

    this.handleValidationErrors
  ];

  // Validate generate student fees
  static validateGenerateStudentFees = [
    param('studentId')
      .isUUID()
      .withMessage('Valid student ID is required'),

    body('class_id')
      .isUUID()
      .withMessage('Valid class ID is required'),

    body('academic_year_id')
      .isUUID()
      .withMessage('Valid academic year ID is required'),

    body('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate bulk generate fees
  static validateBulkGenerateFees = [
    param('classId')
      .isUUID()
      .withMessage('Valid class ID is required'),

    body('academic_year_id')
      .isUUID()
      .withMessage('Valid academic year ID is required'),

    body('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate apply discount
  static validateApplyDiscount = [
    param('studentFeeId')
      .isUUID()
      .withMessage('Valid student fee ID is required'),

    body('discount_amount')
      .isFloat({ min: 0 })
      .withMessage('Discount amount must be a positive number'),

    body('discount_type')
      .notEmpty()
      .withMessage('Discount type is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Discount type must be between 2 and 50 characters'),

    body('reason')
      .notEmpty()
      .withMessage('Discount reason is required')
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Validate get summary
  static validateGetSummary = [
    query('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate create payment
  static validateCreatePayment = [
    body('student_id')
      .isUUID()
      .withMessage('Valid student ID is required'),

    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Payment amount must be greater than 0'),

    body('payment_method')
      .isIn(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'pos'])
      .withMessage('Payment method must be one of: cash, bank_transfer, card, mobile_money, cheque, pos'),

    body('payment_date')
      .isISO8601()
      .withMessage('Valid payment date is required'),

    body('payer_id')
      .optional()
      .isUUID()
      .withMessage('Payer ID must be a valid UUID'),

    body('remarks')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Remarks cannot exceed 500 characters'),

    // Conditional validation based on payment method
    body().custom((body) => {
      const { payment_method } = body;

      if (payment_method === 'bank_transfer' && !body.bank_name) {
        throw new Error('Bank name is required for bank transfers');
      }

      if (payment_method === 'cheque' && !body.cheque_number) {
        throw new Error('Cheque number is required for cheque payments');
      }

      return true;
    }),

    this.handleValidationErrors
  ];

  // Validate verify payment
  static validateVerifyPayment = [
    body('verification_notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Verification notes cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Validate get payments
  static validateGetPayments = [
    query('payment_status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Invalid payment status'),

    query('payment_method')
      .optional()
      .isIn(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'pos'])
      .withMessage('Invalid payment method'),

    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    query('student_id')
      .optional()
      .isUUID()
      .withMessage('Student ID must be a valid UUID'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    this.handleValidationErrors
  ];

  // Validate get student payments
  static validateGetStudentPayments = [
    query('payment_status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Invalid payment status'),

    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    this.handleValidationErrors
  ];

  // Validate get outstanding fees
  static validateGetOutstandingFees = [
    query('class_id')
      .optional()
      .isUUID()
      .withMessage('Class ID must be a valid UUID'),

    query('academic_year_id')
      .optional()
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    query('overdue_only')
      .optional()
      .isBoolean()
      .withMessage('overdue_only must be true or false'),

    this.handleValidationErrors
  ];

  // Validate get statistics
  static validateGetStatistics = [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    query('class_id')
      .optional()
      .isUUID()
      .withMessage('Class ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  // Validate initiate payment
static validateInitiatePayment = [
  body('student_id')
    .isUUID()
    .withMessage('Valid student ID is required'),

  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Payment amount must be greater than 0'),

  body('gateway_code')
    .notEmpty()
    .withMessage('Gateway code is required')
    .isIn(['CASH', 'BANK_TRANSFER', 'PAYSTACK', 'FLUTTERWAVE'])
    .withMessage('Invalid gateway code'),

  body('customer_email')
    .isEmail()
    .withMessage('Valid customer email is required'),

  body('customer_phone')
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage('Valid Nigerian phone number is required'),

  body('payment_method')
    .isIn(['cash', 'bank_transfer', 'card', 'mobile_money'])
    .withMessage('Invalid payment method'),

  this.handleValidationErrors
];

// Validate create payment plan
static validateCreatePaymentPlan = [
  param('studentId')
    .isUUID()
    .withMessage('Valid student ID is required'),

  body('academic_year_id')
    .isUUID()
    .withMessage('Valid academic year ID is required'),

  body('plan_name')
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Plan name must be between 5 and 100 characters'),

  body('total_amount')
    .isFloat({ min: 1000 })
    .withMessage('Total amount must be at least ₦1,000'),

  body('down_payment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),

  body('number_of_installments')
    .isInt({ min: 2, max: 12 })
    .withMessage('Number of installments must be between 2 and 12'),

  body('installment_amount')
    .isFloat({ min: 500 })
    .withMessage('Installment amount must be at least ₦500'),

  body('start_date')
    .isISO8601()
    .withMessage('Valid start date is required'),

  body('frequency')
    .isIn(['weekly', 'bi_weekly', 'monthly', 'quarterly'])
    .withMessage('Frequency must be weekly, bi_weekly, monthly, or quarterly'),

  body('grace_period_days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Grace period must be between 1 and 30 days'),

  // Custom validation for payment plan logic
  body().custom((body) => {
    const { total_amount, down_payment = 0, number_of_installments, installment_amount } = body;
    
    const remainingAmount = total_amount - down_payment;
    const expectedInstallmentAmount = remainingAmount / number_of_installments;
    const tolerance = 10; // ₦10 tolerance
    
    if (Math.abs(installment_amount - expectedInstallmentAmount) > tolerance) {
      throw new Error(`Installment amount should be approximately ₦${expectedInstallmentAmount.toFixed(2)}`);
    }
    
    return true;
  }),

  this.handleValidationErrors
];

// Validate installment payment
static validateInstallmentPayment = [
  param('installmentId')
    .isUUID()
    .withMessage('Valid installment ID is required'),

  body('payment_id')
    .isUUID()
    .withMessage('Valid payment ID is required'),

  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Payment amount must be greater than 0'),

  this.handleValidationErrors
];

// =====  BUDGET VALIDATORS =====
  
  // Budget validators
  static createBudget = [
    body('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),
    
    body('budget_name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Budget name must be between 3 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('budget_type')
      .optional()
      .isIn(['revenue', 'operating', 'capital', 'project'])
      .withMessage('Budget type must be one of: revenue, operating, capital, project'),
    
    body('start_date')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    body('end_date')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('total_budgeted_amount')
      .isNumeric()
      .withMessage('Total budgeted amount must be a number')
      .custom(value => {
        if (parseFloat(value) <= 0) {
          throw new Error('Total budgeted amount must be greater than 0');
        }
        return true;
      }),
    
    body('budget_items')
      .optional()
      .isArray()
      .withMessage('Budget items must be an array'),
    
    body('budget_items.*.category_id')
      .if(body('budget_items').exists())
      .notEmpty()
      .withMessage('Budget item category ID is required')
      .isUUID()
      .withMessage('Budget item category ID must be a valid UUID'),
    
    body('budget_items.*.amount')
      .if(body('budget_items').exists())
      .isNumeric()
      .withMessage('Budget item amount must be a number')
      .custom(value => {
        if (parseFloat(value) <= 0) {
          throw new Error('Budget item amount must be greater than 0');
        }
        return true;
      }),
    
    body('alert_threshold')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Alert threshold must be between 1 and 100'),

    this.handleValidationErrors
  ];

  static updateBudget = [
    param('budgetId')
      .isUUID()
      .withMessage('Budget ID must be a valid UUID'),
    
    body('budget_name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Budget name must be between 3 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('total_budgeted_amount')
      .optional()
      .isNumeric()
      .withMessage('Total budgeted amount must be a number')
      .custom(value => {
        if (value !== undefined && parseFloat(value) <= 0) {
          throw new Error('Total budgeted amount must be greater than 0');
        }
        return true;
      }),
    
    body('alert_threshold')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Alert threshold must be between 1 and 100'),

    this.handleValidationErrors
  ];

  // ===== EXPENSE VALIDATORS =====
  
  static createExpense = [
    body('category_id')
      .notEmpty()
      .withMessage('Category ID is required')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    
    body('budget_id')
      .optional()
      .isUUID()
      .withMessage('Budget ID must be a valid UUID'),
    
    body('description')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Description must be between 5 and 500 characters'),
    
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom(value => {
        if (parseFloat(value) <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        if (parseFloat(value) > 100000000) { // 100M limit
          throw new Error('Amount cannot exceed ₦100,000,000');
        }
        return true;
      }),
    
    body('expense_date')
      .notEmpty()
      .withMessage('Expense date is required')
      .isISO8601()
      .withMessage('Expense date must be a valid date')
      .custom(value => {
        const expenseDate = new Date(value);
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        if (expenseDate > today) {
          throw new Error('Expense date cannot be in the future');
        }
        if (expenseDate < oneYearAgo) {
          throw new Error('Expense date cannot be more than one year ago');
        }
        return true;
      }),
    
    body('vendor_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Vendor name cannot exceed 100 characters'),
    
    body('receipt_number')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Receipt number cannot exceed 50 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom(tags => {
        if (tags && tags.length > 10) {
          throw new Error('Cannot have more than 10 tags');
        }
        if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 30)) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
        return true;
      }),

    this.handleValidationErrors
  ];

  static recordExpensePayment = [
    param('expenseId')
      .isUUID()
      .withMessage('Expense ID must be a valid UUID'),
    
    body('payment_amount')
      .isNumeric()
      .withMessage('Payment amount must be a number')
      .custom(value => {
        if (parseFloat(value) <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        return true;
      }),
    
    body('payment_date')
      .notEmpty()
      .withMessage('Payment date is required')
      .isISO8601()
      .withMessage('Payment date must be a valid date')
      .custom(value => {
        const paymentDate = new Date(value);
        const today = new Date();
        if (paymentDate > today) {
          throw new Error('Payment date cannot be in the future');
        }
        return true;
      }),
    
    body('payment_method')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['cash', 'bank_transfer', 'cheque', 'card', 'mobile_money', 'other'])
      .withMessage('Payment method must be one of: cash, bank_transfer, cheque, card, mobile_money, other'),
    
    body('reference_number')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Reference number cannot exceed 100 characters'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // ===== EXPENSE CATEGORY VALIDATORS =====
  
  static createExpenseCategory = [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Category name must be between 3 and 100 characters'),
    
    body('code')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Category code must be between 2 and 20 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Category code can only contain uppercase letters and underscores'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('category_type')
      .optional()
      .isIn(['operating', 'capital', 'academic', 'administrative', 'maintenance'])
      .withMessage('Category type must be one of: operating, capital, academic, administrative, maintenance'),
    
    body('requires_approval')
      .optional()
      .isBoolean()
      .withMessage('Requires approval must be a boolean'),
    
    body('approval_threshold')
      .optional()
      .isNumeric()
      .withMessage('Approval threshold must be a number')
      .custom(value => {
        if (value !== undefined && parseFloat(value) < 0) {
          throw new Error('Approval threshold cannot be negative');
        }
        return true;
      }),
    
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),

    this.handleValidationErrors
  ];

  // ===== QUERY VALIDATORS FOR FILTERING AND PAGINATION =====
  
  static getExpensesQuery = [
    query('category_id')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    
    query('budget_id')
      .optional()
      .isUUID()
      .withMessage('Budget ID must be a valid UUID'),
    
    query('approval_status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Approval status must be one of: pending, approved, rejected'),
    
    query('payment_status')
      .optional()
      .isIn(['pending', 'partially_paid', 'paid'])
      .withMessage('Payment status must be one of: pending, partially_paid, paid'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((endDate, { req }) => {
        if (endDate && req.query.start_date && new Date(endDate) <= new Date(req.query.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    this.handleValidationErrors
  ];

  static getBudgetsQuery = [
    query('academic_year_id')
      .optional()
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),
    
    query('budget_type')
      .optional()
      .isIn(['revenue', 'operating', 'capital', 'project'])
      .withMessage('Budget type must be one of: revenue, operating, capital, project'),
    
    query('status')
      .optional()
      .isIn(['draft', 'approved', 'active', 'closed'])
      .withMessage('Status must be one of: draft, approved, active, closed'),

    this.handleValidationErrors
  ];

  static dateRangeQuery = [
    query('start_date')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    query('end_date')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.query.start_date)) {
          throw new Error('End date must be after start date');
        }
        
        const diffTime = Math.abs(new Date(endDate) - new Date(req.query.start_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
          throw new Error('Date range cannot exceed 365 days');
        }
        
        return true;
      }),

    this.handleValidationErrors
  ];

  // ===== BULK OPERATIONS VALIDATORS =====
  
  static bulkApproveExpenses = [
    body('expense_ids')
      .isArray({ min: 1, max: 50 })
      .withMessage('Expense IDs must be an array with 1-50 items'),
    
    body('expense_ids.*')
      .isUUID()
      .withMessage('Each expense ID must be a valid UUID'),
    
    body('approval_notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Approval notes cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  static reorderCategories = [
    body('category_orders')
      .isArray({ min: 1 })
      .withMessage('Category orders must be an array with at least 1 item'),
    
    body('category_orders.*.id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    
    body('category_orders.*.sort_order')
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),

    this.handleValidationErrors
  ];

  // ===== PARAMETER VALIDATORS =====
  
  static uuidParam = (paramName) => [
    param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`),
    
    this.handleValidationErrors
  ];

  // ===== COMMON FIELD VALIDATORS =====
  
  static approvalNotes = [
    body('approval_notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Approval notes cannot exceed 1000 characters'),

    this.handleValidationErrors
  ];

  static rejectionReason = [
    body('rejection_reason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters'),

    this.handleValidationErrors
  ];

  // ===== FINANCIAL DASHBOARD VALIDATORS =====
  
  static validateDashboardQuery = [
    query('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),
    
    query('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),
    
    query('refresh')
      .optional()
      .isBoolean()
      .withMessage('Refresh must be true or false'),

    this.handleValidationErrors
  ];

  static validateAnalyticsGeneration = [
    body('period_type')
      .notEmpty()
      .withMessage('Period type is required')
      .isIn(['daily', 'monthly'])
      .withMessage('Period type must be daily or monthly'),
    
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .matches(/^\d{4}-\d{2}(-\d{2})?$/)
      .withMessage('Date must be in YYYY-MM or YYYY-MM-DD format'),
    
    body('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),
    
    body('term_id')
      .optional()
      .isUUID()
      .withMessage('Term ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  static validateCustomReport = [
    body('academic_year_id')
      .notEmpty()
      .withMessage('Academic year ID is required')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),
    
    body('report_type')
      .notEmpty()
      .withMessage('Report type is required')
      .isIn(['comprehensive_financial', 'revenue_analysis', 'budget_performance'])
      .withMessage('Report type must be one of: comprehensive_financial, revenue_analysis, budget_performance'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    
    body('format')
      .optional()
      .isIn(['json', 'pdf'])
      .withMessage('Format must be json or pdf'),
    
    body('include_charts')
      .optional()
      .isBoolean()
      .withMessage('Include charts must be true or false'),

    this.handleValidationErrors
  ];
}

module.exports = FinanceValidators;