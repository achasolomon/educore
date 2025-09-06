const HealthService = require('../services/healthService');
const { logger } = require('../../../core/utils/logger');
const { validationResult } = require('express-validator');


class HealthController {
  // Create student health profile
  static async createStudentHealthProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId } = req.params;
      const profileData = req.body;
      const createdBy = req.user.id;

      const profile = await HealthService.createStudentHealthProfile(
        profileData, 
        schoolId, 
        createdBy
      );

      res.status(201).json({
        success: true,
        message: 'Student health profile created successfully',
        data: profile
      });

    } catch (error) {
      logger.error('Error in createStudentHealthProfile:', error);
      res.status(error.message === 'Health profile already exists for this student' ? 409 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get student health profile
  static async getStudentHealthProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId, studentId } = req.params;

      const profile = await HealthService.getStudentHealthProfile(studentId, schoolId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Health profile not found for this student'
        });
      }

      res.json({
        success: true,
        data: profile
      });

    } catch (error) {
      logger.error('Error in getStudentHealthProfile:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update student health profile
  static async updateStudentHealthProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId, studentId } = req.params;
      const updateData = req.body;
      const updatedBy = req.user.id;

      const profile = await HealthService.updateStudentHealthProfile(
        studentId, 
        schoolId, 
        updateData, 
        updatedBy
      );

      res.json({
        success: true,
        message: 'Student health profile updated successfully',
        data: profile
      });

    } catch (error) {
      logger.error('Error in updateStudentHealthProfile:', error);
      res.status(error.message === 'Health profile not found for this student' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Record health incident
  static async recordHealthIncident(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId } = req.params;
      const incidentData = req.body;
      const reportedBy = req.user.id;

      const incident = await HealthService.recordHealthIncident(
        incidentData, 
        schoolId, 
        reportedBy
      );

      res.status(201).json({
        success: true,
        message: 'Health incident recorded successfully',
        data: incident
      });

    } catch (error) {
      logger.error('Error in recordHealthIncident:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get health incidents
  static async getHealthIncidents(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId } = req.params;
      const filters = req.query;

      const incidents = await HealthService.getHealthIncidents(schoolId, filters);

      res.json({
        success: true,
        data: incidents
      });

    } catch (error) {
      logger.error('Error in getHealthIncidents:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get health dashboard data
  static async getHealthDashboard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId } = req.params;

      const dashboardData = await HealthService.getHealthDashboardData(schoolId);

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error in getHealthDashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate health report
  static async generateHealthReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId, reportType } = req.params;
      const filters = req.query;

      const report = await HealthService.generateHealthReport(schoolId, reportType, filters);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error in generateHealthReport:', error);
      res.status(error.message === 'Invalid report type' ? 400 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Schedule health screening
  static async scheduleHealthScreening(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { schoolId } = req.params;
      const screeningData = req.body;
      const conductedBy = req.user.id;

      const screenings = await HealthService.scheduleHealthScreening(
        screeningData, 
        schoolId, 
        conductedBy
      );

      res.status(201).json({
        success: true,
        message: 'Health screening scheduled successfully',
        data: screenings
      });

    } catch (error) {
      logger.error('Error in scheduleHealthScreening:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}


module.exports = HealthController;