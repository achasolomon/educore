// backend/src/modules/library/services/libraryService.js
const Book = require('../models/Book');
const LibraryMember = require('../models/LibraryMember');
const BookTransaction = require('../models/BookTransaction');
const BookReservation = require('../models/BookReservation');
const { cache } = require('../../../core/utils/cache');
const logger = require('../../../core/utils/logger');

class LibraryService {
  
  async checkoutBook(bookId, memberId, issuedBy, isDigital = false) {
    try {
      // Validate member eligibility
      const member = await LibraryMember.findById(memberId);
      if (!member) {
        throw new Error('Library member not found');
      }

      if (member.status !== 'active') {
        throw new Error('Member account is not active');
      }

      // Check borrowing limits
      const maxBooks = isDigital ? member.max_digital_books_allowed : member.max_books_allowed;
      const currentBooks = isDigital ? member.digital_books_currently_borrowed : member.books_currently_borrowed;
      
      if (currentBooks >= maxBooks) {
        throw new Error(`Maximum book limit reached (${maxBooks})`);
      }

      // Check for outstanding fines
      if (member.outstanding_fines > 0 && member.outstanding_fines > 100) { // Allow small fines
        throw new Error('Outstanding fines must be cleared before borrowing');
      }

      // Validate book availability
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      if (!isDigital && book.status !== 'available') {
        throw new Error('Book is not available for checkout');
      }

      // Check restrictions
      if (book.is_restricted && book.restricted_to_classes) {
        const restrictedClasses = JSON.parse(book.restricted_to_classes || '[]');
        if (restrictedClasses.length > 0 && !restrictedClasses.includes(member.class_id)) {
          throw new Error('Book is restricted to specific classes');
        }
      }

      if (book.is_reference_only) {
        throw new Error('Reference books cannot be checked out');
      }

      // Create checkout transaction
      const transaction = await BookTransaction.createCheckout({
        book_id: bookId,
        member_id: memberId,
        issued_by: issuedBy,
        is_digital: isDigital
      }, member.school_id);

      // Process reservation queue if this was a reserved book
      if (!isDigital) {
        await BookReservation.processQueue(bookId);
      }

      // Clear cache
      await cache.del(`library:books:${member.school_id}`);
      await cache.del(`library:member:${memberId}`);

      logger.info(`Book checked out: ${bookId} to member: ${memberId}`, {
        transaction_id: transaction.id,
        issued_by: issuedBy
      });

      return transaction;

    } catch (error) {
      logger.error('Book checkout failed:', error);
      throw error;
    }
  }

  async returnBook(bookId, memberId, returnedBy, returnCondition = 'good', notes = '') {
    try {
      const transaction = await BookTransaction.createReturn({
        book_id: bookId,
        member_id: memberId,
        returned_by: returnedBy,
        return_condition: returnCondition,
        return_notes: notes
      });

      // Update book popularity score
      await Book.updatePopularityScore(bookId);

      // Clear relevant caches
      await cache.del(`library:books:${transaction.school_id}`);
      await cache.del(`library:member:${memberId}`);

      logger.info(`Book returned: ${bookId} by member: ${memberId}`, {
        transaction_id: transaction.id,
        condition: returnCondition
      });

      return transaction;

    } catch (error) {
      logger.error('Book return failed:', error);
      throw error;
    }
  }

  async renewBook(bookId, memberId) {
    try {
      const transaction = await BookTransaction.createRenewal({
        book_id: bookId,
        member_id: memberId
      });

      logger.info(`Book renewed: ${bookId} by member: ${memberId}`, {
        transaction_id: transaction.id,
        renewal_count: transaction.renewal_count
      });

      return transaction;

    } catch (error) {
      logger.error('Book renewal failed:', error);
      throw error;
    }
  }

  async reserveBook(bookId, memberId) {
    try {
      const reservation = await BookReservation.create({
        book_id: bookId,
        member_id: memberId
      });

      // Send notification about reservation
      // Integration with notification service would go here

      logger.info(`Book reserved: ${bookId} by member: ${memberId}`, {
        reservation_id: reservation.id,
        queue_position: reservation.queue_position
      });

      return reservation;

    } catch (error) {
      logger.error('Book reservation failed:', error);
      throw error;
    }
  }

