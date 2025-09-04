// backend/src/modules/library/services/fineCalculationService.js
const db = require('../../../core/database/connection');
const logger = require('../../../core/utils/logger');

class FineCalculationService {
  
  /**
   * Calculate fine for overdue books
   * @param {string} transactionId - Book transaction ID
   * @param {Date} returnDate - Actual return date
   * @returns {Promise<number>} - Calculated fine amount
   */
  async calculateFine(transactionId, returnDate) {
    try {
      // Fetch transaction details from the database
      const transaction = await db('book_transactions')
        .where({ id: transactionId })
        .first();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const dueDate = new Date(transaction.due_date);
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        return 0; // No fine if returned on or before due date
      }

      const finePerDay = 1; // Fine amount per day
      const totalFine = daysOverdue * finePerDay;

      return totalFine;

    } catch (error) {
      logger.error('Fine calculation failed:', error);
      throw error;
    }
  }

}

module.exports = new FineCalculationService();