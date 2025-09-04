// backend/src/modules/finance/services/financialReportingService.js
const db = require('../../../core/database/connection');
const FinancialAnalytics = require('../models/FinancialAnalytics');
const Budget = require('../models/Budget');
const logger = require('../../../core/utils/logger');
const crypto = require('crypto');

class FinancialReportingService {
  static async generatePeriodReport(schoolId, academicYearId, reportParams) {
    try {
      const {
        period_type = 'monthly',
        start_date,
        end_date,
        include_comparisons = true,
        include_forecasting = false,
        granular_breakdown = false
      } = reportParams;

      const report = {
        metadata: {
          school_id: schoolId,
          academic_year_id: academicYearId,
          report_type: 'period_financial_report',
          period_type,
          date_range: { start_date, end_date },
          generated_at: new Date().toISOString(),
          report_id: crypto.randomUUID()
        }
      };

      // Core financial metrics
      report.executive_summary = await this.generateExecutiveSummary(
        schoolId, academicYearId, start_date, end_date
      );

      // Revenue analysis
      report.revenue_analysis = await this.generateRevenueAnalysis(
        schoolId, academicYearId, start_date, end_date, granular_breakdown
      );

      // Expense analysis
      report.expense_analysis = await this.generateExpenseAnalysis(
        schoolId, start_date, end_date, granular_breakdown
      );

      // Student payment analytics
      report.student_analytics = await this.generateStudentPaymentAnalytics(
        schoolId, academicYearId, start_date, end_date
      );

      // Cash flow analysis
      report.cash_flow_analysis = await this.generateCashFlowAnalysis(
        schoolId, start_date, end_date
      );

      // Budget performance
      report.budget_performance = await this.generateBudgetPerformanceAnalysis(
        schoolId, academicYearId, start_date, end_date
      );

      // Comparative analysis
      if (include_comparisons) {
        report.comparative_analysis = await this.generateComparativeAnalysis(
          schoolId, academicYearId, period_type, start_date, end_date
        );
      }

      // Forecasting
      if (include_forecasting) {
        report.forecasting = await this.generateAdvancedForecasting(
          schoolId, academicYearId, period_type
        );
      }

      // Key insights and recommendations
      report.insights = await this.generateKeyInsights(report);
      report.recommendations = await this.generateActionableRecommendations(report);

      return report;

    } catch (error) {
      logger.error('Generate period report error:', error);
      throw error;
    }
  }

  static async generateExecutiveSummary(schoolId, academicYearId, startDate, endDate) {
    // Total revenue metrics
    const revenueMetrics = await db('student_fees')
      .select([
        db.raw('SUM(final_amount) as total_billed'),
        db.raw('SUM(amount_paid) as total_collected'),
        db.raw('SUM(balance) as total_outstanding'),
        db.raw('SUM(discount_amount) as total_discounts'),
        db.raw('COUNT(DISTINCT student_id) as total_students'),
        db.raw('COUNT(CASE WHEN status = \'paid\' THEN 1 END) as students_fully_paid'),
        db.raw('AVG(final_amount) as avg_fee_per_student')
      ])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .first();

    // Total expenses
    const expenseMetrics = await db('expenses')
      .select([
        db.raw('SUM(amount) as total_expenses'),
        db.raw('SUM(amount_paid) as expenses_paid'),
        db.raw('COUNT(*) as total_expense_items'),
        db.raw('COUNT(CASE WHEN approval_status = \'approved\' THEN 1 END) as approved_expenses')
      ])
      .where('school_id', schoolId)
      .where('expense_date', '>=', startDate)
      .where('expense_date', '<=', endDate)
      .first();

    // Payment processing metrics
    const paymentMetrics = await db('payment_transactions')
      .select([
        db.raw('COUNT(*) as total_transactions'),
        db.raw('COUNT(CASE WHEN status = \'success\' THEN 1 END) as successful_transactions'),
        db.raw('SUM(gateway_fee) as total_gateway_fees'),
        db.raw('AVG(processing_time_seconds) as avg_processing_time')
      ])
      .where('school_id', schoolId)
      .where('initiated_at', '>=', startDate)
      .where('initiated_at', '<=', endDate)
      .first();

    // Calculate key ratios
    const totalBilled = parseFloat(revenueMetrics.total_billed || 0);
    const totalCollected = parseFloat(revenueMetrics.total_collected || 0);
    const totalExpensesPaid = parseFloat(expenseMetrics.expenses_paid || 0);
    
    const collectionEfficiency = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    const netIncome = totalCollected - totalExpensesPaid;
    const profitMargin = totalCollected > 0 ? (netIncome / totalCollected) * 100 : 0;
    const expenseRatio = totalCollected > 0 ? (totalExpensesPaid / totalCollected) * 100 : 0;

    return {
      financial_highlights: {
        total_revenue: totalCollected,
        total_expenses: totalExpensesPaid,
        net_income: netIncome,
        profit_margin: parseFloat(profitMargin.toFixed(2))
      },
      operational_metrics: {
        students_served: parseInt(revenueMetrics.total_students || 0),
        collection_efficiency: parseFloat(collectionEfficiency.toFixed(2)),
        average_fee_per_student: parseFloat(revenueMetrics.avg_fee_per_student || 0),
        payment_completion_rate: revenueMetrics.total_students > 0 ? 
          (revenueMetrics.students_fully_paid / revenueMetrics.total_students * 100).toFixed(2) : 0
      },
      financial_ratios: {
        expense_ratio: parseFloat(expenseRatio.toFixed(2)),
        outstanding_ratio: totalBilled > 0 ? 
          ((parseFloat(revenueMetrics.total_outstanding) / totalBilled) * 100).toFixed(2) : 0,
        discount_ratio: totalBilled > 0 ? 
          ((parseFloat(revenueMetrics.total_discounts) / totalBilled) * 100).toFixed(2) : 0
      },
      transaction_performance: {
        total_transactions: parseInt(paymentMetrics.total_transactions || 0),
        success_rate: paymentMetrics.total_transactions > 0 ? 
          ((paymentMetrics.successful_transactions / paymentMetrics.total_transactions) * 100).toFixed(2) : 0,
        average_processing_time: parseFloat(paymentMetrics.avg_processing_time || 0).toFixed(2),
        total_gateway_costs: parseFloat(paymentMetrics.total_gateway_fees || 0)
      }
    };
  }

