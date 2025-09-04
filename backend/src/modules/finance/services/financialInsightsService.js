// backend/src/modules/finance/services/financialInsightsService.js
const db = require('../../../core/database/connection');
const logger = require('../../../core/utils/logger');
const cache = require('../../../core/utils/cache');

class FinancialInsightsService {
  static async generateIntelligentInsights(schoolId, academicYearId, termId = null) {
    try {
      const insights = {
        performance_insights: await this.analyzePerformanceInsights(schoolId, academicYearId, termId),
        risk_assessments: await this.performRiskAssessment(schoolId, academicYearId),
        opportunity_insights: await this.identifyOpportunities(schoolId, academicYearId, termId),
        behavioral_insights: await this.analyzeStudentBehavior(schoolId, academicYearId),
        predictive_insights: await this.generatePredictiveInsights(schoolId, academicYearId),
        competitive_insights: await this.generateBenchmarkInsights(schoolId, academicYearId),
        operational_insights: await this.analyzeOperationalEfficiency(schoolId, academicYearId)
      };

      return {
        insights,
        summary: await this.generateInsightsSummary(insights),
        priority_actions: await this.prioritizeActionItems(insights),
        confidence_scores: this.calculateConfidenceScores(insights)
      };

    } catch (error) {
      logger.error('Generate intelligent insights error:', error);
      throw error;
    }
  }

  static async analyzePerformanceInsights(schoolId, academicYearId, termId) {
    // Collection Performance Analysis
    const collectionPerformance = await db('financial_analytics')
      .select([
        db.raw('AVG(collection_rate) as avg_collection_rate'),
        db.raw('STDDEV(collection_rate) as collection_volatility'),
        db.raw('MAX(collection_rate) as peak_collection_rate'),
        db.raw('MIN(collection_rate) as lowest_collection_rate')
      ])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('period_type', 'monthly')
      .first();

    // Revenue Growth Analysis
    const revenueGrowth = await this.calculateRevenueGrowthTrend(schoolId, academicYearId);

    // Payment Method Performance
    const paymentMethodEfficiency = await db('payments')
      .select([
        'payment_method',
        db.raw('COUNT(*) as transaction_count'),
        db.raw('AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as avg_processing_hours'),
        db.raw('COUNT(CASE WHEN payment_status = \'failed\' THEN 1 END) * 100.0 / COUNT(*) as failure_rate')
      ])
      .where('school_id', schoolId)
      .where('created_at', '>=', db.raw('NOW() - INTERVAL \'90 days\''))
      .groupBy('payment_method');

    return {
      collection_efficiency: {
        average_rate: parseFloat(collectionPerformance.avg_collection_rate || 0).toFixed(2),
        consistency: this.interpretVolatility(parseFloat(collectionPerformance.collection_volatility || 0)),
        peak_performance: parseFloat(collectionPerformance.peak_collection_rate || 0).toFixed(2),
        improvement_potential: Math.max(0, 95 - parseFloat(collectionPerformance.avg_collection_rate || 0)).toFixed(2),
        performance_rating: this.rateCollectionPerformance(parseFloat(collectionPerformance.avg_collection_rate || 0))
      },
      revenue_trajectory: {
        growth_trend: revenueGrowth.trend,
        monthly_growth_rate: revenueGrowth.monthly_rate,
        growth_consistency: revenueGrowth.consistency,
        seasonal_patterns: revenueGrowth.seasonal_insights
      },
      payment_efficiency: paymentMethodEfficiency.map(method => ({
        method: method.payment_method,
        efficiency_score: this.calculateMethodEfficiencyScore(method),
        avg_processing_time: parseFloat(method.avg_processing_hours || 0).toFixed(2),
        failure_rate: parseFloat(method.failure_rate || 0).toFixed(2),
        recommendation: this.getMethodRecommendation(method)
      }))
    };
  }

