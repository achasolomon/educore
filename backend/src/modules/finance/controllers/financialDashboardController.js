// backend/src/modules/finance/controllers/financialDashboardController.js
const FinancialAnalytics = require('../models/FinancialAnalytics');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const StudentFee = require('../models/StudentFee');
const logger = require('../../../core/utils/logger');

class FinancialDashboardController {
  // Get comprehensive financial dashboard
  static async getDashboard(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, term_id } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      // Get dashboard metrics
      const metrics = await FinancialAnalytics.getDashboardMetrics(
        schoolId,
        academic_year_id,
        term_id
      );

      // Get budget utilization
      const budgetUtilization = await Budget.getBudgetUtilization(schoolId, academic_year_id);

      // Get recent transactions
      const recentPayments = await Payment.findBySchool(schoolId, {
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_status: 'completed'
      });

      // Get outstanding fees summary
      const outstandingFees = await StudentFee.getOutstandingFees(schoolId, {
        academic_year_id
      });

      // Calculate key performance indicators
      const kpis = {
        total_revenue_ytd: metrics.year_to_date.total_revenue,
        collection_rate: metrics.current_month.collection_rate,
        outstanding_amount: metrics.year_to_date.total_outstanding,
        budget_utilization: budgetUtilization.overall_utilization,
        revenue_growth: metrics.current_month.revenue_growth_rate || 0
      };

      // Get alerts and notifications
      const alerts = [];
      
      // Budget alerts
      budgetUtilization.alerts.forEach(alert => {
        alerts.push({
          type: 'budget_alert',
          severity: alert.type === 'over_budget' ? 'critical' : 'warning',
          message: `Budget ${alert.budget_name} is at ${alert.utilization_rate}% utilization`,
          data: alert
        });
      });

      // Low collection rate alert
      if (parseFloat(metrics.current_month.collection_rate) < 75) {
        alerts.push({
          type: 'collection_rate',
          severity: 'warning',
          message: `Collection rate is low at ${metrics.current_month.collection_rate}%`,
          data: { collection_rate: metrics.current_month.collection_rate }
        });
      }

