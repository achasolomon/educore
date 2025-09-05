// backend/src/modules/library/validators/memberValidators.js
const { body, param } = require('express-validator');

const createMemberValidator = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('member_type')
    .notEmpty()
    .withMessage('Member type is required')
    .isIn(['student', 'teacher', 'staff', 'parent', 'external'])
    .withMessage('Invalid member type'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  
  body('max_books_allowed')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max books allowed must be between 1 and 50'),
  
  body('max_digital_books_allowed')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max digital books allowed must be between 1 and 100'),
  
  body('loan_period_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Loan period must be between 1 and 365 days'),
  
  body('max_renewals_allowed')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max renewals must be between 0 and 10'),
  
  body('can_reserve_books')
    .optional()
    .isBoolean()
    .withMessage('Can reserve books must be a boolean'),
  
  body('favorite_genres')
    .optional()
    .isArray()
    .withMessage('Favorite genres must be an array'),
  
  body('preferred_authors')
    .optional()
    .isArray()
    .withMessage('Preferred authors must be an array'),
  
  body('restricted_categories')
    .optional()
    .isArray()
    .withMessage('Restricted categories must be an array')
];

const updateMemberPrivilegesValidator = [
  param('id')
    .isUUID()
    .withMessage('Member ID must be a valid UUID'),
  
  body('max_books_allowed')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max books allowed must be between 1 and 50'),
  
  body('max_digital_books_allowed')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max digital books allowed must be between 1 and 100'),
  
  body('loan_period_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Loan period must be between 1 and 365 days'),
  
  body('max_renewals_allowed')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max renewals must be between 0 and 10'),
  
  body('can_reserve_books')
    .optional()
    .isBoolean()
    .withMessage('Can reserve books must be a boolean'),
  
  body('restricted_categories')
    .optional()
    .isArray()
    .withMessage('Restricted categories must be an array')
];

module.exports = {
  
  // Member validators
  createMemberValidator,
  updateMemberPrivilegesValidator,
};