  static async calculateRevenueGrowthTrend(schoolId, academicYearId) {
    const monthlyRevenue = await db('financial_analytics')
      .select(['period_start', 'total_payments_received'])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('period_type', 'monthly')
      .orderBy('period_start', 'asc');

    if (monthlyRevenue.length < 3) {
      return { trend: 'insufficient_data', monthly_rate: 0, consistency: 'unknown' };
    }

    const growthRates = [];
    for (let i = 1; i < monthlyRevenue.length; i++) {
      const current = parseFloat(monthlyRevenue[i].total_payments_received);
      const previous = parseFloat(monthlyRevenue[i - 1].total_payments_received);
      if (previous > 0) {
        growthRates.push(((current - previous) / previous) * 100);
      }
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const growthVolatility = this.calculateStandardDeviation(growthRates);

    return {
      trend: avgGrowthRate > 2 ? 'growing' : avgGrowthRate < -2 ? 'declining' : 'stable',
      monthly_rate: avgGrowthRate.toFixed(2),
      consistency: growthVolatility < 5 ? 'consistent' : growthVolatility < 15 ? 'moderate' : 'volatile',
      seasonal_insights: await this.detectSeasonalPatterns(monthlyRevenue)
    };
  }

  static async performRiskAssessment(schoolId, academicYearId) {
    // Cash Flow Risk
    const cashFlowRisk = await this.assessCashFlowRisk(schoolId);
    
    // Concentration Risk (dependency on few students/categories)
    const concentrationRisk = await this.assessConcentrationRisk(schoolId, academicYearId);
    
    // Collection Risk
    const collectionRisk = await this.assessCollectionRisk(schoolId, academicYearId);
    
    // Budget Overrun Risk
    const budgetRisk = await this.assessBudgetRisk(schoolId, academicYearId);

    return {
      overall_risk_score: this.calculateOverallRiskScore([
        cashFlowRisk.risk_score,
        concentrationRisk.risk_score,
        collectionRisk.risk_score,
        budgetRisk.risk_score
      ]),
      cash_flow_risk: cashFlowRisk,
      concentration_risk: concentrationRisk,
      collection_risk: collectionRisk,
      budget_risk: budgetRisk,
      mitigation_strategies: this.generateRiskMitigationStrategies([
        cashFlowRisk, concentrationRisk, collectionRisk, budgetRisk
      ])
    };
  }

  static async assessCashFlowRisk(schoolId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cashFlowData = await db.raw(`
      WITH daily_flows AS (
        SELECT 
          DATE(payment_date) as flow_date,
          COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) as inflow,
          COALESCE((
            SELECT SUM(amount_paid) 
            FROM expenses 
            WHERE DATE(payment_date) = DATE(payments.payment_date) 
            AND expenses.school_id = payments.school_id
          ), 0) as outflow
        FROM payments
        WHERE school_id = ? AND payment_date >= ?
        GROUP BY DATE(payment_date), school_id
      )
      SELECT 
        AVG(inflow - outflow) as avg_net_flow,
        STDDEV(inflow - outflow) as flow_volatility,
        COUNT(CASE WHEN (inflow - outflow) < 0 THEN 1 END) as negative_days,
        COUNT(*) as total_days
      FROM daily_flows
    `, [schoolId, thirtyDaysAgo.toISOString().split('T')[0]]);

    const result = cashFlowData.rows[0];
    const avgNetFlow = parseFloat(result.avg_net_flow || 0);
    const volatility = parseFloat(result.flow_volatility || 0);
    const negativeRatio = result.total_days > 0 ? result.negative_days / result.total_days : 0;

    let riskScore = 0;
    if (avgNetFlow < 0) riskScore += 30;
    if (negativeRatio > 0.3) riskScore += 25;
    if (volatility > avgNetFlow * 2) riskScore += 25;
    
    return {
      risk_score: Math.min(riskScore, 100),
      avg_daily_net_flow: avgNetFlow.toFixed(2),
      cash_flow_volatility: volatility.toFixed(2),
      negative_days_ratio: (negativeRatio * 100).toFixed(1),
      risk_level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      recommendations: this.generateCashFlowRecommendations(riskScore, avgNetFlow, negativeRatio)
    };
  }

  static async identifyOpportunities(schoolId, academicYearId, termId) {
    // Revenue Optimization Opportunities
    const revenueOpportunities = await this.identifyRevenueOpportunities(schoolId, academicYearId);
    
    // Cost Reduction Opportunities
    const costOpportunities = await this.identifyCostReductionOpportunities(schoolId, academicYearId);
    
    // Process Improvement Opportunities
    const processOpportunities = await this.identifyProcessImprovements(schoolId);
    
    // Digital Transformation Opportunities
    const digitalOpportunities = await this.identifyDigitalOpportunities(schoolId);

    return {
      revenue_optimization: revenueOpportunities,
      cost_reduction: costOpportunities,
      process_improvements: processOpportunities,
      digital_transformation: digitalOpportunities,
      prioritized_opportunities: this.prioritizeOpportunities([
        ...revenueOpportunities,
        ...costOpportunities,
        ...processOpportunities,
        ...digitalOpportunities
      ])
    };
  }

  static async identifyRevenueOpportunities(schoolId, academicYearId) {
    const opportunities = [];

    // Early Payment Discount Analysis
    const earlyPaymentPotential = await db('student_fees')
      .select([
        db.raw('COUNT(*) as total_fees'),
        db.raw('COUNT(CASE WHEN payment_date <= due_date THEN 1 END) as early_payments'),
        db.raw('AVG(final_amount) as avg_fee_amount')
      ])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .first();

    const earlyPaymentRate = earlyPaymentPotential.total_fees > 0 ? 
      (earlyPaymentPotential.early_payments / earlyPaymentPotential.total_fees) * 100 : 0;

    if (earlyPaymentRate < 60) {
      opportunities.push({
        type: 'early_payment_incentive',
        title: 'Implement Early Payment Discounts',
        description: `Only ${earlyPaymentRate.toFixed(1)}% of payments are made early`,
        potential_impact: 'high',
        estimated_benefit: (parseFloat(earlyPaymentPotential.avg_fee_amount) * 0.02 * earlyPaymentPotential.total_fees * 0.3).toFixed(0),
        implementation_effort: 'medium',
        timeline: '4-6 weeks'
      });
    }

    // Payment Method Optimization
    const digitalPaymentRatio = await this.calculateDigitalPaymentRatio(schoolId);
    if (digitalPaymentRatio < 70) {
      opportunities.push({
        type: 'digital_payment_adoption',
        title: 'Increase Digital Payment Adoption',
        description: `Only ${digitalPaymentRatio.toFixed(1)}% of payments are digital`,
        potential_impact: 'medium',
        estimated_benefit: 'Reduced processing costs and faster collections',
        implementation_effort: 'low',
        timeline: '2-4 weeks'
      });
    }

    return opportunities;
  }

  static async analyzeStudentBehavior(schoolId, academicYearId) {
    // Payment Behavior Patterns
    const paymentPatterns = await db('payments')
      .select([
        db.raw('EXTRACT(DOW FROM payment_date) as day_of_week'),
        db.raw('EXTRACT(HOUR FROM created_at) as hour_of_day'),
        db.raw('COUNT(*) as payment_count'),
        db.raw('AVG(amount) as avg_amount')
      ])
      .where('school_id', schoolId)
      .where('payment_status', 'completed')
      .where('created_at', '>=', db.raw('NOW() - INTERVAL \'6 months\''))
      .groupBy([db.raw('EXTRACT(DOW FROM payment_date)'), db.raw('EXTRACT(HOUR FROM created_at)')])
      .orderBy('payment_count', 'desc');

    // Late Payment Behavior
    const latePaymentAnalysis = await this.analyzeLatePaymentBehavior(schoolId, academicYearId);
    
    // Payment Amount Patterns
    const amountPatterns = await this.analyzePaymentAmountPatterns(schoolId, academicYearId);

    return {
      optimal_payment_times: this.identifyOptimalPaymentTimes(paymentPatterns),
      late_payment_insights: latePaymentAnalysis,
      amount_behavior: amountPatterns,
      behavioral_segments: await this.segmentStudentsByBehavior(schoolId, academicYearId),
      engagement_recommendations: this.generateEngagementRecommendations(paymentPatterns, latePaymentAnalysis)
    };
  }

  static async generatePredictiveInsights(schoolId, academicYearId) {
    // Revenue Forecasting
    const revenueForecast = await this.forecastRevenue(schoolId, academicYearId);
    
    // Collection Rate Prediction
    const collectionForecast = await this.predictCollectionRates(schoolId, academicYearId);
    // Cash Flow Projection
    const cashFlowProjection = await this.projectCashFlow(schoolId, academicYearId);

    return {
      revenue_forecast: revenueForecast,
      collection_forecast: collectionForecast,
      cash_flow_projection: cashFlowProjection
    };
  }
 static async forecastRevenue(schoolId, academicYearId) {
    // Get historical monthly revenue data
    const historicalRevenue = await db('financial_analytics')
      .select(['period_start', 'total_payments_received'])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('period_type', 'monthly')
      .orderBy('period_start', 'asc');

    if (historicalRevenue.length < 3) {
      return {
        forecast_available: false,
        message: 'Insufficient historical data for forecasting',
        data_points: historicalRevenue.length
      };
    }

    const revenues = historicalRevenue.map(r => parseFloat(r.total_payments_received));
    
    // Simple moving average forecast
    const windowSize = Math.min(3, revenues.length);
    const recentAverage = revenues.slice(-windowSize).reduce((sum, val) => sum + val, 0) / windowSize;
    
    // Linear trend calculation
    const trend = this.calculateLinearTrend(revenues);
    
    // Generate next 3 months forecast
    const forecasts = [];
    for (let i = 1; i <= 3; i++) {
      const forecastValue = recentAverage + (trend * i);
      forecasts.push({
        period: i,
        forecasted_revenue: Math.max(0, forecastValue).toFixed(2),
        confidence_level: this.calculateForecastConfidence(historicalRevenue.length, i)
      });
    }

    return {
      forecast_available: true,
      historical_data_points: historicalRevenue.length,
      trend_direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      monthly_trend_rate: trend.toFixed(2),
      forecasts,
      methodology: 'Moving average with linear trend adjustment'
    };
  }

  static async predictCollectionRates(schoolId, academicYearId) {
    // Get historical collection rates
    const historicalRates = await db('financial_analytics')
      .select(['period_start', 'collection_rate'])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('period_type', 'monthly')
      .orderBy('period_start', 'asc');

    if (historicalRates.length < 2) {
      return {
        prediction_available: false,
        message: 'Insufficient data for collection rate prediction'
      };
    }

    const rates = historicalRates.map(r => parseFloat(r.collection_rate));
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const trend = this.calculateLinearTrend(rates);
    
    // Predict next 3 months
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const predictedRate = Math.min(100, Math.max(0, avgRate + (trend * i)));
      predictions.push({
        period: i,
        predicted_rate: predictedRate.toFixed(2),
        confidence: this.calculateForecastConfidence(historicalRates.length, i)
      });
    }

    return {
      prediction_available: true,
      current_average_rate: avgRate.toFixed(2),
      trend_direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      monthly_change_rate: trend.toFixed(2),
      predictions,
      volatility: this.calculateStandardDeviation(rates).toFixed(2)
    };
  }

