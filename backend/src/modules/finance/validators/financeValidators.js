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
}

module.exports = FinanceValidators;