      res.json({
        success: true,
        data: {
          kpis,
          metrics,
          budget_utilization: budgetUtilization,
          recent_payments: recentPayments.slice(0, 10),
          outstanding_summary: {
            total_amount: outstandingFees.reduce((sum, fee) => sum + parseFloat(fee.balance), 0),
            student_count: outstandingFees.length,
            overdue_count: outstandingFees.filter(fee => fee.is_overdue).length
          },
          alerts
        }
      });

    } catch (error) {
      logger.error('Get financial dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching financial dashboard'
      });
    }
  }

  // Generate financial analytics for period
  static async generateAnalytics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { period_type, date, academic_year_id, term_id } = req.body;

      let analytics;

      switch (period_type) {
        case 'daily':
          analytics = await FinancialAnalytics.generateDailyAnalytics(
            schoolId,
            date,
            academic_year_id,
            term_id
          );
          break;
        case 'monthly':
          const [year, month] = date.split('-').map(n => parseInt(n));
          analytics = await FinancialAnalytics.generateMonthlyAnalytics(
            schoolId,
            year,
            month,
            academic_year_id,
            term_id
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid period type. Use daily or monthly.'
          });
      }

      res.json({
        success: true,
        message: `${period_type} analytics generated successfully`,
        data: analytics
      });

    } catch (error) {
      logger.error('Generate analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating analytics'
      });
    }
  }

  // Get revenue trends
  static async getRevenueTrends(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        period_type = 'monthly',
        start_date,
        end_date,
        academic_year_id 
      } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const analytics = await FinancialAnalytics.getAnalyticsByPeriod(
        schoolId,
        period_type,
        start_date,
        end_date,
        academic_year_id
      );

      const trends = analytics.map(record => ({
        period: record.period_start,
        revenue: parseFloat(record.total_payments_received),
        fees_billed: parseFloat(record.total_fees_billed),
        collection_rate: parseFloat(record.collection_rate),
        outstanding: parseFloat(record.outstanding_balance),
        students_paid: record.students_fully_paid,
        growth_rate: parseFloat(record.revenue_growth_rate || 0)
      }));

      res.json({
        success: true,
        data: {
          period_type,
          trends,
          summary: {
            total_periods: trends.length,
            total_revenue: trends.reduce((sum, t) => sum + t.revenue, 0),
            avg_collection_rate: trends.reduce((sum, t) => sum + t.collection_rate, 0) / trends.length,
            highest_revenue: Math.max(...trends.map(t => t.revenue)),
            lowest_revenue: Math.min(...trends.map(t => t.revenue))
          }
        }
      });

    } catch (error) {
      logger.error('Get revenue trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching revenue trends'
      });
    }
  }

  // Get financial summary report
  static async getFinancialSummary(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, start_date, end_date } = req.query;

      if (!academic_year_id && (!start_date || !end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Either academic year ID or date range is required'
        });
      }

      // Get revenue summary
      let revenueQuery = db('student_fees')
        .select([
          db.raw('SUM(final_amount) as total_billed'),
          db.raw('SUM(amount_paid) as total_collected'),
          db.raw('SUM(balance) as total_outstanding'),
          db.raw('SUM(discount_amount) as total_discounts'),
          db.raw('COUNT(DISTINCT student_id) as students_billed'),
          db.raw('COUNT(CASE WHEN status = \'paid\' THEN 1 END) as students_fully_paid')
        ])
        .where('school_id', schoolId);

      if (academic_year_id) {
        revenueQuery = revenueQuery.where('academic_year_id', academic_year_id);
      } else {
        revenueQuery = revenueQuery
          .where('created_at', '>=', start_date)
          .where('created_at', '<=', end_date);
      }

      const revenue = await revenueQuery.first();

      // Get expense summary
      let expenseQuery = db('expenses')
        .select([
          db.raw('SUM(amount) as total_expenses'),
          db.raw('SUM(amount_paid) as expenses_paid'),
          db.raw('COUNT(*) as expense_count'),
          db.raw('COUNT(CASE WHEN approval_status = \'pending\' THEN 1 END) as pending_approval')
        ])
        .where('school_id', schoolId);

      if (start_date && end_date) {
        expenseQuery = expenseQuery
          .where('expense_date', '>=', start_date)
          .where('expense_date', '<=', end_date);
      }

      const expenses = await expenseQuery.first();

      // Calculate key metrics
      const totalRevenue = parseFloat(revenue.total_collected || 0);
      const totalExpenses = parseFloat(expenses.expenses_paid || 0);
      const netIncome = totalRevenue - totalExpenses;
      const collectionRate = parseFloat(revenue.total_billed) > 0 ? 
        ((parseFloat(revenue.total_collected) / parseFloat(revenue.total_billed)) * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          revenue_summary: {
            total_billed: parseFloat(revenue.total_billed || 0),
            total_collected: parseFloat(revenue.total_collected || 0),
            total_outstanding: parseFloat(revenue.total_outstanding || 0),
            total_discounts: parseFloat(revenue.total_discounts || 0),
            students_billed: parseInt(revenue.students_billed || 0),
            students_fully_paid: parseInt(revenue.students_fully_paid || 0),
            collection_rate: parseFloat(collectionRate)
          },
          expense_summary: {
            total_expenses: parseFloat(expenses.total_expenses || 0),
            expenses_paid: parseFloat(expenses.expenses_paid || 0),
            expense_count: parseInt(expenses.expense_count || 0),
            pending_approval: parseInt(expenses.pending_approval || 0)
          },
          financial_position: {
            total_revenue: totalRevenue,
            total_expenses: totalExpenses,
            net_income: netIncome,
            profit_margin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0
          }
        }
      });

    } catch (error) {
      logger.error('Get financial summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating financial summary'
      });
    }
  }
}

module.exports = FinancialDashboardController