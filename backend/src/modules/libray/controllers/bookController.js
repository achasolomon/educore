// backend/src/modules/library/controllers/bookController.js
const Book = require('../models/Book');
const LibraryService = require('../services/libraryService');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');
const { successResponse, errorResponse } = require('../../../core/utils/responseHelpers');

class BookController {
  
  async createBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const book = await Book.create(req.body, req.user.school_id);
      logger.info(`Book created: ${book.id}`, { user_id: req.user.id });
      
      return successResponse(res, 'Book created successfully', book, 201);
    } catch (error) {
      logger.error('Book creation failed:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getBooks(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        search: req.query.search,
        is_digital: req.query.is_digital === 'true'
      };

      const books = await Book.findBySchool(req.user.school_id, filters);
      
      return successResponse(res, 'Books retrieved successfully', books);
    } catch (error) {
      logger.error('Failed to retrieve books:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getBookById(req, res) {
    try {
      const book = await Book.findById(req.params.id, req.user.school_id);
      
      if (!book) {
        return errorResponse(res, 'Book not found', 404);
      }

      return successResponse(res, 'Book retrieved successfully', book);
    } catch (error) {
      logger.error('Failed to retrieve book:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async searchBooks(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const searchParams = {
        query: req.query.q,
        category: req.query.category,
        author: req.query.author,
        year_from: req.query.year_from,
        year_to: req.query.year_to,
        available_only: req.query.available_only !== 'false',
        digital_only: req.query.digital_only === 'true',
        sort_by: req.query.sort_by || 'relevance',
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const books = await Book.searchBooks(req.user.school_id, searchParams);
      
      return successResponse(res, 'Search completed successfully', {
        books,
        total: books.length,
        filters: searchParams
      });
    } catch (error) {
      logger.error('Book search failed:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getRecommendations(req, res) {
    try {
      const memberId = req.params.memberId || req.user.library_member_id;
      const limit = parseInt(req.query.limit) || 10;

      const libraryService = new LibraryService();
      const recommendations = await libraryService.getMemberRecommendations(memberId, limit);
      
      return successResponse(res, 'Recommendations retrieved successfully', recommendations);
    } catch (error) {
      logger.error('Failed to get recommendations:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async updateBookStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const book = await Book.updateAvailabilityStatus(
        req.params.id,
        req.user.school_id,
        req.body.status
      );

      if (!book) {
        return errorResponse(res, 'Book not found', 404);
      }

      logger.info(`Book status updated: ${book.id} to ${req.body.status}`, { 
        user_id: req.user.id 
      });
      
      return successResponse(res, 'Book status updated successfully', book);
    } catch (error) {
      logger.error('Book status update failed:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}
