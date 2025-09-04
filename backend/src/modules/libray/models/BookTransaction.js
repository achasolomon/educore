// backend/src/modules/library/models/BookTransaction.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class BookTransaction {
  static tableName = 'book_transactions';

  static async createCheckout(checkoutData, schoolId) {
    const transactionId = await this.generateTransactionId(schoolId);
    
    // Calculate due date based on member's loan period
    const member = await db('library_members')
      .where('id', checkoutData.member_id)
      .first();

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (member.loan_period_days || 14));

    const [transaction] = await db(this.tableName)
      .insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        transaction_id: transactionId,
        transaction_type: 'checkout',
        book_id: checkoutData.book_id,
        member_id: checkoutData.member_id,
        issued_by: checkoutData.issued_by,
        issued_at: new Date(),
        due_date: dueDate,
        is_digital: checkoutData.is_digital || false,
        status: 'active'
      })
      .returning('*');

    // Update book status
    await db('library_books')
      .where('id', checkoutData.book_id)
      .update({
        status: checkoutData.is_digital ? 'available' : 'checked_out',
        last_checked_out: new Date(),
        total_checkouts: db.raw('total_checkouts + 1')
      });

    // Update member's current borrowing count
    await db('library_members')
      .where('id', checkoutData.member_id)
      .update({
        books_currently_borrowed: db.raw('books_currently_borrowed + 1'),
        total_books_borrowed: db.raw('total_books_borrowed + 1'),
        last_active_date: new Date()
      });

    return transaction;
  }

  static async createReturn(returnData, schoolId) {
    const transaction = await db(this.tableName)
      .where({
        book_id: returnData.book_id,
        member_id: returnData.member_id,
        status: 'active'
      })
      .first();

    if (!transaction) {
      throw new Error('Active transaction not found');
    }

    const returnDate = new Date();
    const dueDate = new Date(transaction.due_date);
    const isOverdue = returnDate > dueDate;
    const daysOverdue = isOverdue ? Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate late fees if overdue
    let lateFee = 0;
    if (isOverdue) {
      const book = await db('library_books').where('id', returnData.book_id).first();
      lateFee = daysOverdue * (book.late_fee_per_day || 5.00);
    }

    // Update transaction
    const [updatedTransaction] = await db(this.tableName)
      .where('id', transaction.id)
      .update({
        returned_at: returnDate,
        returned_by: returnData.returned_by,
        status: isOverdue ? 'overdue' : 'returned',
        days_overdue: daysOverdue,
        late_fee_charged: lateFee,
        total_fees: lateFee,
        return_condition: returnData.return_condition || 'good',
        return_notes: returnData.return_notes,
        damage_description: returnData.damage_description,
        fees_paid: lateFee === 0
      })
      .returning('*');

    // Update book status
    await db('library_books')
      .where('id', returnData.book_id)
      .update({ status: 'available' });

    // Update member's borrowing count
    await db('library_members')
      .where('id', returnData.member_id)
      .update({
        books_currently_borrowed: db.raw('books_currently_borrowed - 1'),
        outstanding_fines: db.raw(`outstanding_fines + ${lateFee}`),
        has_overdue_books: db.raw(`(
          SELECT COUNT(*) > 0 
          FROM book_transactions 
          WHERE member_id = '${returnData.member_id}' 
          AND status = 'overdue'
        )`)
      });

    // Create fine record if applicable
    if (lateFee > 0) {
      await this.createFineRecord(transaction.id, 'late_return', lateFee, `Late return: ${daysOverdue} days overdue`);
    }

    return updatedTransaction;
  }

  static async createRenewal(renewalData, schoolId) {
    const transaction = await db(this.tableName)
      .where({
        book_id: renewalData.book_id,
        member_id: renewalData.member_id,
        status: 'active'
      })
      .first();

    if (!transaction) {
      throw new Error('Active transaction not found');
    }

    if (transaction.renewal_count >= transaction.max_renewals) {
      throw new Error('Maximum renewals exceeded');
    }

    // Check for reservations
    const hasReservations = await db('book_reservations')
      .where('book_id', renewalData.book_id)
      .where('status', 'active')
      .count('* as count')
      .first();

    if (parseInt(hasReservations.count) > 0) {
      throw new Error('Book has pending reservations');
    }

    // Calculate new due date
    const member = await db('library_members').where('id', renewalData.member_id).first();
    const newDueDate = new Date(transaction.due_date);
    newDueDate.setDate(newDueDate.getDate() + (member.loan_period_days || 14));

    const [updatedTransaction] = await db(this.tableName)
      .where('id', transaction.id)
      .update({
        due_date: newDueDate,
        renewal_count: db.raw('renewal_count + 1')
      })
      .returning('*');

    // Update member renewal stats
    await db('library_members')
      .where('id', renewalData.member_id)
      .update({
        total_renewals_made: db.raw('total_renewals_made + 1')
      });

    return updatedTransaction;
  }

  static async findOverdueTransactions(schoolId) {
    return await db(this.tableName)
      .select([
        'book_transactions.*',
        'library_books.title',
        'library_books.author',
        'library_books.barcode',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone'
      ])
      .join('library_books', 'book_transactions.book_id', 'library_books.id')
      .join('library_members', 'book_transactions.member_id', 'library_members.id')
      .join('users', 'library_members.user_id', 'users.id')
      .where('book_transactions.school_id', schoolId)
      .where('book_transactions.status', 'active')
      .where('book_transactions.due_date', '<', new Date())
      .orderBy('book_transactions.due_date', 'asc');
  }

  static async generateTransactionId(schoolId) {
    const prefix = 'TXN';
    const year = new Date().getFullYear();
    const sequence = await db(this.tableName)
      .where('school_id', schoolId)
      .where('created_at', '>=', `${year}-01-01`)
      .count('* as count')
      .first();

    const nextSequence = parseInt(sequence.count) + 1;
    return `${prefix}${year}${nextSequence.toString().padStart(6, '0')}`;
  }

  static async createFineRecord(transactionId, fineType, amount, description) {
    const transaction = await db(this.tableName).where('id', transactionId).first();
    
    return await db('library_fines').insert({
      id: crypto.randomUUID(),
      school_id: transaction.school_id,
      member_id: transaction.member_id,
      transaction_id: transactionId,
      book_id: transaction.book_id,
      fine_reference: `FINE${Date.now()}`,
      fine_type: fineType,
      amount: amount,
      balance: amount,
      description: description,
      fine_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }
}

module.exports = BookTransaction;