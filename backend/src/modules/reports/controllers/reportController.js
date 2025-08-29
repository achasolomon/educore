// backend/src/modules/reports/controllers/reportController.js
const ReportTemplate = require('../models/ReportTemplate');
const GeneratedReport = require('../models/GeneratedReport');
const ReportGenerationService = require('../services/reportGenerationService');
const db = require('../../../core/database/connection');

class ReportController {
  // Get all report templates
  static async getReportTemplates(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { type } = req.query;

      const templates = await ReportTemplate.getAllBySchool(schoolId, type);

      res.json({
        success: true,
        data: { templates }
      });

    } catch (error) {
      console.error('Get report templates error:', error);
      res.status(500).json({ success: false, message: 'Error fetching templates' });
    }
  }

  // Create report template
  static async createReportTemplate(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        name,
        type,
        description,
        templateConfig,
        dataFields,
        outputFormat = 'pdf'
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Name and type are required'
        });
      }

      const templateData = {
        name,
        type,
        description,
        template_config: templateConfig || ReportTemplate.getDefaultStudentReportTemplate().template_config,
        data_fields: dataFields || ['student_info', 'academic_results'],
        output_format: outputFormat,
        created_by: req.user.userId
      };

      const template = await ReportTemplate.create(templateData, schoolId);

      res.status(201).json({
        success: true,
        message: 'Report template created successfully',
        data: { template }
      });

    } catch (error) {
      console.error('Create report template error:', error);
      res.status(500).json({ success: false, message: 'Error creating template' });
    }
  }

  // Generate student report
  static async generateStudentReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId, termId, templateId } = req.body;

      if (!studentId || !termId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID and Term ID are required'
        });
      }

      // Use default template if none provided
      let template_id = templateId;
      if (!template_id) {
        const defaultTemplate = await ReportTemplate.getDefaultTemplate(schoolId, 'student_report');
        if (!defaultTemplate) {
          // Create default template
          const defaultTemplateData = ReportTemplate.getDefaultStudentReportTemplate();
          const createdTemplate = await ReportTemplate.create({
            ...defaultTemplateData,
            created_by: req.user.userId,
            is_default: true
          }, schoolId);
          template_id = createdTemplate.id;
        } else {
          template_id = defaultTemplate.id;
        }
      }

      // Start report generation (async)
      const report = await ReportGenerationService.generateStudentReport(
        studentId,
        termId,
        template_id,
        req.user.userId,
        schoolId
      );

      res.status(202).json({
        success: true,
        message: 'Report generation started',
        data: { reportId: report.id }
      });

    } catch (error) {
      console.error('Generate student report error:', error);
      res.status(500).json({ success: false, message: 'Error generating report' });
    }
  }

  // Generate class report
  static async generateClassReport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { classId, termId, templateId } = req.body;

      if (!classId || !termId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID and Term ID are required'
        });
      }

      let template_id = templateId;
      if (!template_id) {
        const defaultTemplate = await ReportTemplate.getDefaultTemplate(schoolId, 'class_report');
        template_id = defaultTemplate ? defaultTemplate.id : templateId;
      }

      const report = await ReportGenerationService.generateClassReport(
        classId,
        termId,
        template_id,
        req.user.userId,
        schoolId
      );

      res.status(202).json({
        success: true,
        message: 'Class report generation started',
        data: { reportId: report.id }
      });

    } catch (error) {
      console.error('Generate class report error:', error);
      res.status(500).json({ success: false, message: 'Error generating class report' });
    }
  }

  // Check report status
  static async getReportStatus(req, res) {
    try {
      const { reportId } = req.params;
      const schoolId = req.user.schoolId;

      const report = await GeneratedReport.findById(reportId, schoolId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: report.id,
          status: report.status,
          reportName: report.report_name,
          createdAt: report.created_at,
          filePath: report.status === 'completed' ? report.file_path : null,
          errorMessage: report.error_message
        }
      });

    } catch (error) {
      console.error('Get report status error:', error);
      res.status(500).json({ success: false, message: 'Error checking report status' });
    }
  }

  // Download report
  static async downloadReport(req, res) {
    try {
      const { reportId } = req.params;
      const schoolId = req.user.schoolId;

      const report = await GeneratedReport.findById(reportId, schoolId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      if (report.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Report is not ready for download'
        });
      }

      // Increment download count
      await GeneratedReport.incrementDownloadCount(reportId);

      // Send file
      const fs = require('fs');
      if (fs.existsSync(report.file_path)) {
        res.download(report.file_path, report.report_name);
      } else {
        res.status(404).json({
          success: false,
          message: 'Report file not found'
        });
      }

    } catch (error) {
      console.error('Download report error:', error);
      res.status(500).json({ success: false, message: 'Error downloading report' });
    }
  }

  // Get user's generated reports
  static async getMyReports(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.userId;
      const { limit = 20 } = req.query;

      const reports = await GeneratedReport.getAllByUser(userId, schoolId, limit);

      res.json({
        success: true,
        data: { reports }
      });

    } catch (error) {
      console.error('Get my reports error:', error);
      res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
  }
}

module.exports = ReportController;