// backend/src/modules/finance/models/Budget.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Budget {
  static tableName = 'budgets';

  static async create(budgetData, schoolId) {
    const [budget] = await db(this.tableName)
      .insert({
        ...budgetData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return budget;
  }

  static async createAnnualBudget(academicYearId, budgetData, schoolId, createdBy) {
    try {
      const budget = await this.create({
        academic_year_id: academicYearId,
        budget_name: budgetData.budget_name,
        description: budgetData.description,
        budget_type: budgetData.budget_type || 'revenue',
        start_date: budgetData.start_date,
        end_date: budgetData.end_date,
        period_type: 'yearly',
        total_budgeted_amount: budgetData.total_budgeted_amount,
        budget_items: JSON.stringify(budgetData.budget_items || []),
        monthly_breakdown: JSON.stringify(budgetData.monthly_breakdown || {}),
        alert_threshold: budgetData.alert_threshold || 80,
        created_by: createdBy
      }, schoolId);

      return budget;

    } catch (error) {
      throw new Error(`Failed to create annual budget: ${error.message}`);
    }
  }

  static async findBySchool(schoolId, academicYearId = null, budgetType = null) {
    let query = db(this.tableName)
      .select([
        'budgets.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        'approver.first_name as approver_first_name',
        'approver.last_name as approver_last_name'
      ])
      .leftJoin('users', 'budgets.created_by', 'users.id')
      .leftJoin('users as approver', 'budgets.approved_by', 'approver.id')
      .where('budgets.school_id', schoolId);

    if (academicYearId) {
      query = query.where('budgets.academic_year_id', academicYearId);
    }

    if (budgetType) {
      query = query.where('budgets.budget_type', budgetType);
    }

    return await query.orderBy('budgets.created_at', 'desc');
  }

  static async updateActualSpending(budgetId, schoolId) {
    try {
      const budget = await db(this.tableName)
        .where({ id: budgetId, school_id: schoolId })
        .first();

      if (!budget) {
        throw new Error('Budget not found');
      }

      // Calculate actual spending from expenses
      const actualSpending = await db('expenses')
        .select([
          'category_id',
          db.raw('SUM(amount) as total_amount')
        ])
        .where('budget_id', budgetId)
        .where('approval_status', 'approved')
        .where('payment_status', 'paid')
        .groupBy('category_id');

      const totalActual = actualSpending.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
      const budgetedAmount = parseFloat(budget.total_budgeted_amount);
      const variance = budgetedAmount - totalActual;
      const variancePercentage = budgetedAmount > 0 ? ((variance / budgetedAmount) * 100).toFixed(2) : 0;
      const utilizationRate = budgetedAmount > 0 ? ((totalActual / budgetedAmount) * 100).toFixed(2) : 0;

      // Update budget with actual figures
      const [updatedBudget] = await db(this.tableName)
        .where({ id: budgetId })
        .update({
          total_actual_amount: totalActual,
          variance_amount: variance,
          variance_percentage: parseFloat(variancePercentage),
          utilization_rate: parseFloat(utilizationRate),
          actual_spending: JSON.stringify(actualSpending),
          updated_at: new Date()
        })
        .returning('*');

      return updatedBudget;

    } catch (error) {
      throw new Error(`Failed to update actual spending: ${error.message}`);
    }
  }

  static async approveBudget(budgetId, schoolId, approvedBy, approvalNotes) {
    const [budget] = await db(this.tableName)
      .where({ id: budgetId, school_id: schoolId })
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date(),
        approval_notes: approvalNotes,
        updated_at: new Date()
      })
      .returning('*');

    return budget;
  }

  static async getBudgetUtilization(schoolId, academicYearId) {
    const budgets = await this.findBySchool(schoolId, academicYearId);
    
    const utilization = {
      total_budgeted: 0,
      total_spent: 0,
      overall_utilization: 0,
      by_category: {},
      alerts: []
    };

    for (const budget of budgets) {
      const budgetedAmount = parseFloat(budget.total_budgeted_amount);
      const actualAmount = parseFloat(budget.total_actual_amount);
      
      utilization.total_budgeted += budgetedAmount;
      utilization.total_spent += actualAmount;

      // Check for budget alerts
      const utilizationRate = parseFloat(budget.utilization_rate);
      if (utilizationRate > budget.alert_threshold) {
        utilization.alerts.push({
          budget_id: budget.id,
          budget_name: budget.budget_name,
          utilization_rate: utilizationRate,
          threshold: budget.alert_threshold,
          type: utilizationRate > 100 ? 'over_budget' : 'approaching_limit'
        });
      }

      utilization.by_category[budget.budget_type] = {
        budgeted: budgetedAmount,
        spent: actualAmount,
        utilization: utilizationRate
      };
    }

    if (utilization.total_budgeted > 0) {
      utilization.overall_utilization = ((utilization.total_spent / utilization.total_budgeted) * 100).toFixed(2);
    }

    return utilization;
  }
}

module.exports = Budget;