  static async predictStudentDropoutRisk(schoolId, academicYearId) {
    // Analyze payment behavior patterns that might indicate dropout risk
    const riskIndicators = await db('student_fees')
      .select([
        'student_fees.student_id',
        'students.first_name',
        'students.last_name',
        'classes.name as class_name',
        db.raw('SUM(student_fees.balance) as total_outstanding'),
        db.raw('COUNT(CASE WHEN student_fees.is_overdue = true THEN 1 END) as overdue_count'),
        db.raw('AVG(EXTRACT(EPOCH FROM (NOW() - student_fees.due_date))/86400) as avg_days_overdue'),
        db.raw('COUNT(student_fees.id) as total_fees')
      ])
      .join('students', 'student_fees.student_id', 'students.id')
      .join('classes', 'students.current_class_id', 'classes.id')
      .where('student_fees.school_id', schoolId)
      .where('student_fees.academic_year_id', academicYearId)
      .where('student_fees.balance', '>', 0)
      .groupBy([
        'student_fees.student_id', 'students.first_name', 
        'students.last_name', 'classes.name'
      ])
      .having(db.raw('SUM(student_fees.balance)'), '>', 0);

    // Calculate risk scores
    const studentsAtRisk = riskIndicators.map(student => {
      let riskScore = 0;
      
      // High outstanding balance increases risk
      if (parseFloat(student.total_outstanding) > 100000) riskScore += 30;
      else if (parseFloat(student.total_outstanding) > 50000) riskScore += 20;
      else if (parseFloat(student.total_outstanding) > 20000) riskScore += 10;
      
      // Multiple overdue fees increase risk
      const overdueRatio = student.overdue_count / student.total_fees;
      if (overdueRatio > 0.7) riskScore += 25;
      else if (overdueRatio > 0.4) riskScore += 15;
      else if (overdueRatio > 0.2) riskScore += 10;
      
      // Long overdue period increases risk
      const avgOverdue = parseFloat(student.avg_days_overdue || 0);
      if (avgOverdue > 90) riskScore += 25;
      else if (avgOverdue > 60) riskScore += 15;
      else if (avgOverdue > 30) riskScore += 10;
      
      return {
        student_name: `${student.first_name} ${student.last_name}`,
        class_name: student.class_name,
        total_outstanding: parseFloat(student.total_outstanding),
        overdue_count: parseInt(student.overdue_count),
        risk_score: Math.min(riskScore, 100),
        risk_level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        recommended_action: this.getDropoutRiskAction(riskScore)
      };
    }).filter(student => student.risk_score > 30);

    return {
      total_students_analyzed: riskIndicators.length,
      high_risk_students: studentsAtRisk.filter(s => s.risk_level === 'high').length,
      medium_risk_students: studentsAtRisk.filter(s => s.risk_level === 'medium').length,
      students_at_risk: studentsAtRisk.sort((a, b) => b.risk_score - a.risk_score),
      intervention_strategies: this.generateInterventionStrategies(studentsAtRisk)
    };
  }

