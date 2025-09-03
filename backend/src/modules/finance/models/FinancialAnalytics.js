// backend/src/modules/finance/models/FinancialAnalytics.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class FinancialAnalytics {
  static tableName = 'financial_analytics';

  static async create(analyticsData, schoolId) {
    const [analytics] = await db(this.tableName)
      .insert({
        ...analyticsData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return analytics;
  }

  static async generateDailyAnalytics(schoolId, date, academicYearId, termId = null) {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Get previous day for comparison
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);

      const analytics = await this.calculatePeriodAnalytics(
        schoolId,
        startDate,
        endDate,
        'daily',
        academicYearId,
        termId
      );

      // Get previous day analytics for comparison
      const previousAnalytics = await db(this.tableName)
        .where({
          school_id: schoolId,
          period_start: previousDate.toISOString().split('T')[0],
          period_type: 'daily'
        })
        .first();

      if (previousAnalytics) {
        analytics.previous_period_revenue = previousAnalytics.total_payments_received;
        const previousRevenue = parseFloat(previousAnalytics.total_payments_received);
        const currentRevenue = parseFloat(analytics.total_payments_received);
        
        if (previousRevenue > 0) {
          analytics.revenue_growth_rate = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2);
        }
      }

      // Upsert analytics record
      const existing = await db(this.tableName)
        .where({
          school_id: schoolId,
          period_start: startDate.toISOString().split('T')[0],
          period_type: 'daily',
          academic_year_id: academicYearId
        })
        .first();

      if (existing) {
        await db(this.tableName)
          .where('id', existing.id)
          .update({ ...analytics, updated_at: new Date() });
      } else {
        await this.create({
          ...analytics,
          academic_year_id: academicYearId,
          term_id: termId,
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          period_type: 'daily'
        }, schoolId);
      }

      return analytics;

    } catch (error) {
      throw new Error(`Failed to generate daily analytics: ${error.message}`);
    }
  }

  static async generateMonthlyAnalytics(schoolId, year, month, academicYearId, termId = null) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const analytics = await this.calculatePeriodAnalytics(
        schoolId,
        startDate,
        endDate,
        'monthly',
        academicYearId,
        termId
      );

      // Get previous month for comparison
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const previousAnalytics = await db(this.tableName)
        .where({
          school_id: schoolId,
          period_start: new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0],
          period_type: 'monthly'
        })
        .first();

      if (previousAnalytics) {
        analytics.previous_period_revenue = previousAnalytics.total_payments_received;
        const previousRevenue = parseFloat(previousAnalytics.total_payments_received);
        const currentRevenue = parseFloat(analytics.total_payments_received);
        
        if (previousRevenue > 0) {
          analytics.revenue_growth_rate = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2);
        }
      }

      // Upsert analytics record
      await this.upsertAnalytics({
        ...analytics,
        academic_year_id: academicYearId,
        term_id: termId,
        period_start: startDate.toISOString().split('T')[0],
        period_end: endDate.toISOString().split('T')[0],
        period_type: 'monthly'
      }, schoolId);

      return analytics;

    } catch (error) {
      throw new Error(`Failed to generate monthly analytics: ${error.message}`);
    }
  }

  static async calculatePeriodAnalytics(schoolId, startDate, endDate, periodType, academicYearId, termId) {
    // Revenue analytics
    const revenueQuery = db('student_fees')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.created_at', '>=', startDate.toISOString())
      .where('student_fees.created_at', '<=', endDate.toISOString());

    if (academicYearId) {
      revenueQuery.where('student_fees.academic_year_id', academicYearId);
    }

    const revenueStats = await revenueQuery
      .select([
        db.raw('SUM(final_amount) as total_billed'),
        db.raw('SUM(amount_paid) as total_paid'),
        db.raw('SUM(balance) as outstanding'),
        db.raw('SUM(CASE WHEN is_overdue = true THEN balance ELSE 0 END) as overdue'),
        db.raw('COUNT(DISTINCT student_id) as students_billed'),
        db.raw('COUNT(CASE WHEN status = \'paid\' THEN 1 END) as students_paid'),
        db.raw('COUNT(CASE WHEN balance > 0 THEN 1 END) as students_with_balance'),
        db.raw('COUNT(CASE WHEN is_overdue = true THEN 1 END) as students_overdue'),
        db.raw('SUM(discount_amount) as total_discounts')
      ])
      .first();

    // Payment method breakdown
    const paymentBreakdown = await db('payments')
      .select([
        'payment_method',
        db.raw('SUM(amount) as amount'),
        db.raw('COUNT(*) as count')
      ])
      .where('school_id', schoolId)
      .where('payment_date', '>=', startDate.toISOString().split('T')[0])
      .where('payment_date', '<=', endDate.toISOString().split('T')[0])
      .where('payment_status', 'completed')
      .groupBy('payment_method');

    // Fee category breakdown
    const categoryBreakdown = await db('student_fees')
      .select([
        'fee_categories.name',
        'fee_categories.code',
        db.raw('SUM(student_fees.amount_paid) as amount_paid'),
        db.raw('SUM(student_fees.balance) as balance')
      ])
      .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.updated_at', '>=', startDate.toISOString())
      .where('student_fees.updated_at', '<=', endDate.toISOString())
      .groupBy(['fee_categories.name', 'fee_categories.code']);

    // Transaction analytics
    const transactionStats = await db('payment_transactions')
      .select([
        db.raw('COUNT(*) as total_transactions'),
        db.raw('COUNT(CASE WHEN status = \'success\' THEN 1 END) as successful'),
        db.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed'),
        db.raw('SUM(gateway_fee) as total_fees')
      ])
      .where('school_id', schoolId)
      .where('initiated_at', '>=', startDate.toISOString())
      .where('initiated_at', '<=', endDate.toISOString())
      .first();

    // Build analytics object
    const totalBilled = parseFloat(revenueStats.total_billed || 0);
    const totalPaid = parseFloat(revenueStats.total_paid || 0);
    const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(2) : 0;
    const successRate = transactionStats.total_transactions > 0 ? 
      ((transactionStats.successful / transactionStats.total_transactions) * 100).toFixed(2) : 0;

    return {
      total_fees_billed: totalBilled,
      total_payments_received: totalPaid,
      outstanding_balance: parseFloat(revenueStats.outstanding || 0),
      overdue_amount: parseFloat(revenueStats.overdue || 0),
      collection_rate: parseFloat(collectionRate),
      total_students_billed: parseInt(revenueStats.students_billed || 0),
      students_fully_paid: parseInt(revenueStats.students_paid || 0),
      students_with_balance: parseInt(revenueStats.students_with_balance || 0),
      students_overdue: parseInt(revenueStats.students_overdue || 0),
      payment_method_breakdown: JSON.stringify(paymentBreakdown.reduce((acc, item) => {
        acc[item.payment_method] = parseFloat(item.amount);
        return acc;
      }, {})),
      fee_category_breakdown: JSON.stringify(categoryBreakdown.reduce((acc, item) => {
        acc[item.code] = {
          name: item.name,
          paid: parseFloat(item.amount_paid),
          balance: parseFloat(item.balance)
        };
        return acc;
      }, {})),
      total_transactions: parseInt(transactionStats.total_transactions || 0),
      successful_transactions: parseInt(transactionStats.successful || 0),
      failed_transactions: parseInt(transactionStats.failed || 0),
      transaction_success_rate: parseFloat(successRate),
      total_gateway_fees: parseFloat(transactionStats.total_fees || 0),
      total_discounts_given: parseFloat(revenueStats.total_discounts || 0),
      students_with_discounts: await this.getStudentsWithDiscounts(schoolId, startDate, endDate)
    };
  }

  static async getStudentsWithDiscounts(schoolId, startDate, endDate) {
    const result = await db('student_fees')
      .countDistinct('student_id as count')
      .where('school_id', schoolId)
      .where('discount_amount', '>', 0)
      .where('created_at', '>=', startDate.toISOString())
      .where('created_at', '<=', endDate.toISOString())
      .first();

    return parseInt(result.count || 0);
  }

  static async upsertAnalytics(analyticsData, schoolId) {
    const existing = await db(this.tableName)
      .where({
        school_id: schoolId,
        period_start: analyticsData.period_start,
        period_type: analyticsData.period_type,
        academic_year_id: analyticsData.academic_year_id
      })
      .first();

    if (existing) {
      return await db(this.tableName)
        .where('id', existing.id)
        .update({ ...analyticsData, updated_at: new Date() })
        .returning('*');
    } else {
      return await this.create(analyticsData, schoolId);
    }
  }

  static async getAnalyticsByPeriod(schoolId, periodType, startDate, endDate, academicYearId = null) {
    let query = db(this.tableName)
      .where('school_id', schoolId)
      .where('period_type', periodType)
      .where('period_start', '>=', startDate)
      .where('period_end', '<=', endDate);

    if (academicYearId) {
      query = query.where('academic_year_id', academicYearId);
    }

    return await query.orderBy('period_start', 'asc');
  }

  static async getDashboardMetrics(schoolId, academicYearId, termId = null) {
    // Get current month analytics
    const currentDate = new Date();
    const currentMonth = await this.generateMonthlyAnalytics(
      schoolId,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      academicYearId,
      termId
    );

    // Get year-to-date analytics
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);
    const yearAnalytics = await this.getAnalyticsByPeriod(
      schoolId,
      'monthly',
      yearStart.toISOString().split('T')[0],
      currentDate.toISOString().split('T')[0],
      academicYearId
    );

    // Calculate year-to-date totals
    const ytdTotals = yearAnalytics.reduce((acc, month) => {
      acc.total_revenue += parseFloat(month.total_payments_received);
      acc.total_billed += parseFloat(month.total_fees_billed);
      acc.total_outstanding += parseFloat(month.outstanding_balance);
      return acc;
    }, { total_revenue: 0, total_billed: 0, total_outstanding: 0 });

    return {
      current_month: currentMonth,
      year_to_date: ytdTotals,
      monthly_trend: yearAnalytics.map(month => ({
        month: month.period_start,
        revenue: parseFloat(month.total_payments_received),
        collection_rate: parseFloat(month.collection_rate),
        students_paid: month.students_fully_paid
      }))
    };
  }
}

module.exports = FinancialAnalytics;