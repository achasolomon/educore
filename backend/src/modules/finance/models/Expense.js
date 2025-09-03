// backend/src/modules/finance/models/Expense.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Expense {
  static tableName = 'expenses';

  static async create(expenseData, schoolId) {
    const expenseReference = await this.generateExpenseReference(schoolId);
    
    const [expense] = await db(this.tableName)
      .insert({
        ...expenseData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        expense_reference: expenseReference,
        balance: expenseData.amount
      })
      .returning('*');
    return expense;
  }

  static async generateExpenseReference(schoolId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const lastExpense = await db(this.tableName)
      .where('school_id', schoolId)
      .whereRaw('EXTRACT(YEAR FROM expense_date) = ?', [date.getFullYear()])
      .whereRaw('EXTRACT(MONTH FROM expense_date) = ?', [date.getMonth() + 1])
      .orderBy('created_at', 'desc')
      .first();

    let sequence = 1;
    if (lastExpense && lastExpense.expense_reference) {
      const lastSequence = parseInt(lastExpense.expense_reference.slice(-4));
      sequence = lastSequence + 1;
    }

    return `EXP${year}${month}${sequence.toString().padStart(4, '0')}`;
  }

  static async findBySchool(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'expenses.*',
        'expense_categories.name as category_name',
        'expense_categories.code as category_code',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name'
      ])
      .join('expense_categories', 'expenses.category_id', 'expense_categories.id')
      .leftJoin('users', 'expenses.created_by', 'users.id')
      .where('expenses.school_id', schoolId);

    if (filters.category_id) {
      query = query.where('expenses.category_id', filters.category_id);
    }

    if (filters.approval_status) {
      query = query.where('expenses.approval_status', filters.approval_status);
    }

    if (filters.payment_status) {
      query = query.where('expenses.payment_status', filters.payment_status);
    }

    if (filters.start_date) {
      query = query.where('expenses.expense_date', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('expenses.expense_date', '<=', filters.end_date);
    }

    return await query.orderBy('expenses.expense_date', 'desc');
  }

  static async approveExpense(expenseId, schoolId, approvedBy, approvalNotes) {
    const [expense] = await db(this.tableName)
      .where({ id: expenseId, school_id: schoolId })
      .update({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date(),
        approval_notes: approvalNotes,
        updated_at: new Date()
      })
      .returning('*');

    return expense;
  }

  static async recordPayment(expenseId, schoolId, paymentAmount, paymentDate, paymentMethod) {
    const expense = await db(this.tableName)
      .where({ id: expenseId, school_id: schoolId })
      .first();

    if (!expense) {
      throw new Error('Expense not found');
    }

    const currentAmountPaid = parseFloat(expense.amount_paid);
    const newAmountPaid = currentAmountPaid + parseFloat(paymentAmount);
    const newBalance = parseFloat(expense.amount) - newAmountPaid;

    let paymentStatus = 'pending';
    if (newBalance <= 0) {
      paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    const [updatedExpense] = await db(this.tableName)
      .where({ id: expenseId })
      .update({
        amount_paid: newAmountPaid,
        balance: Math.max(0, newBalance),
        payment_status: paymentStatus,
        payment_date: paymentStatus === 'paid' ? paymentDate : expense.payment_date,
        payment_method: paymentMethod,
        updated_at: new Date()
      })
      .returning('*');

    return updatedExpense;
  }

  static async getExpenseStatistics(schoolId, startDate, endDate) {
    const stats = await db(this.tableName)
      .select([
        'expense_categories.name as category_name',
        'expenses.approval_status',
        'expenses.payment_status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(expenses.amount) as total_amount'),
        db.raw('SUM(expenses.amount_paid) as amount_paid')
      ])
      .join('expense_categories', 'expenses.category_id', 'expense_categories.id')
      .where('expenses.school_id', schoolId)
      .where('expenses.expense_date', '>=', startDate)
      .where('expenses.expense_date', '<=', endDate)
      .groupBy(['expense_categories.name', 'expenses.approval_status', 'expenses.payment_status']);

    const summary = {
      total_expenses: 0,
      total_amount: 0,
      amount_paid: 0,
      pending_approval: 0,
      approved_expenses: 0,
      by_category: {},
      by_status: {}
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const amount = parseFloat(stat.total_amount);
      const paid = parseFloat(stat.amount_paid);

      summary.total_expenses += count;
      summary.total_amount += amount;
      summary.amount_paid += paid;

      if (stat.approval_status === 'pending') {
        summary.pending_approval += count;
      } else if (stat.approval_status === 'approved') {
        summary.approved_expenses += count;
      }

      // By category
      if (!summary.by_category[stat.category_name]) {
        summary.by_category[stat.category_name] = { count: 0, amount: 0, paid: 0 };
      }
      summary.by_category[stat.category_name].count += count;
      summary.by_category[stat.category_name].amount += amount;
      summary.by_category[stat.category_name].paid += paid;

      // By status
      const statusKey = `${stat.approval_status}_${stat.payment_status}`;
      if (!summary.by_status[statusKey]) {
        summary.by_status[statusKey] = { count: 0, amount: 0 };
      }
      summary.by_status[statusKey].count += count;
      summary.by_status[statusKey].amount += amount;
    });

    return summary;
  }
}

module.exports = Expense;