  static async predictBudgetOverruns(schoolId, academicYearId) {
    // Get current budget utilization rates
    const budgets = await db('budgets')
      .select([
        'id', 'budget_name', 'total_budgeted_amount', 
        'total_actual_amount', 'utilization_rate', 'alert_threshold'
      ])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId);

    // Calculate spending velocity for each budget
    const predictions = await Promise.all(budgets.map(async budget => {
      const monthlySpending = await db('expenses')
        .select([
          db.raw('DATE_TRUNC(\'month\', expense_date) as month'),
          db.raw('SUM(amount_paid) as monthly_spent')
        ])
        .where('budget_id', budget.id)
        .where('approval_status', 'approved')
        .where('expense_date', '>=', db.raw('NOW() - INTERVAL \'6 months\''))
        .groupBy(db.raw('DATE_TRUNC(\'month\', expense_date)'))
        .orderBy('month', 'desc');

      if (monthlySpending.length === 0) {
        return {
          budget_name: budget.budget_name,
          overrun_risk: 'low',
          prediction: 'insufficient_spending_data'
        };
      }

      const avgMonthlySpend = monthlySpending.reduce((sum, month) => 
        sum + parseFloat(month.monthly_spent), 0) / monthlySpending.length;
      
      const currentUtilization = parseFloat(budget.utilization_rate || 0);
      const remainingBudget = parseFloat(budget.total_budgeted_amount) - parseFloat(budget.total_actual_amount || 0);
      const monthsToOverrun = remainingBudget > 0 ? remainingBudget / avgMonthlySpend : 0;

      let riskLevel = 'low';
      if (currentUtilization > 90 || monthsToOverrun < 2) riskLevel = 'high';
      else if (currentUtilization > 75 || monthsToOverrun < 4) riskLevel = 'medium';

      return {
        budget_name: budget.budget_name,
        current_utilization: currentUtilization,
        avg_monthly_spend: avgMonthlySpend.toFixed(2),
        estimated_months_to_overrun: monthsToOverrun.toFixed(1),
        overrun_risk: riskLevel,
        recommended_action: this.getBudgetRiskAction(riskLevel, monthsToOverrun)
      };
    }));

