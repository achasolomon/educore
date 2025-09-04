// backend/src/modules/library/validators/bookValidators.js
const { body, query, param } = require('express-validator');

const createBookValidator = [
  body('title')
    .notEmpty()
    .withMessage('Book title is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  
  body('author')
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Author name must be between 1 and 255 characters'),
  
  body('isbn')
    .optional()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Invalid ISBN format'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['fiction', 'non-fiction', 'textbook', 'reference', 'journal', 'magazine', 'newspaper', 'digital', 'audiobook'])
    .withMessage('Invalid category'),
  
  body('genre')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Genre must be less than 100 characters'),
  
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid publication year'),
  
  body('publisher')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Publisher name must be less than 255 characters'),
  
  body('edition')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Edition must be less than 50 characters'),
  
  body('language')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters'),
  
  body('pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pages must be a positive integer'),
  
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal with up to 2 decimal places'),
  
  body('location_section')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Location section must be less than 50 characters'),
  
  body('location_shelf')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Location shelf must be less than 50 characters'),
  
  body('is_reference_only')
    .optional()
    .isBoolean()
    .withMessage('Reference only must be a boolean'),
  
  body('is_restricted')
    .optional()
    .isBoolean()
    .withMessage('Restricted must be a boolean'),
  
  body('restricted_to_classes')
    .optional()
    .isArray()
    .withMessage('Restricted classes must be an array'),
  
  body('digital_file_path')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Digital file path must be less than 500 characters'),
  
  body('created_by')
    .notEmpty()
    .withMessage('Created by is required')
    .isUUID()
    .withMessage('Created by must be a valid UUID')
];

const searchBooksValidator = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be between 1 and 255 characters'),
  
  query('category')
    .optional()
    .isIn(['fiction', 'non-fiction', 'textbook', 'reference', 'journal', 'magazine', 'newspaper', 'digital', 'audiobook'])
    .withMessage('Invalid category'),
  
  query('author')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Author must be between 1 and 255 characters'),
  
  query('year_from')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year from'),
  
  query('year_to')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year to'),
  
  query('available_only')
    .optional()
    .isBoolean()
    .withMessage('Available only must be a boolean'),
  
  query('digital_only')
    .optional()
    .isBoolean()
    .withMessage('Digital only must be a boolean'),
  
  query('sort_by')
    .optional()
    .isIn(['relevance', 'title', 'author', 'newest', 'popularity'])
    .withMessage('Invalid sort option'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

const updateBookStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['available', 'checked_out', 'reserved', 'maintenance', 'lost', 'damaged'])
    .withMessage('Invalid status')
];

module.exports = {
  // Book validators
  createBookValidator,
  searchBooksValidator,
  updateBookStatusValidator,
  
};