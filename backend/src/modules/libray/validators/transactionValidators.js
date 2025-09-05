// backend/src/modules/library/validators/transactionValidators.js
const { body, param } = require('express-validator');
const checkoutBookValidator = [
  body('book_id')
    .notEmpty()
    .withMessage('Book ID is required')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
  
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required')
    .isUUID()
    .withMessage('Member ID must be a valid UUID'),
  
  body('is_digital')
    .optional()
    .isBoolean()
    .withMessage('Is digital must be a boolean')
];

const returnBookValidator = [
  body('book_id')
    .notEmpty()
    .withMessage('Book ID is required')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
  
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required')
    .isUUID()
    .withMessage('Member ID must be a valid UUID'),
  
  body('return_condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Invalid return condition'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  body('damage_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Damage description must be less than 500 characters')
];

const renewBookValidator = [
  body('book_id')
    .notEmpty()
    .withMessage('Book ID is required')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
  
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required')
    .isUUID()
    .withMessage('Member ID must be a valid UUID')
];

const reserveBookValidator = [
  body('book_id')
    .notEmpty()
    .withMessage('Book ID is required')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
  
  body('member_id')
    .notEmpty()
    .withMessage('Member ID is required')
    .isUUID()
    .withMessage('Member ID must be a valid UUID')
];

const paramIdValidator = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID')
];

module.exports = {
  
  // Transaction validators
  checkoutBookValidator,
  returnBookValidator,
  renewBookValidator,
  reserveBookValidator,
  
  // Common validators
  paramIdValidator
};