    return {
      budgets_analyzed: budgets.length,
      high_risk_budgets: predictions.filter(p => p.overrun_risk === 'high').length,
      budget_predictions: predictions,
      overall_budget_health: this.assessOverallBudgetHealth(predictions)
    };
  }

  // Helper methods
  static calculateLinearTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, i) => sum + (val * i), 0);
    const xSquareSum = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * xySum - xSum * ySum) / (n * xSquareSum - xSum * xSum);
  }

  static calculateForecastConfidence(dataPoints, periodsAhead) {
    let baseConfidence = Math.min(90, dataPoints * 10);
    const decayFactor = Math.pow(0.9, periodsAhead - 1);
    return (baseConfidence * decayFactor).toFixed(1);
  }

  static getDropoutRiskAction(riskScore) {
    if (riskScore > 70) return 'immediate_intervention_required';
    if (riskScore > 40) return 'schedule_parent_meeting';
    return 'monitor_closely';
  }

  static getBudgetRiskAction(riskLevel, monthsToOverrun) {
    if (riskLevel === 'high') return 'implement_spending_freeze';
    if (riskLevel === 'medium') return 'review_and_restrict_spending';
    return 'monitor_monthly_spend';
  }

  static generateInterventionStrategies(studentsAtRisk) {
    const strategies = [];
    
    const highRisk = studentsAtRisk.filter(s => s.risk_level === 'high');
    if (highRisk.length > 0) {
      strategies.push({
        target_group: 'high_risk_students',
        strategy: 'immediate_payment_plan_creation',
        timeline: '1-2 weeks',
        students_count: highRisk.length
      });
    }
    
    const mediumRisk = studentsAtRisk.filter(s => s.risk_level === 'medium');
    if (mediumRisk.length > 0) {
      strategies.push({
        target_group: 'medium_risk_students',
        strategy: 'enhanced_payment_reminders',
        timeline: '2-4 weeks',
        students_count: mediumRisk.length
      });
    }
    
    return strategies;
  }

  static assessOverallBudgetHealth(predictions) {
    const highRiskCount = predictions.filter(p => p.overrun_risk === 'high').length;
    const totalBudgets = predictions.length;
    
    if (highRiskCount / totalBudgets > 0.3) return 'poor';
    if (highRiskCount / totalBudgets > 0.1) return 'caution';
    return 'healthy';
  }
};

module.exports = FinancialInsightsService;