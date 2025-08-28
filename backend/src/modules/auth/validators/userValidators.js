// backend/src/modules/auth/validators/userValidators.js
const { body, param, query } = require('express-validator');

const createUserValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters and spaces'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters and spaces'),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(['school_admin', 'teacher', 'parent'])
    .withMessage('Role must be either school_admin, teacher, or parent'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'suspended'])
    .withMessage('Status must be active, inactive, pending, or suspended')
];

const updateUserValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),

  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters and spaces'),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters and spaces'),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(['school_admin', 'teacher', 'parent'])
    .withMessage('Role must be either school_admin, teacher, or parent'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'suspended'])
    .withMessage('Status must be active, inactive, pending, or suspended')
];

const getUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional()
    .isIn(['school_admin', 'teacher', 'parent', 'student'])
    .withMessage('Invalid role filter'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'suspended'])
    .withMessage('Invalid status filter'),

  query('search')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search term must be between 2 and 50 characters')
];

const userIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format')
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  getUsersValidator,
  userIdValidator
};