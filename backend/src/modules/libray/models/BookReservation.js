// backend/src/modules/library/models/BookReservation.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class BookReservation {
  static tableName = 'book_reservations';

  static async create(reservationData, schoolId) {
    // Check if book is available
    const book = await db('library_books')
      .where('id', reservationData.book_id)
      .first();

    if (!book) {
      throw new Error('Book not found');
    }

    if (book.status === 'available') {
      throw new Error('Book is currently available for immediate checkout');
    }

    // Get current queue position
    const queuePosition = await this.getNextQueuePosition(reservationData.book_id);
    
    // Calculate estimated wait time
    const estimatedWaitDays = await this.calculateEstimatedWait(reservationData.book_id, queuePosition);

    const reservationId = await this.generateReservationId(schoolId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to claim

    const [reservation] = await db(this.tableName)
      .insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        book_id: reservationData.book_id,
        member_id: reservationData.member_id,
        reservation_id: reservationId,
        reserved_at: new Date(),
        expires_at: expiresAt,
        queue_position: queuePosition,
        estimated_wait_days: estimatedWaitDays,
        status: 'active'
      })
      .returning('*');

    // Update member reservation count
    await db('library_members')
      .where('id', reservationData.member_id)
      .update({
        books_reserved: db.raw('books_reserved + 1'),
        total_reservations_made: db.raw('total_reservations_made + 1')
      });

    return reservation;
  }

  static async processQueue(bookId) {
    // Get next reservation in queue
    const nextReservation = await db(this.tableName)
      .where('book_id', bookId)
      .where('status', 'active')
      .orderBy('queue_position', 'asc')
      .orderBy('reserved_at', 'asc')
      .first();

    if (!nextReservation) return null;

    // Update reservation status to notified
    const [updatedReservation] = await db(this.tableName)
      .where('id', nextReservation.id)
      .update({
        status: 'notified',
        notified_at: new Date(),
        notification_sent: true,
        notification_count: db.raw('notification_count + 1'),
        last_notification_sent: new Date()
      })
      .returning('*');

    // Update other reservations' queue positions
    await db(this.tableName)
      .where('book_id', bookId)
      .where('status', 'active')
      .where('queue_position', '>', nextReservation.queue_position)
      .update({
        queue_position: db.raw('queue_position - 1')
      });

    return updatedReservation;
  }

  static async getNextQueuePosition(bookId) {
    const lastPosition = await db(this.tableName)
      .max('queue_position as max_position')
      .where('book_id', bookId)
      .where('status', 'active')
      .first();

    return (parseInt(lastPosition.max_position) || 0) + 1;
  }

  static async calculateEstimatedWait(bookId, queuePosition) {
    // Get average loan duration for this book
    const avgDuration = await db('book_transactions')
      .avg('EXTRACT(epoch FROM (returned_at - issued_at))/86400 as avg_days')
      .where('book_id', bookId)
      .where('returned_at', 'is not', null)
      .first();

    const averageLoanDays = parseFloat(avgDuration.avg_days) || 14;
    return Math.ceil(queuePosition * averageLoanDays);
  }

  static async generateReservationId(schoolId) {
    const prefix = 'RES';
    const timestamp = Date.now().toString().slice(-6);
    const sequence = await db(this.tableName)
      .where('school_id', schoolId)
      .count('* as count')
      .first();

    return `${prefix}${timestamp}${(parseInt(sequence.count) + 1).toString().padStart(3, '0')}`;
  }
}

module.exports = BookReservation;