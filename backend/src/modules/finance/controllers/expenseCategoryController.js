// backend/src/modules/finance/controllers/expenseCategoryController.js
const ExpenseCategory = require('../models/ExpenseCategory');
const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/connection');

class ExpenseCategoryController {
  // Create new expense category
  static async createCategory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        name,
        code,
        description,
        category_type,
        requires_approval,
        approval_threshold,
        sort_order,
        is_active = true
      } = req.body;

      // Check if category code already exists
      const existingCategories = await ExpenseCategory.findBySchool(schoolId);
      const existingCode = existingCategories.find(c => 
        c.code.toLowerCase() === code.toLowerCase()
      );

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: 'Category code already exists'
        });
      }

      const category = await ExpenseCategory.create({
        name,
        code: code.toUpperCase(),
        description,
        category_type: category_type || 'operating',
        requires_approval: requires_approval || false,
        approval_threshold: approval_threshold || null,
        sort_order: sort_order || 999,
        is_active
      }, schoolId);

      res.status(201).json({
        success: true,
        message: 'Expense category created successfully',
        data: category
      });

    } catch (error) {
      logger.error('Create expense category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating expense category'
      });
    }
  }

  // Get all expense categories for school
  static async getCategories(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { include_inactive = false, category_type } = req.query;

      let categories = await ExpenseCategory.findBySchool(schoolId);

      // Filter by active status
      if (!include_inactive || include_inactive === 'false') {
        categories = categories.filter(category => category.is_active);
      }

      // Filter by category type if provided
      if (category_type) {
        categories = categories.filter(category => category.category_type === category_type);
      }

      // Add usage statistics for each category
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          const usage = await db('expenses')
            .select([
              db.raw('COUNT(*) as total_expenses'),
              db.raw('SUM(amount) as total_amount'),
              db.raw('SUM(amount_paid) as amount_paid'),
              db.raw('COUNT(CASE WHEN approval_status = \'pending\' THEN 1 END) as pending_approval')
            ])
            .where('category_id', category.id)
            .where('school_id', schoolId)
            .first();

          return {
            ...category,
            usage_statistics: {
              total_expenses: parseInt(usage.total_expenses || 0),
              total_amount: parseFloat(usage.total_amount || 0),
              amount_paid: parseFloat(usage.amount_paid || 0),
              pending_approval: parseInt(usage.pending_approval || 0),
              utilization_rate: parseFloat(usage.total_amount) > 0 ? 
                ((parseFloat(usage.amount_paid) / parseFloat(usage.total_amount)) * 100).toFixed(2) : 0
            }
          };
        })
      );

      res.json({
        success: true,
        data: enrichedCategories,
        count: enrichedCategories.length
      });

    } catch (error) {
      logger.error('Get expense categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expense categories'
      });
    }
  }

  // Get single category by ID
  static async getCategoryById(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { categoryId } = req.params;

      const categories = await ExpenseCategory.findBySchool(schoolId);
      const category = categories.find(c => c.id === categoryId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Expense category not found'
        });
      }

      // Get recent expenses in this category
      const recentExpenses = await db('expenses')
        .select([
          'id', 'expense_reference', 'description', 'amount', 
          'expense_date', 'approval_status', 'payment_status'
        ])
        .where('category_id', categoryId)
        .where('school_id', schoolId)
        .orderBy('expense_date', 'desc')
        .limit(10);

      // Get monthly spending trend for this category
      const monthlyTrend = await db('expenses')
        .select([
          db.raw('DATE_TRUNC(\'month\', expense_date) as month'),
          db.raw('SUM(amount) as total_amount'),
          db.raw('COUNT(*) as expense_count')
        ])
        .where('category_id', categoryId)
        .where('school_id', schoolId)
        .where('expense_date', '>=', db.raw('NOW() - INTERVAL \'12 months\''))
        .groupBy(db.raw('DATE_TRUNC(\'month\', expense_date)'))
        .orderBy('month', 'asc');

      const enrichedCategory = {
        ...category,
        recent_expenses: recentExpenses,
        monthly_trend: monthlyTrend.map(trend => ({
          month: trend.month,
          total_amount: parseFloat(trend.total_amount),
          expense_count: parseInt(trend.expense_count)
        }))
      };

      res.json({
        success: true,
        data: enrichedCategory
      });

    } catch (error) {
      logger.error('Get expense category by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expense category'
      });
    }
  }

  // Update expense category
  static async updateCategory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { categoryId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.school_id;
      delete updateData.created_at;

      // Check if new code conflicts with existing categories
      if (updateData.code) {
        const existingCategories = await ExpenseCategory.findBySchool(schoolId);
        const codeConflict = existingCategories.find(c => 
          c.code.toLowerCase() === updateData.code.toLowerCase() && c.id !== categoryId
        );

        if (codeConflict) {
          return res.status(409).json({
            success: false,
            message: 'Category code already exists'
          });
        }

        updateData.code = updateData.code.toUpperCase();
      }

      updateData.updated_at = new Date();

      const [category] = await db('expense_categories')
        .where({ id: categoryId, school_id: schoolId })
        .update(updateData)
        .returning('*');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Expense category not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense category updated successfully',
        data: category
      });

    } catch (error) {
      logger.error('Update expense category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating expense category'
      });
    }
  }

  // Deactivate category (soft delete)
  static async deactivateCategory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { categoryId } = req.params;

      // Check if category has active expenses
      const activeExpenses = await db('expenses')
        .count('* as count')
        .where('category_id', categoryId)
        .where('school_id', schoolId)
        .whereIn('approval_status', ['pending', 'approved'])
        .where('payment_status', '!=', 'paid')
        .first();

      if (parseInt(activeExpenses.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate category with active expenses'
        });
      }

      const [category] = await db('expense_categories')
        .where({ id: categoryId, school_id: schoolId })
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .returning('*');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Expense category not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense category deactivated successfully',
        data: category
      });

    } catch (error) {
      logger.error('Deactivate expense category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating expense category'
      });
    }
  }

  // Reactivate category
  static async reactivateCategory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { categoryId } = req.params;

      const [category] = await db('expense_categories')
        .where({ id: categoryId, school_id: schoolId })
        .update({
          is_active: true,
          updated_at: new Date()
        })
        .returning('*');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Expense category not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense category reactivated successfully',
        data: category
      });

    } catch (error) {
      logger.error('Reactivate expense category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error reactivating expense category'
      });
    }
  }

  // Initialize default categories for a new school
  static async initializeDefaultCategories(req, res) {
    try {
      const schoolId = req.user.schoolId;

      // Check if categories already exist
      const existingCategories = await ExpenseCategory.findBySchool(schoolId);
      
      if (existingCategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'School already has expense categories configured'
        });
      }

      const categories = await ExpenseCategory.initializeDefaultCategories(schoolId);

      res.json({
        success: true,
        message: `${categories.length} default expense categories created successfully`,
        data: categories
      });

    } catch (error) {
      logger.error('Initialize default categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default categories'
      });
    }
  }

  // Reorder categories
  static async reorderCategories(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { category_orders } = req.body; // Array of {id, sort_order}

      if (!Array.isArray(category_orders)) {
        return res.status(400).json({
          success: false,
          message: 'category_orders must be an array'
        });
      }

      // Update sort orders in batch
      const updatePromises = category_orders.map(({ id, sort_order }) =>
        db('expense_categories')
          .where({ id, school_id: schoolId })
          .update({ sort_order, updated_at: new Date() })
      );

      await Promise.all(updatePromises);

      // Fetch updated categories
      const updatedCategories = await ExpenseCategory.findBySchool(schoolId);

      res.json({
        success: true,
        message: 'Categories reordered successfully',
        data: updatedCategories
      });

    } catch (error) {
      logger.error('Reorder categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error reordering categories'
      });
    }
  }

  // Get category statistics
  static async getCategoryStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const statistics = await db('expense_categories')
        .select([
          'expense_categories.id',
          'expense_categories.name',
          'expense_categories.code',
          'expense_categories.category_type',
          db.raw('COUNT(expenses.id) as expense_count'),
          db.raw('COALESCE(SUM(expenses.amount), 0) as total_amount'),
          db.raw('COALESCE(SUM(expenses.amount_paid), 0) as amount_paid'),
          db.raw('COALESCE(AVG(expenses.amount), 0) as avg_expense_amount')
        ])
        .leftJoin('expenses', function() {
          this.on('expense_categories.id', 'expenses.category_id')
              .andOn('expenses.school_id', db.raw('?', [schoolId]))
              .andOn('expenses.expense_date', '>=', db.raw('?', [start_date]))
              .andOn('expenses.expense_date', '<=', db.raw('?', [end_date]));
        })
        .where('expense_categories.school_id', schoolId)
        .where('expense_categories.is_active', true)
        .groupBy(['expense_categories.id', 'expense_categories.name', 'expense_categories.code', 'expense_categories.category_type'])
        .orderBy('total_amount', 'desc');

      const enrichedStats = statistics.map(stat => ({
        ...stat,
        expense_count: parseInt(stat.expense_count),
        total_amount: parseFloat(stat.total_amount),
        amount_paid: parseFloat(stat.amount_paid),
        avg_expense_amount: parseFloat(stat.avg_expense_amount),
        payment_rate: parseFloat(stat.total_amount) > 0 ? 
          ((parseFloat(stat.amount_paid) / parseFloat(stat.total_amount)) * 100).toFixed(2) : 0
      }));

      const totals = {
        total_categories: enrichedStats.length,
        total_expenses: enrichedStats.reduce((sum, s) => sum + s.expense_count, 0),
        total_amount: enrichedStats.reduce((sum, s) => sum + s.total_amount, 0),
        total_paid: enrichedStats.reduce((sum, s) => sum + s.amount_paid, 0)
      };

      res.json({
        success: true,
        data: {
          category_statistics: enrichedStats,
          summary: totals,
          period: { start_date, end_date }
        }
      });

    } catch (error) {
      logger.error('Get category statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category statistics'
      });
    }
  }
}

module.exports = ExpenseCategoryController;