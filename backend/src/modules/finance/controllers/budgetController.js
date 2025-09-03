// backend/src/modules/finance/controllers/budgetController.js
const Budget = require('../models/Budget');
const ExpenseCategory = require('../models/ExpenseCategory');
const logger = require('../../../core/utils/logger');

class BudgetController {
  // Create new budget
  static async createBudget(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const {
        academic_year_id,
        budget_name,
        description,
        budget_type,
        start_date,
        end_date,
        total_budgeted_amount,
        budget_items,
        monthly_breakdown,
        alert_threshold
      } = req.body;

      // Check if budget with same name exists for this academic year
      const existingBudget = await Budget.findBySchool(schoolId, academic_year_id)
        .then(budgets => budgets.find(b => b.budget_name.toLowerCase() === budget_name.toLowerCase()));

      if (existingBudget) {
        return res.status(409).json({
          success: false,
          message: 'Budget with this name already exists for the academic year'
        });
      }

      // Validate budget items if provided
      if (budget_items && Array.isArray(budget_items)) {
        const totalItemsAmount = budget_items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        if (Math.abs(totalItemsAmount - parseFloat(total_budgeted_amount)) > 0.01) {
          return res.status(400).json({
            success: false,
            message: 'Total budget items amount must equal total budgeted amount'
          });
        }
      }

      const budget = await Budget.create({
        academic_year_id,
        budget_name,
        description,
        budget_type: budget_type || 'operating',
        start_date,
        end_date,
        period_type: 'yearly',
        total_budgeted_amount: parseFloat(total_budgeted_amount),
        budget_items: JSON.stringify(budget_items || []),
        monthly_breakdown: JSON.stringify(monthly_breakdown || {}),
        alert_threshold: alert_threshold || 80,
        status: 'draft',
        created_by: userId
      }, schoolId);

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });

    } catch (error) {
      logger.error('Create budget error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating budget'
      });
    }
  }

  // Get all budgets for school
  static async getBudgets(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, budget_type, status } = req.query;

      let budgets = await Budget.findBySchool(schoolId, academic_year_id, budget_type);

      // Filter by status if provided
      if (status) {
        budgets = budgets.filter(budget => budget.status === status);
      }

      // Parse JSON fields and add computed fields
      const enrichedBudgets = budgets.map(budget => ({
        ...budget,
        budget_items: JSON.parse(budget.budget_items || '[]'),
        monthly_breakdown: JSON.parse(budget.monthly_breakdown || '{}'),
        utilization_rate: parseFloat(budget.utilization_rate || 0),
        variance_amount: parseFloat(budget.total_budgeted_amount) - parseFloat(budget.total_actual_amount || 0),
        variance_percentage: parseFloat(budget.variance_percentage || 0),
        is_over_threshold: parseFloat(budget.utilization_rate || 0) > budget.alert_threshold
      }));

      res.json({
        success: true,
        data: enrichedBudgets,
        count: enrichedBudgets.length
      });

    } catch (error) {
      logger.error('Get budgets error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching budgets'
      });
    }
  }

  // Get single budget by ID
  static async getBudgetById(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { budgetId } = req.params;

      const budgets = await Budget.findBySchool(schoolId);
      const budget = budgets.find(b => b.id === budgetId);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Get associated expenses
      const expenses = await db('expenses')
        .select([
          'id', 'expense_reference', 'description', 'amount', 'amount_paid',
          'expense_date', 'approval_status', 'payment_status'
        ])
        .where('budget_id', budgetId)
        .orderBy('expense_date', 'desc');

      const enrichedBudget = {
        ...budget,
        budget_items: JSON.parse(budget.budget_items || '[]'),
        monthly_breakdown: JSON.parse(budget.monthly_breakdown || '{}'),
        actual_spending: JSON.parse(budget.actual_spending || '[]'),
        associated_expenses: expenses,
        expense_count: expenses.length,
        pending_expenses: expenses.filter(e => e.approval_status === 'pending').length
      };

      res.json({
        success: true,
        data: enrichedBudget
      });

    } catch (error) {
      logger.error('Get budget by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching budget'
      });
    }
  }

  // Update budget
  static async updateBudget(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { budgetId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.school_id;
      delete updateData.created_by;
      delete updateData.created_at;
      delete updateData.total_actual_amount;
      delete updateData.utilization_rate;

      // Validate budget items total if being updated
      if (updateData.budget_items && updateData.total_budgeted_amount) {
        const totalItemsAmount = updateData.budget_items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        if (Math.abs(totalItemsAmount - parseFloat(updateData.total_budgeted_amount)) > 0.01) {
          return res.status(400).json({
            success: false,
            message: 'Total budget items amount must equal total budgeted amount'
          });
        }
      }

      // Convert arrays to JSON strings
      if (updateData.budget_items) {
        updateData.budget_items = JSON.stringify(updateData.budget_items);
      }
      if (updateData.monthly_breakdown) {
        updateData.monthly_breakdown = JSON.stringify(updateData.monthly_breakdown);
      }

      updateData.updated_at = new Date();

      const [budget] = await db('budgets')
        .where({ id: budgetId, school_id: schoolId })
        .update(updateData)
        .returning('*');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });

    } catch (error) {
      logger.error('Update budget error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating budget'
      });
    }
  }

  // Approve budget
  static async approveBudget(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const { budgetId } = req.params;
      const { approval_notes } = req.body;

      const budget = await Budget.approveBudget(budgetId, schoolId, userId, approval_notes);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        message: 'Budget approved successfully',
        data: budget
      });

    } catch (error) {
      logger.error('Approve budget error:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving budget'
      });
    }
  }

  // Update actual spending and recalculate utilization
  static async updateActualSpending(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { budgetId } = req.params;

      const budget = await Budget.updateActualSpending(budgetId, schoolId);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        message: 'Budget actual spending updated successfully',
        data: budget
      });

    } catch (error) {
      logger.error('Update actual spending error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating actual spending'
      });
    }
  }

  // Get budget utilization overview
  static async getBudgetUtilization(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const utilization = await Budget.getBudgetUtilization(schoolId, academic_year_id);

      res.json({
        success: true,
        data: utilization
      });

    } catch (error) {
      logger.error('Get budget utilization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching budget utilization'
      });
    }
  }

  // Delete budget
  static async deleteBudget(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { budgetId } = req.params;

      // Check if budget has associated expenses
      const expenseCount = await db('expenses')
        .count('* as count')
        .where('budget_id', budgetId)
        .first();

      if (parseInt(expenseCount.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete budget with associated expenses'
        });
      }

      const deletedRows = await db('budgets')
        .where({ id: budgetId, school_id: schoolId })
        .del();

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        message: 'Budget deleted successfully'
      });

    } catch (error) {
      logger.error('Delete budget error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting budget'
      });
    }
  }

  // Create annual budget with templates
  static async createAnnualBudget(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const { academic_year_id, budget_data } = req.body;

      const budget = await Budget.createAnnualBudget(
        academic_year_id,
        budget_data,
        schoolId,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Annual budget created successfully',
        data: budget
      });

    } catch (error) {
      logger.error('Create annual budget error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating annual budget'
      });
    }
  }
}

module.exports = BudgetController;