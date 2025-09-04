// backend/src/modules/library/controllers/transactionController.js
const LibraryService = require('../services/libraryService');
const BookTransaction = require('../models/BookTransaction');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');
const { successResponse, errorResponse } = require('../../../core/utils/responseHelpers');

class TransactionController {
  
  async checkoutBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const libraryService = new LibraryService();
      const transaction = await libraryService.checkoutBook(
        req.body.book_id,
        req.body.member_id,
        req.user.id,
        req.body.is_digital || false
      );
      
      return successResponse(res, 'Book checked out successfully', transaction, 201);
    } catch (error) {
      logger.error('Book checkout failed:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async returnBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const libraryService = new LibraryService();
      const transaction = await libraryService.returnBook(
        req.body.book_id,
        req.body.member_id,
        req.user.id,
        req.body.return_condition || 'good',
        req.body.notes || ''
      );
      
      return successResponse(res, 'Book returned successfully', transaction);
    } catch (error) {
      logger.error('Book return failed:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async renewBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const libraryService = new LibraryService();
      const transaction = await libraryService.renewBook(
        req.body.book_id,
        req.body.member_id
      );
      
      return successResponse(res, 'Book renewed successfully', transaction);
    } catch (error) {
      logger.error('Book renewal failed:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async reserveBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const libraryService = new LibraryService();
      const reservation = await libraryService.reserveBook(
        req.body.book_id,
        req.body.member_id
      );
      
      return successResponse(res, 'Book reserved successfully', reservation, 201);
    } catch (error) {
      logger.error('Book reservation failed:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async getOverdueBooks(req, res) {
    try {
      const overdueTransactions = await BookTransaction.findOverdueTransactions(req.user.school_id);
      
      return successResponse(res, 'Overdue books retrieved successfully', overdueTransactions);
    } catch (error) {
      logger.error('Failed to retrieve overdue books:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async getLibraryStatistics(req, res) {
    try {
      const libraryService = new LibraryService();
      const stats = await libraryService.getLibraryStatistics(req.user.school_id);
      
      return successResponse(res, 'Library statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Failed to retrieve library statistics:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = {
  BookController: new BookController(),
  MemberController: new MemberController(),
  TransactionController: new TransactionController()
};