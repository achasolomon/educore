// backend/src/modules/finance/controllers/expenseController.js
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const ExpenseCategory = require('../models/ExpenseCategory');
const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/connection');

class ExpenseController {
  // Create new expense
  static async createExpense(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const {
        category_id,
        budget_id,
        description,
        amount,
        expense_date,
        vendor_name,
        receipt_number,
        notes,
        tags,
        requires_approval
      } = req.body;

      // Validate category exists
      const categories = await ExpenseCategory.findBySchool(schoolId);
      const category = categories.find(c => c.id === category_id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Expense category not found'
        });
      }

      // Check if budget exists (if provided)
      let budget = null;
      if (budget_id) {
        const budgets = await Budget.findBySchool(schoolId);
        budget = budgets.find(b => b.id === budget_id);
        
        if (!budget) {
          return res.status(404).json({
            success: false,
            message: 'Budget not found'
          });
        }

        // Check if budget has sufficient allocation
        const currentSpent = parseFloat(budget.total_actual_amount || 0);
        const remainingBudget = parseFloat(budget.total_budgeted_amount) - currentSpent;
        
        if (parseFloat(amount) > remainingBudget) {
          return res.status(400).json({
            success: false,
            message: `Insufficient budget allocation. Available: ₦${remainingBudget.toLocaleString()}, Requested: ₦${parseFloat(amount).toLocaleString()}`
          });
        }
      }

      // Determine approval status based on category and amount
      let approvalStatus = 'approved';
      if (category.requires_approval || (category.approval_threshold && parseFloat(amount) > category.approval_threshold)) {
        approvalStatus = 'pending';
      }

      const expense = await Expense.create({
        category_id,
        budget_id: budget_id || null,
        description,
        amount: parseFloat(amount),
        expense_date,
        vendor_name,
        receipt_number,
        notes,
        tags: tags ? JSON.stringify(tags) : null,
        approval_status: approvalStatus,
        payment_status: 'pending',
        created_by: userId
      }, schoolId);

      // If auto-approved and has budget, update budget actual spending
      if (approvalStatus === 'approved' && budget_id) {
        await Budget.updateActualSpending(budget_id, schoolId);
      }

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: {
          ...expense,
          requires_approval: approvalStatus === 'pending'
        }
      });

    } catch (error) {
      logger.error('Create expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating expense'
      });
    }
  }

  // Get all expenses for school
  static async getExpenses(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const filters = req.query;

      const expenses = await Expense.findBySchool(schoolId, filters);

      // Parse tags and add computed fields
      const enrichedExpenses = expenses.map(expense => ({
        ...expense,
        tags: expense.tags ? JSON.parse(expense.tags) : [],
        balance: parseFloat(expense.balance || expense.amount),
        is_fully_paid: parseFloat(expense.amount_paid || 0) >= parseFloat(expense.amount),
        payment_percentage: parseFloat(expense.amount) > 0 ? 
          ((parseFloat(expense.amount_paid || 0) / parseFloat(expense.amount)) * 100).toFixed(2) : 0
      }));

      // Get summary statistics
      const summary = {
        total_expenses: enrichedExpenses.length,
        total_amount: enrichedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
        total_paid: enrichedExpenses.reduce((sum, e) => sum + parseFloat(e.amount_paid || 0), 0),
        pending_approval: enrichedExpenses.filter(e => e.approval_status === 'pending').length,
        approved_expenses: enrichedExpenses.filter(e => e.approval_status === 'approved').length,
        paid_expenses: enrichedExpenses.filter(e => e.payment_status === 'paid').length
      };

      res.json({
        success: true,
        data: enrichedExpenses,
        summary,
        count: enrichedExpenses.length
      });

    } catch (error) {
      logger.error('Get expenses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expenses'
      });
    }
  }

  // Get single expense by ID
  static async getExpenseById(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { expenseId } = req.params;

      const expenses = await Expense.findBySchool(schoolId, { expense_id: expenseId });
      const expense = expenses[0];

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      // Get payment history if expense has payments
      const paymentHistory = await db('expense_payments')
        .select([
          'id', 'amount', 'payment_date', 'payment_method', 
          'reference_number', 'notes', 'created_at'
        ])
        .where('expense_id', expenseId)
        .orderBy('created_at', 'desc');

      const enrichedExpense = {
        ...expense,
        tags: expense.tags ? JSON.parse(expense.tags) : [],
        payment_history: paymentHistory,
        balance: parseFloat(expense.balance || expense.amount),
        payment_count: paymentHistory.length
      };

      res.json({
        success: true,
        data: enrichedExpense
      });

    } catch (error) {
      logger.error('Get expense by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expense'
      });
    }
  }

  // Update expense
  static async updateExpense(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { expenseId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.school_id;
      delete updateData.expense_reference;
      delete updateData.created_by;
      delete updateData.created_at;
      delete updateData.amount_paid;
      delete updateData.balance;

      // Convert tags to JSON if provided
      if (updateData.tags) {
        updateData.tags = JSON.stringify(updateData.tags);
      }

      updateData.updated_at = new Date();

      const [expense] = await db('expenses')
        .where({ id: expenseId, school_id: schoolId })
        .update(updateData)
        .returning('*');

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: expense
      });

    } catch (error) {
      logger.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating expense'
      });
    }
  }

  // Approve expense
  static async approveExpense(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const { expenseId } = req.params;
      const { approval_notes } = req.body;

      const expense = await Expense.approveExpense(expenseId, schoolId, userId, approval_notes);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      // Update budget actual spending if expense has budget
      if (expense.budget_id) {
        await Budget.updateActualSpending(expense.budget_id, schoolId);
      }

      res.json({
        success: true,
        message: 'Expense approved successfully',
        data: expense
      });

    } catch (error) {
      logger.error('Approve expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving expense'
      });
    }
  }

  // Reject expense
  static async rejectExpense(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const { expenseId } = req.params;
      const { rejection_reason } = req.body;

      if (!rejection_reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const [expense] = await db('expenses')
        .where({ id: expenseId, school_id: schoolId })
        .update({
          approval_status: 'rejected',
          approved_by: userId,
          approved_at: new Date(),
          approval_notes: rejection_reason,
          updated_at: new Date()
        })
        .returning('*');

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense rejected successfully',
        data: expense
      });

    } catch (error) {
      logger.error('Reject expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting expense'
      });
    }
  }

  // Record expense payment
  static async recordPayment(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { expenseId } = req.params;
      const { payment_amount, payment_date, payment_method, reference_number, notes } = req.body;

      if (!payment_amount || parseFloat(payment_amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid payment amount is required'
        });
      }

      const expense = await Expense.recordPayment(
        expenseId,
        schoolId,
        parseFloat(payment_amount),
        payment_date,
        payment_method
      );

      // Record payment history
      await db('expense_payments').insert({
        id: crypto.randomUUID(),
        expense_id: expenseId,
        amount: parseFloat(payment_amount),
        payment_date,
        payment_method,
        reference_number,
        notes,
        created_at: new Date()
      });

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: expense
      });

    } catch (error) {
      logger.error('Record expense payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error recording payment'
      });
    }
  }

  // Get expense statistics
  static async getExpenseStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { start_date, end_date, category_id, budget_id } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const statistics = await Expense.getExpenseStatistics(schoolId, start_date, end_date);

      // Additional category-specific statistics if requested
      let categoryStats = null;
      if (category_id) {
        categoryStats = await db('expenses')
          .select([
            db.raw('COUNT(*) as expense_count'),
            db.raw('SUM(amount) as total_amount'),
            db.raw('SUM(amount_paid) as amount_paid'),
            db.raw('AVG(amount) as avg_expense'),
            db.raw('MIN(amount) as min_expense'),
            db.raw('MAX(amount) as max_expense')
          ])
          .where('school_id', schoolId)
          .where('category_id', category_id)
          .where('expense_date', '>=', start_date)
          .where('expense_date', '<=', end_date)
          .first();
      }

      res.json({
        success: true,
        data: {
          ...statistics,
          category_specific: categoryStats,
          period: { start_date, end_date }
        }
      });

    } catch (error) {
      logger.error('Get expense statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expense statistics'
      });
    }
  }

  // Bulk approve expenses
  static async bulkApproveExpenses(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const { expense_ids, approval_notes } = req.body;

      if (!Array.isArray(expense_ids) || expense_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid array of expense IDs is required'
        });
      }

      // Update expenses
      const updatedExpenses = await db('expenses')
        .whereIn('id', expense_ids)
        .where('school_id', schoolId)
        .where('approval_status', 'pending')
        .update({
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date(),
          approval_notes: approval_notes || 'Bulk approval',
          updated_at: new Date()
        })
        .returning(['id', 'budget_id']);

      // Update related budgets
      const uniqueBudgets = [...new Set(updatedExpenses
        .filter(e => e.budget_id)
        .map(e => e.budget_id))];

      for (const budgetId of uniqueBudgets) {
        await Budget.updateActualSpending(budgetId, schoolId);
      }

      res.json({
        success: true,
        message: `${updatedExpenses.length} expenses approved successfully`,
        data: {
          approved_count: updatedExpenses.length,
          updated_budgets: uniqueBudgets.length
        }
      });

    } catch (error) {
      logger.error('Bulk approve expenses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving expenses'
      });
    }
  }

  // Delete expense
  static async deleteExpense(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { expenseId } = req.params;

      // Check if expense has payments
      const paymentCount = await db('expense_payments')
        .count('* as count')
        .where('expense_id', expenseId)
        .first();

      if (parseInt(paymentCount.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete expense with recorded payments'
        });
      }

      const deletedRows = await db('expenses')
        .where({ id: expenseId, school_id: schoolId })
        .del();

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });

    } catch (error) {
      logger.error('Delete expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting expense'
      });
    }
  }
}

module.exports = ExpenseController;