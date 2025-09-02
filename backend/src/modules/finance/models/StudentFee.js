// backend/src/modules/finance/models/StudentFee.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StudentFee {
  static tableName = 'student_fees';

  static async create(studentFeeData, schoolId) {
    const [studentFee] = await db(this.tableName)
      .insert({
        ...studentFeeData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return studentFee;
  }

  static async findByStudent(studentId, schoolId, academicYearId = null, termId = null) {
    let query = db(this.tableName)
      .select([
        'student_fees.*',
        'fee_structures.amount as structure_amount',
        'fee_categories.name as category_name',
        'fee_categories.code as category_code',
        'fee_categories.category_type'
      ])
      .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .where('student_fees.student_id', studentId)
      .where('student_fees.school_id', schoolId);

    if (academicYearId) {
      query = query.where('student_fees.academic_year_id', academicYearId);
    }

    if (termId) {
      query = query.where(function() {
        this.where('student_fees.term_id', termId)
          .orWhereNull('student_fees.term_id');
      });
    }

    return await query.orderBy('fee_categories.sort_order');
  }

  static async generateForStudent(studentId, classId, academicYearId, termId, schoolId) {
    // Get fee structures for the class
    const FeeStructure = require('./FeeStructure');
    const feeStructures = await FeeStructure.findByClass(classId, schoolId, academicYearId, termId);

    const generatedFees = [];

    for (const structure of feeStructures) {
      // Check if student fee already exists
      const existing = await db(this.tableName)
        .where({
          student_id: studentId,
          fee_structure_id: structure.id,
          school_id: schoolId
        })
        .first();

      if (!existing) {
        const studentFeeData = {
          student_id: studentId,
          fee_structure_id: structure.id,
          academic_year_id: academicYearId,
          term_id: termId,
          original_amount: structure.amount,
          final_amount: structure.amount,
          balance: structure.amount,
          due_date: structure.due_date,
          status: 'pending'
        };

        const studentFee = await this.create(studentFeeData, schoolId);
        generatedFees.push(studentFee);
      }
    }

    return generatedFees;
  }

  static async applyPayment(studentFeeId, paymentAmount, schoolId) {
    const studentFee = await db(this.tableName)
      .where({ id: studentFeeId, school_id: schoolId })
      .first();

    if (!studentFee) {
      throw new Error('Student fee record not found');
    }

    const newAmountPaid = parseFloat(studentFee.amount_paid) + parseFloat(paymentAmount);
    const newBalance = parseFloat(studentFee.final_amount) - newAmountPaid;
    
    let newStatus = 'pending';
    if (newBalance <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    const [updated] = await db(this.tableName)
      .where({ id: studentFeeId, school_id: schoolId })
      .update({
        amount_paid: newAmountPaid,
        balance: Math.max(0, newBalance),
        status: newStatus,
        last_payment_date: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return updated;
  }

  static async applyDiscount(studentFeeId, discountAmount, discountType, reason, approvedBy, schoolId) {
    const studentFee = await db(this.tableName)
      .where({ id: studentFeeId, school_id: schoolId })
      .first();

    if (!studentFee) {
      throw new Error('Student fee record not found');
    }

    const newDiscountAmount = parseFloat(studentFee.discount_amount) + parseFloat(discountAmount);
    const newFinalAmount = parseFloat(studentFee.original_amount) + parseFloat(studentFee.additional_charges) - newDiscountAmount;
    const newBalance = newFinalAmount - parseFloat(studentFee.amount_paid);

    const [updated] = await db(this.tableName)
      .where({ id: studentFeeId, school_id: schoolId })
      .update({
        discount_amount: newDiscountAmount,
        final_amount: Math.max(0, newFinalAmount),
        balance: Math.max(0, newBalance),
        discount_type: discountType,
        discount_reason: reason,
        approved_by: approvedBy,
        updated_at: new Date()
      })
      .returning('*');

    return updated;
  }

  static async getOutstandingFees(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'student_fees.*',
        'students.first_name',
        'students.last_name',
        'students.student_id',
        'classes.name as class_name',
        'fee_categories.name as category_name',
        'fee_categories.code as category_code'
      ])
      .join('students', 'student_fees.student_id', 'students.id')
      .join('classes', 'students.class_id', 'classes.id')
      .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.balance', '>', 0)
      .whereNot('student_fees.status', 'paid');

    if (filters.class_id) {
      query = query.where('students.class_id', filters.class_id);
    }

    if (filters.academic_year_id) {
      query = query.where('student_fees.academic_year_id', filters.academic_year_id);
    }

    if (filters.overdue_only) {
      query = query.where('student_fees.is_overdue', true);
    }

    return await query.orderBy(['students.last_name', 'students.first_name']);
  }

  static async updateOverdueStatus(schoolId) {
    const today = new Date().toISOString().split('T')[0];

    // Update overdue status for fees past due date
    const overdueResults = await db(this.tableName)
      .where('school_id', schoolId)
      .where('balance', '>', 0)
      .where('due_date', '<', today)
      .whereNot('status', 'paid')
      .update({
        is_overdue: true,
        overdue_days: db.raw(`EXTRACT(DAY FROM (CURRENT_DATE - due_date))`),
        updated_at: new Date()
      });

    return overdueResults;
  }

  static async getFeeSummaryForStudent(studentId, academicYearId, schoolId) {
    const fees = await this.findByStudent(studentId, schoolId, academicYearId);
    
    const summary = {
      total_fees: 0,
      total_paid: 0,
      total_balance: 0,
      total_discount: 0,
      mandatory_fees: 0,
      optional_fees: 0,
      overdue_amount: 0,
      fees_by_category: {},
      payment_status: 'pending'
    };

    fees.forEach(fee => {
      const amount = parseFloat(fee.final_amount);
      const paid = parseFloat(fee.amount_paid);
      const balance = parseFloat(fee.balance);
      const discount = parseFloat(fee.discount_amount);

      summary.total_fees += amount;
      summary.total_paid += paid;
      summary.total_balance += balance;
      summary.total_discount += discount;

      if (fee.category_type === 'mandatory') {
        summary.mandatory_fees += amount;
      } else {
        summary.optional_fees += amount;
      }

      if (fee.is_overdue && balance > 0) {
        summary.overdue_amount += balance;
      }

      summary.fees_by_category[fee.category_code] = {
        name: fee.category_name,
        amount: amount,
        paid: paid,
        balance: balance,
        status: fee.status
      };
    });

    // Determine overall payment status
    if (summary.total_balance <= 0) {
      summary.payment_status = 'paid';
    } else if (summary.total_paid > 0) {
      summary.payment_status = 'partial';
    } else if (summary.overdue_amount > 0) {
      summary.payment_status = 'overdue';
    }

    return summary;
  }
}

module.exports = StudentFee;