  static async generateRevenueAnalysis(schoolId, academicYearId, startDate, endDate, granular = false) {
    // Fee category breakdown
    const categoryBreakdown = await db('student_fees')
      .select([
        'fee_categories.name as category_name',
        'fee_categories.code as category_code',
        db.raw('SUM(student_fees.final_amount) as total_billed'),
        db.raw('SUM(student_fees.amount_paid) as total_collected'),
        db.raw('SUM(student_fees.balance) as total_outstanding'),
        db.raw('COUNT(DISTINCT student_fees.student_id) as students_count'),
        db.raw('AVG(student_fees.final_amount) as avg_amount_per_student')
      ])
      .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.academic_year_id', academicYearId)
      .where('student_fees.created_at', '>=', startDate)
      .where('student_fees.created_at', '<=', endDate)
      .groupBy(['fee_categories.id', 'fee_categories.name', 'fee_categories.code'])
      .orderBy('total_collected', 'desc');

    // Payment method analysis
    const paymentMethodBreakdown = await db('payments')
      .select([
        'payment_method',
        db.raw('COUNT(*) as transaction_count'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('AVG(amount) as avg_transaction_amount'),
        db.raw('MIN(amount) as min_transaction'),
        db.raw('MAX(amount) as max_transaction')
      ])
      .where('school_id', schoolId)
      .where('payment_status', 'completed')
      .where('payment_date', '>=', startDate)
      .where('payment_date', '<=', endDate)
      .groupBy('payment_method')
      .orderBy('total_amount', 'desc');

    // Temporal revenue patterns
    let temporalAnalysis = null;
    if (granular) {
      temporalAnalysis = await db('payments')
        .select([
          db.raw('DATE(payment_date) as payment_day'),
          db.raw('EXTRACT(DOW FROM payment_date) as day_of_week'),
          db.raw('EXTRACT(HOUR FROM created_at) as payment_hour'),
          db.raw('SUM(amount) as daily_revenue'),
          db.raw('COUNT(*) as daily_transactions'),
          db.raw('AVG(amount) as avg_transaction_amount')
        ])
        .where('school_id', schoolId)
        .where('payment_status', 'completed')
        .where('payment_date', '>=', startDate)
        .where('payment_date', '<=', endDate)
        .groupBy([db.raw('DATE(payment_date)'), db.raw('EXTRACT(DOW FROM payment_date)'), db.raw('EXTRACT(HOUR FROM created_at)')])
        .orderBy('payment_day', 'asc');
    }

    // Class/Grade level analysis
    const gradeAnalysis = await db('student_fees')
      .select([
        'classes.name as class_name',
        'classes.grade_level',
        db.raw('SUM(student_fees.final_amount) as total_billed'),
        db.raw('SUM(student_fees.amount_paid) as total_collected'),
        db.raw('COUNT(DISTINCT student_fees.student_id) as students_count'),
        db.raw('AVG(student_fees.final_amount) as avg_fee_per_student')
      ])
      .join('students', 'student_fees.student_id', 'students.id')
      .join('classes', 'students.current_class_id', 'classes.id')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.academic_year_id', academicYearId)
      .where('student_fees.created_at', '>=', startDate)
      .where('student_fees.created_at', '<=', endDate)
      .groupBy(['classes.id', 'classes.name', 'classes.grade_level'])
      .orderBy('total_collected', 'desc');

    return {
      category_breakdown: categoryBreakdown.map(cat => ({
        category: cat.category_name,
        code: cat.category_code,
        total_billed: parseFloat(cat.total_billed),
        total_collected: parseFloat(cat.total_collected),
        collection_rate: parseFloat(cat.total_billed) > 0 ? 
          ((parseFloat(cat.total_collected) / parseFloat(cat.total_billed)) * 100).toFixed(2) : 0,
        students_count: parseInt(cat.students_count),
        avg_per_student: parseFloat(cat.avg_amount_per_student)
      })),
      payment_methods: paymentMethodBreakdown.map(method => ({
        method: method.payment_method,
        transaction_count: parseInt(method.transaction_count),
        total_amount: parseFloat(method.total_amount),
        avg_transaction: parseFloat(method.avg_transaction_amount),
        market_share: 0 // Will be calculated after getting totals
      })),
      grade_level_performance: gradeAnalysis.map(grade => ({
        class_name: grade.class_name,
        grade_level: grade.grade_level,
        total_revenue: parseFloat(grade.total_collected),
        students_count: parseInt(grade.students_count),
        avg_revenue_per_student: parseFloat(grade.avg_fee_per_student),
        collection_rate: parseFloat(grade.total_billed) > 0 ? 
          ((parseFloat(grade.total_collected) / parseFloat(grade.total_billed)) * 100).toFixed(2) : 0
      })),
      temporal_patterns: temporalAnalysis
    };
  }

  static async generateExpenseAnalysis(schoolId, startDate, endDate, granular = false) {
    // Expense category breakdown
    const categoryBreakdown = await db('expenses')
      .select([
        'expense_categories.name as category_name',
        'expense_categories.code as category_code',
        'expense_categories.category_type',
        db.raw('SUM(expenses.amount) as total_budgeted'),
        db.raw('SUM(expenses.amount_paid) as total_spent'),
        db.raw('COUNT(*) as expense_count'),
        db.raw('AVG(expenses.amount) as avg_expense_amount'),
        db.raw('COUNT(CASE WHEN expenses.approval_status = \'approved\' THEN 1 END) as approved_count')
      ])
      .join('expense_categories', 'expenses.category_id', 'expense_categories.id')
      .where('expenses.school_id', schoolId)
      .where('expenses.expense_date', '>=', startDate)
      .where('expenses.expense_date', '<=', endDate)
      .groupBy(['expense_categories.id', 'expense_categories.name', 'expense_categories.code', 'expense_categories.category_type'])
      .orderBy('total_spent', 'desc');

    // Monthly expense trends
    const monthlyTrends = await db('expenses')
      .select([
        db.raw('DATE_TRUNC(\'month\', expense_date) as month'),
        db.raw('SUM(expenses.amount) as total_budgeted'),
        db.raw('SUM(expenses.amount_paid) as total_spent'),
        db.raw('COUNT(*) as expense_count'),
        db.raw('AVG(expenses.amount) as avg_expense_amount'),
        db.raw('COUNT(CASE WHEN expenses.approval_status = \'approved\' THEN 1 END) as approved_count')
      ])
      .where('expenses.school_id', schoolId)
      .where('expenses.expense_date', '>=', startDate)
      .where('expenses.expense_date', '<=', endDate)
      .groupBy('month')
      .orderBy('month', 'asc');

    return {
      category_breakdown: categoryBreakdown.map(cat => ({
        category: cat.category_name,
        code: cat.category_code,
        total_budgeted: parseFloat(cat.total_budgeted),
        total_spent: parseFloat(cat.total_spent),
        expense_count: parseInt(cat.expense_count),
        avg_expense_amount: parseFloat(cat.avg_expense_amount),
        approved_count: parseInt(cat.approved_count)
      })),
      monthly_trends: monthlyTrends.map(trend => ({
        month: trend.month,
        total_budgeted: parseFloat(trend.total_budgeted),
        total_spent: parseFloat(trend.total_spent),
        expense_count: parseInt(trend.expense_count),
        avg_expense_amount: parseFloat(trend.avg_expense_amount),
        approved_count: parseInt(trend.approved_count)
      }))
    };
  }
}

module.exports = FinancialReportingService; 