  async getLibraryStatistics(schoolId) {
    try {
      const cacheKey = `library:stats:${schoolId}`;
      let stats = await cache.get(cacheKey);

      if (!stats) {
        const bookStats = await db('library_books')
          .select([
            db.raw('COUNT(*) as total_books'),
            db.raw('COUNT(CASE WHEN status = \'available\' THEN 1 END) as available_books'),
            db.raw('COUNT(CASE WHEN status = \'checked_out\' THEN 1 END) as checked_out_books'),
            db.raw('COUNT(CASE WHEN digital_file_path IS NOT NULL THEN 1 END) as digital_books')
          ])
          .where('school_id', schoolId)
          .first();

        const memberStats = await db('library_members')
          .select([
            db.raw('COUNT(*) as total_members'),
            db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_members'),
            db.raw('COUNT(CASE WHEN has_overdue_books = true THEN 1 END) as members_with_overdue')
          ])
          .where('school_id', schoolId)
          .first();

        const transactionStats = await db('book_transactions')
          .select([
            db.raw('COUNT(*) as total_transactions'),
            db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_loans'),
            db.raw('COUNT(CASE WHEN status = \'overdue\' THEN 1 END) as overdue_loans')
          ])
          .where('school_id', schoolId)
          .first();

        const fineStats = await db('library_fines')
          .select([
            db.raw('SUM(CASE WHEN status = \'pending\' THEN balance ELSE 0 END) as outstanding_fines'),
            db.raw('SUM(amount_paid) as total_fines_collected')
          ])
          .where('school_id', schoolId)
          .first();

        stats = {
          books: {
            total: parseInt(bookStats.total_books || 0),
            available: parseInt(bookStats.available_books || 0),
            checked_out: parseInt(bookStats.checked_out_books || 0),
            digital: parseInt(bookStats.digital_books || 0)
          },
          members: {
            total: parseInt(memberStats.total_members || 0),
            active: parseInt(memberStats.active_members || 0),
            with_overdue: parseInt(memberStats.members_with_overdue || 0)
          },
          transactions: {
            total: parseInt(transactionStats.total_transactions || 0),
            active_loans: parseInt(transactionStats.active_loans || 0),
            overdue_loans: parseInt(transactionStats.overdue_loans || 0)
          },
          finances: {
            outstanding_fines: parseFloat(fineStats.outstanding_fines || 0),
            total_collected: parseFloat(fineStats.total_fines_collected || 0)
          }
        };

        await cache.setex(cacheKey, 300, JSON.stringify(stats)); // 5 minutes cache
      } else {
        stats = JSON.parse(stats);
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get library statistics:', error);
      throw error;
    }
  }

  async getMemberRecommendations(memberId, limit = 10) {
    try {
      const member = await LibraryMember.findById(memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      return await Book.getRecommendations(member.school_id, memberId, limit);

    } catch (error) {
      logger.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  async processOverdueNotifications(schoolId) {
    try {
      const overdueTransactions = await BookTransaction.findOverdueTransactions(schoolId);
      
      const notifications = [];
      
      for (const transaction of overdueTransactions) {
        const daysOverdue = Math.ceil((new Date() - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24));
        
        // Create notification data
        notifications.push({
          member_id: transaction.member_id,
          email: transaction.email,
          phone: transaction.phone,
          book_title: transaction.title,
          days_overdue: daysOverdue,
          fine_amount: daysOverdue * 5.00 // Default late fee
        });

        // Update transaction status if not already overdue
        if (transaction.status !== 'overdue') {
          await db('book_transactions')
            .where('id', transaction.id)
            .update({
              status: 'overdue',
              days_overdue: daysOverdue
            });
        }
      }

      logger.info(`Processed ${notifications.length} overdue notifications`, {
        school_id: schoolId
      });

      return notifications;

    } catch (error) {
      logger.error('Failed to process overdue notifications:', error);
      throw error;
    }
  }
}