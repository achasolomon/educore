// backend/src/modules/settings/validators/schoolValidators.js
const { body } = require('express-validator');

const updateSchoolValidator = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('School name must be between 3 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),

  body('address')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be a valid JSON object')
];

module.exports = {
  updateSchoolValidator
};