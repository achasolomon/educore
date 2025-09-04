// backend/src/modules/finance/controllers/reportGeneratorController.js
const FinancialReportingService = require('../services/financialReportingService');
const ReportExportService = require('../services/reportExportService');
const logger = require('../../../core/utils/logger');
const cache = require('../../../core/utils/cache');
const crypto = require('crypto');

class ReportGeneratorController {
  // Generate comprehensive financial report
  static async generateComprehensiveReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        academic_year_id,
        start_date,
        end_date,
        report_format = 'json',
        include_comparisons = true,
        include_forecasting = false,
        granular_breakdown = false
      } = req.body;

      // Validate date range
      if (!start_date || !end_date) {
        const currentDate = new Date();
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        req.body.start_date = startOfYear.toISOString().split('T')[0];
        req.body.end_date = currentDate.toISOString().split('T')[0];
      }

      // Generate cache key for report
      const cacheKey = `financial_report_${schoolId}_${academic_year_id}_${start_date}_${end_date}_${JSON.stringify({
        include_comparisons,
        include_forecasting,
        granular_breakdown
      })}`;

      // Check cache first (valid for 1 hour)
      const cachedReport = await cache.get(cacheKey);
      if (cachedReport && report_format === 'json') {
        return res.json({
          success: true,
          data: JSON.parse(cachedReport),
          cached: true,
          generated_at: new Date().toISOString()
        });
      }

      // Generate report
      const reportParams = {
        period_type: 'custom',
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        include_comparisons,
        include_forecasting,
        granular_breakdown
      };

      const report = await FinancialReportingService.generatePeriodReport(
        schoolId,
        academic_year_id,
        reportParams
      );

      // Cache the report
      await cache.set(cacheKey, JSON.stringify(report), 3600); // 1 hour cache

      // Handle different export formats
      if (report_format === 'pdf') {
        const pdfBuffer = await ReportExportService.generatePDFReport(report, 'comprehensive');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comprehensive_financial_report_${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
      }

      if (report_format === 'excel') {
        const excelBuffer = await ReportExportService.generateExcelReport(report, 'comprehensive');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="comprehensive_financial_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
        return res.send(excelBuffer);
      }

      res.json({
        success: true,
        data: report,
        cached: false,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Generate comprehensive report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating comprehensive financial report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Generate budget performance report
  static async generateBudgetReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, budget_id, report_format = 'json' } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const currentDate = new Date();
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

      const budgetReport = await FinancialReportingService.generateBudgetPerformanceAnalysis(
        schoolId,
        academic_year_id,
        startOfYear.toISOString().split('T')[0],
        currentDate.toISOString().split('T')[0]
      );

      // Filter by specific budget if provided
      if (budget_id) {
        budgetReport.budget_performance = budgetReport.budget_performance.filter(
          b => b.budget_id === budget_id
        );
      }

      // Handle export formats
      if (report_format === 'pdf') {
        const pdfBuffer = await ReportExportService.generatePDFReport(budgetReport, 'budget');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="budget_performance_report_${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: budgetReport,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Generate budget report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating budget performance report'
      });
    }
  }

  // Generate revenue analysis report
  static async generateRevenueReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        academic_year_id,
        start_date,
        end_date,
        granular_breakdown = false,
        report_format = 'json'
      } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      // Default to current month if no dates provided
      const defaultStart = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const defaultEnd = end_date || new Date().toISOString().split('T')[0];

      const revenueAnalysis = await FinancialReportingService.generateRevenueAnalysis(
        schoolId,
        academic_year_id,
        defaultStart,
        defaultEnd,
        granular_breakdown === 'true'
      );

      if (report_format === 'excel') {
        const excelBuffer = await ReportExportService.generateExcelReport(revenueAnalysis, 'revenue');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="revenue_analysis_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
        return res.send(excelBuffer);
      }

      res.json({
        success: true,
        data: revenueAnalysis,
        period: { start_date: defaultStart, end_date: defaultEnd },
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Generate revenue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating revenue analysis report'
      });
    }
  }

  // Generate student payment behavior report
  static async generateStudentPaymentReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        academic_year_id,
        class_id,
        start_date,
        end_date,
        report_format = 'json'
      } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const defaultStart = start_date || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const defaultEnd = end_date || new Date().toISOString().split('T')[0];

      const studentAnalysis = await FinancialReportingService.generateStudentPaymentAnalytics(
        schoolId,
        academic_year_id,
        defaultStart,
        defaultEnd
      );

      // Filter by class if provided
      if (class_id) {
        studentAnalysis.top_payers = studentAnalysis.top_payers.filter(
          student => student.class_id === class_id
        );
        studentAnalysis.debt_by_class = studentAnalysis.debt_by_class.filter(
          debt => debt.class_id === class_id
        );
      }

      if (report_format === 'excel') {
        const excelBuffer = await ReportExportService.generateExcelReport(studentAnalysis, 'student_payments');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="student_payment_analysis_${new Date().toISOString().split('T')[0]}.xlsx"`);
        return res.send(excelBuffer);
      }

      res.json({
        success: true,
        data: studentAnalysis,
        period: { start_date: defaultStart, end_date: defaultEnd },
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Generate student payment report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating student payment report'
      });
    }
  }

  // Generate cash flow report
  static async generateCashFlowReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        start_date,
        end_date,
        report_format = 'json'
      } = req.query;

      // Default to last 30 days
      const defaultEnd = end_date || new Date().toISOString().split('T')[0];
      const defaultStart = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const cashFlowAnalysis = await FinancialReportingService.generateCashFlowAnalysis(
        schoolId,
        defaultStart,
        defaultEnd
      );

      if (report_format === 'pdf') {
        const pdfBuffer = await ReportExportService.generatePDFReport(cashFlowAnalysis, 'cash_flow');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cash_flow_report_${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
      }

      res.json({
        success: true,
        data: cashFlowAnalysis,
        period: { start_date: defaultStart, end_date: defaultEnd },
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Generate cash flow report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating cash flow report'
      });
    }
  }

  // Schedule automated report
  static async scheduleAutomatedReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.id;
      const {
        report_type,
        report_frequency, // daily, weekly, monthly
        recipients, // array of email addresses
        report_format,
        parameters
      } = req.body;

      const scheduleId = crypto.randomUUID();
      
      // Store schedule in database
      const schedule = await db('report_schedules').insert({
        id: scheduleId,
        school_id: schoolId,
        created_by: userId,
        report_type,
        frequency: report_frequency,
        recipients: JSON.stringify(recipients),
        format: report_format,
        parameters: JSON.stringify(parameters),
        is_active: true,
        next_run_date: this.calculateNextRunDate(report_frequency),
        created_at: new Date()
      }).returning('*');

      res.status(201).json({
        success: true,
        message: 'Report schedule created successfully',
        data: {
          schedule_id: scheduleId,
          next_run_date: schedule[0].next_run_date
        }
      });

    } catch (error) {
      logger.error('Schedule automated report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error scheduling automated report'
      });
    }
  }

  // Get report templates
  static async getReportTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'comprehensive_financial',
          name: 'Comprehensive Financial Report',
          description: 'Complete financial overview including revenue, expenses, and performance metrics',
          parameters: ['academic_year_id', 'start_date', 'end_date'],
          formats: ['json', 'pdf', 'excel'],
          estimated_time: '2-3 minutes'
        },
        {
          id: 'budget_performance',
          name: 'Budget Performance Report',
          description: 'Analysis of budget utilization and variance across all categories',
          parameters: ['academic_year_id', 'budget_id'],
          formats: ['json', 'pdf'],
          estimated_time: '1-2 minutes'
        },
        {
          id: 'revenue_analysis',
          name: 'Revenue Analysis Report',
          description: 'Detailed breakdown of revenue by category, payment method, and timing',
          parameters: ['academic_year_id', 'start_date', 'end_date', 'granular_breakdown'],
          formats: ['json', 'excel'],
          estimated_time: '1-2 minutes'
        },
        {
          id: 'student_payment_behavior',
          name: 'Student Payment Behavior Report',
          description: 'Analysis of payment patterns, outstanding debts, and collection efficiency',
          parameters: ['academic_year_id', 'class_id', 'start_date', 'end_date'],
          formats: ['json', 'excel'],
          estimated_time: '2-3 minutes'
        },
        {
          id: 'cash_flow',
          name: 'Cash Flow Report',
          description: 'Daily cash flow analysis with inflow and outflow tracking',
          parameters: ['start_date', 'end_date'],
          formats: ['json', 'pdf'],
          estimated_time: '1 minute'
        }
      ];

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      logger.error('Get report templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching report templates'
      });
    }
  }

  // Helper method to calculate next run date
  static calculateNextRunDate(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    
    return now;
  }

  // Get report history
  static async getReportHistory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, report_type } = req.query;

      let query = db('report_history')
        .select([
          'id', 'report_type', 'parameters', 'format', 'file_size',
          'generation_time_ms', 'created_at', 'expires_at'
        ])
        .where('school_id', schoolId)
        .orderBy('created_at', 'desc')
        .limit(parseInt(limit))
        .offset((parseInt(page) - 1) * parseInt(limit));

      if (report_type) {
        query = query.where('report_type', report_type);
      }

      const reports = await query;
      
      const total = await db('report_history')
        .count('* as count')
        .where('school_id', schoolId)
        .modify(function(qb) {
          if (report_type) qb.where('report_type', report_type);
        })
        .first();

      res.json({
        success: true,
        data: reports.map(report => ({
          ...report,
          parameters: JSON.parse(report.parameters || '{}'),
          is_expired: new Date() > new Date(report.expires_at)
        })),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: parseInt(total.count),
          total_pages: Math.ceil(parseInt(total.count) / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Get report history error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching report history'
      });
    }
  }
}

module.exports = ReportGeneratorController;