// backend/src/modules/finance/models/Payment.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Payment {
  static tableName = 'payments';

  static async create(paymentData, schoolId) {
    const paymentReference = await this.generatePaymentReference(schoolId);
    const receiptNumber = await this.generateReceiptNumber(schoolId);

    const [payment] = await db(this.tableName)
      .insert({
        ...paymentData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        payment_reference: paymentReference,
        receipt_number: receiptNumber
      })
      .returning('*');
    return payment;
  }

  static async generatePaymentReference(schoolId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Get daily sequence
    const today = date.toISOString().split('T')[0];
    const lastPayment = await db(this.tableName)
      .where('school_id', schoolId)
      .whereRaw('DATE(created_at) = ?', [today])
      .orderBy('created_at', 'desc')
      .first();

    let sequence = 1;
    if (lastPayment && lastPayment.payment_reference) {
      const lastSequence = parseInt(lastPayment.payment_reference.slice(-4));
      sequence = lastSequence + 1;
    }

    return `PAY${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }

  static async generateReceiptNumber(schoolId) {
    const date = new Date();
    const year = date.getFullYear();
    
    // Get yearly sequence
    const lastReceipt = await db(this.tableName)
      .where('school_id', schoolId)
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .orderBy('created_at', 'desc')
      .first();

    let sequence = 1;
    if (lastReceipt && lastReceipt.receipt_number) {
      const lastSequence = parseInt(lastReceipt.receipt_number.replace(/\D/g, ''));
      sequence = lastSequence + 1;
    }

    return `RCT/${year}/${sequence.toString().padStart(6, '0')}`;
  }

  static async recordPayment(paymentData, schoolId, receivedBy) {
    const trx = await db.transaction();

    try {
      // Create payment record
      const payment = await this.create({
        ...paymentData,
        received_by: receivedBy,
        is_verified: paymentData.payment_method === 'cash' ? true : false,
        verified_by: paymentData.payment_method === 'cash' ? receivedBy : null,
        verified_at: paymentData.payment_method === 'cash' ? new Date() : null
      }, schoolId);

      // Allocate payment to student fees
      const StudentFee = require('./StudentFee');
      let remainingAmount = parseFloat(paymentData.amount);
      const allocations = [];

      // Get outstanding fees for the student
      const outstandingFees = await StudentFee.findByStudent(
        paymentData.student_id, 
        schoolId, 
        paymentData.academic_year_id
      );

      // Sort fees by priority (overdue first, then by due date)
      const sortedFees = outstandingFees
        .filter(fee => fee.balance > 0)
        .sort((a, b) => {
          if (a.is_overdue && !b.is_overdue) return -1;
          if (!a.is_overdue && b.is_overdue) return 1;
          return new Date(a.due_date) - new Date(b.due_date);
        });

      // Allocate payment to fees
      for (const fee of sortedFees) {
        if (remainingAmount <= 0) break;

        const feeBalance = parseFloat(fee.balance);
        const allocationAmount = Math.min(remainingAmount, feeBalance);

        if (allocationAmount > 0) {
          // Create allocation record
          await db('payment_allocations')
            .transacting(trx)
            .insert({
              id: crypto.randomUUID(),
              payment_id: payment.id,
              student_fee_id: fee.id,
              school_id: schoolId,
              allocated_amount: allocationAmount
            });

          // Update student fee
          await StudentFee.applyPayment(fee.id, allocationAmount, schoolId);

          allocations.push({
            fee_id: fee.id,
            category_name: fee.category_name,
            allocated_amount: allocationAmount
          });

          remainingAmount -= allocationAmount;
        }
      }

      await trx.commit();

      return {
        payment,
        allocations,
        unallocated_amount: remainingAmount
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async findByStudent(studentId, schoolId, filters = {}) {
    let query = db(this.tableName)
      .where('student_id', studentId)
      .where('school_id', schoolId);

    if (filters.payment_status) {
      query = query.where('payment_status', filters.payment_status);
    }

    if (filters.start_date) {
      query = query.where('payment_date', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('payment_date', '<=', filters.end_date);
    }

    return await query
      .orderBy('payment_date', 'desc')
      .orderBy('created_at', 'desc');
  }

  static async findById(id, schoolId) {
    const payment = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();

    if (payment) {
      // Get payment allocations
      const allocations = await db('payment_allocations')
        .select([
          'payment_allocations.*',
          'fee_categories.name as category_name',
          'fee_categories.code as category_code'
        ])
        .join('student_fees', 'payment_allocations.student_fee_id', 'student_fees.id')
        .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
        .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
        .where('payment_allocations.payment_id', id);

      payment.allocations = allocations;
    }

    return payment;
  }

  static async verifyPayment(id, schoolId, verifiedBy, verificationNotes) {
    const [payment] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        is_verified: true,
        verified_by: verifiedBy,
        verified_at: new Date(),
        verification_notes: verificationNotes,
        payment_status: 'completed',
        updated_at: new Date()
      })
      .returning('*');

    return payment;
  }

  static async getPaymentStatistics(schoolId, filters = {}) {
    let query = db(this.tableName)
      .where('school_id', schoolId);

    if (filters.start_date) {
      query = query.where('payment_date', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('payment_date', '<=', filters.end_date);
    }

    const stats = await query
      .select([
        'payment_method',
        'payment_status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(amount) as total_amount')
      ])
      .groupBy(['payment_method', 'payment_status']);

    const summary = {
      total_payments: 0,
      total_amount: 0,
      by_method: {},
      by_status: {}
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const amount = parseFloat(stat.total_amount);

      summary.total_payments += count;
      summary.total_amount += amount;

      // By method
      if (!summary.by_method[stat.payment_method]) {
        summary.by_method[stat.payment_method] = { count: 0, amount: 0 };
      }
      summary.by_method[stat.payment_method].count += count;
      summary.by_method[stat.payment_method].amount += amount;

      // By status
      if (!summary.by_status[stat.payment_status]) {
        summary.by_status[stat.payment_status] = { count: 0, amount: 0 };
      }
      summary.by_status[stat.payment_status].count += count;
      summary.by_status[stat.payment_status].amount += amount;
    });

    return summary;
  }
}

module.exports = Payment;