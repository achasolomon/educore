// backend/src/modules/staff/validators/staffValidators.js
const { body, query, param, validationResult } = require('express-validator');

class StaffValidators {
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

  // Validate staff ID parameter
  static validateStaffId = [
    param('staffId')
      .isUUID()
      .withMessage('Valid staff ID is required'),
    this.handleValidationErrors
  ];

  // Validate create staff
  static validateCreateStaff = [
    body('first_name')
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),

    body('last_name')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),

    body('middle_name')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Middle name cannot exceed 50 characters'),

    body('gender')
      .isIn(['male', 'female'])
      .withMessage('Gender must be male or female'),

    body('date_of_birth')
      .isISO8601()
      .withMessage('Valid date of birth is required')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 16 || age > 70) {
          throw new Error('Age must be between 16 and 70 years');
        }
        return true;
      }),

    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^(\+234|0)[789][01]\d{8}$/)
      .withMessage('Please provide a valid Nigerian phone number'),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email address is required'),

    body('category_id')
      .isUUID()
      .withMessage('Valid staff category is required'),

    body('department_id')
      .isUUID()
      .withMessage('Valid department is required'),

    body('position_id')
      .isUUID()
      .withMessage('Valid position is required'),

    body('hire_date')
      .isISO8601()
      .withMessage('Valid hire date is required')
      .custom((value) => {
        const hireDate = new Date(value);
        const today = new Date();
        
        if (hireDate > today) {
          throw new Error('Hire date cannot be in the future');
        }
        return true;
      }),

    body('employment_type')
      .isIn(['permanent', 'contract', 'part_time', 'casual', 'volunteer'])
      .withMessage('Employment type must be one of: permanent, contract, part_time, casual, volunteer'),

    body('basic_salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Basic salary must be a positive number'),

    body('bank_name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Bank name must be between 2 and 100 characters'),

    body('account_number')
      .optional()
      .matches(/^\d{10}$/)
      .withMessage('Account number must be exactly 10 digits'),

    body('emergency_contact_phone')
      .optional()
      .matches(/^(\+234|0)[789][01]\d{8}$/)
      .withMessage('Emergency contact must be a valid Nigerian phone number'),

    this.handleValidationErrors
  ];

  // Validate update staff
  static validateUpdateStaff = [
    body('first_name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),

    body('last_name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),

    body('phone')
      .optional()
      .matches(/^(\+234|0)[789][01]\d{8}$/)
      .withMessage('Please provide a valid Nigerian phone number'),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email address is required'),

    body('basic_salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Basic salary must be a positive number'),

    this.handleValidationErrors
  ];

  // Validate get all staff
  static validateGetAllStaff = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('employment_status')
      .optional()
      .isIn(['active', 'on_leave', 'suspended', 'terminated', 'retired'])
      .withMessage('Invalid employment status'),

    query('employment_type')
      .optional()
      .isIn(['permanent', 'contract', 'part_time', 'casual', 'volunteer'])
      .withMessage('Invalid employment type'),

    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be true or false'),

    this.handleValidationErrors
  ];

  // Validate update employment status
  static validateUpdateStatus = [
    body('status')
      .isIn(['active', 'on_leave', 'suspended', 'terminated', 'retired'])
      .withMessage('Status must be one of: active, on_leave, suspended, terminated, retired'),

    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Validate deactivate staff
  static validateDeactivateStaff = [
    body('reason')
      .notEmpty()
      .withMessage('Reason for deactivation is required')
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Validate bulk import
  static validateBulkImport = [
    body('staffList')
      .isArray({ min: 1 })
      .withMessage('Staff list is required and must contain at least one staff member'),

    body('staffList.*.first_name')
      .notEmpty()
      .withMessage('First name is required for all staff members'),

    body('staffList.*.last_name')
      .notEmpty()
      .withMessage('Last name is required for all staff members'),

    body('staffList.*.category_id')
      .isUUID()
      .withMessage('Valid category ID is required for all staff members'),

    this.handleValidationErrors
  ];

  // Validate create department
  static validateCreateDepartment = [
    body('name')
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),

    body('code')
      .notEmpty()
      .withMessage('Department code is required')
      .matches(/^[A-Z]{2,10}$/)
      .withMessage('Department code must be 2-10 uppercase letters'),

    body('department_type')
      .isIn(['academic', 'administrative', 'support'])
      .withMessage('Department type must be academic, administrative, or support'),

    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Validate create position
  static validateCreatePosition = [
    body('title')
      .notEmpty()
      .withMessage('Position title is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Position title must be between 2 and 100 characters'),

    body('code')
      .notEmpty()
      .withMessage('Position code is required')
      .matches(/^[A-Z]{2,10}$/)
      .withMessage('Position code must be 2-10 uppercase letters'),

    body('department_id')
      .isUUID()
      .withMessage('Valid department ID is required'),

    body('category_id')
      .isUUID()
      .withMessage('Valid category ID is required'),

    body('grade_level')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Grade level must be between 1 and 20'),

    body('min_salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum salary must be a positive number'),

    body('max_salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum salary must be a positive number'),

    body('max_positions')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maximum positions must be a positive integer'),

    this.handleValidationErrors
  ];

  // Validate create category
  static validateCreateCategory = [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),

    body('code')
      .notEmpty()
      .withMessage('Category code is required')
      .matches(/^[A-Z]{2,10}$/)
      .withMessage('Category code must be 2-10 uppercase letters'),

    body('is_academic')
      .optional()
      .isBoolean()
      .withMessage('is_academic must be true or false'),

    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),

    this.handleValidationErrors
  ];
}

module.exports = StaffValidators;