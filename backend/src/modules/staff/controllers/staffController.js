// backend/src/modules/staff/controllers/staffController.js
const Staff = require('../models/Staff');
const StaffCategory = require('../models/StaffCategory');
const Department = require('../models/Department');
const Position = require('../models/Position');
const StaffDocument = require('../models/StaffDocument');
const StaffAssignment = require('../models/StaffAssignment');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class StaffController {
  // Create new staff member
  static async createStaff(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const schoolId = req.user.schoolId;
      const createdBy = req.user.userId;

      // Check if position is available
      const position = await Position.findById(req.body.position_id, schoolId);
      if (!position) {
        return res.status(400).json({
          success: false,
          message: 'Invalid position selected'
        });
      }

      const isAvailable = await Position.isAvailable(req.body.position_id);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Position is full. Maximum staff limit reached for this position.'
        });
      }

      // Check for duplicate email
      if (req.body.email) {
        const existingStaff = await Staff.findByEmail(req.body.email, schoolId);
        if (existingStaff) {
          return res.status(409).json({
            success: false,
            message: 'Staff member with this email already exists'
          });
        }
      }

      const staff = await Staff.create(req.body, schoolId, createdBy);

      logger.info(`New staff member created: ${staff.staff_id}`, {
        staffId: staff.id,
        createdBy,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: { staff }
      });

    } catch (error) {
      logger.error('Create staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating staff member'
      });
    }
  }

  // Get all staff members
  static async getAllStaff(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        category_id,
        department_id,
        employment_status = 'active',
        employment_type,
        is_active = true,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        category_id,
        department_id,
        employment_status,
        employment_type,
        is_active: is_active === 'true',
        search
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const staff = await Staff.findBySchool(
        schoolId,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: staff
      });

    } catch (error) {
      logger.error('Get all staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching staff members'
      });
    }
  }

  // Get staff member by ID
  static async getStaffById(req, res) {
    try {
      const { staffId } = req.params;
      const schoolId = req.user.schoolId;

      const staff = await Staff.findById(staffId, schoolId);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Get staff assignments
      const assignments = await StaffAssignment.findByStaff(staffId, schoolId);

      // Get staff documents
      const documents = await StaffDocument.findByStaff(staffId, schoolId);

      res.json({
        success: true,
        data: {
          staff,
          assignments,
          documents
        }
      });

    } catch (error) {
      logger.error('Get staff by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching staff member'
      });
    }
  }

  // Update staff member
  static async updateStaff(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { staffId } = req.params;
      const schoolId = req.user.schoolId;
      const updatedBy = req.user.userId;

      const staff = await Staff.update(staffId, schoolId, req.body, updatedBy);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      logger.info(`Staff member updated: ${staff.staff_id}`, {
        staffId,
        updatedBy,
        schoolId
      });

      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: { staff }
      });

    } catch (error) {
      logger.error('Update staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating staff member'
      });
    }
  }

  // Update staff employment status
  static async updateEmploymentStatus(req, res) {
    try {
      const { staffId } = req.params;
      const { status, reason } = req.body;
      const schoolId = req.user.schoolId;
      const updatedBy = req.user.userId;

      if (!['active', 'on_leave', 'suspended', 'terminated', 'retired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employment status'
        });
      }

      const staff = await Staff.updateEmploymentStatus(
        staffId,
        schoolId,
        status,
        updatedBy,
        reason
      );

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      logger.info(`Staff employment status updated: ${staff.staff_id} -> ${status}`, {
        staffId,
        status,
        reason,
        updatedBy,
        schoolId
      });

      res.json({
        success: true,
        message: 'Employment status updated successfully',
        data: { staff }
      });

    } catch (error) {
      logger.error('Update employment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating employment status'
      });
    }
  }

  // Deactivate staff member
  static async deactivateStaff(req, res) {
    try {
      const { staffId } = req.params;
      const { reason } = req.body;
      const schoolId = req.user.schoolId;
      const updatedBy = req.user.userId;

      const staff = await Staff.deactivate(staffId, schoolId, updatedBy, reason);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      logger.info(`Staff member deactivated: ${staff.staff_id}`, {
        staffId,
        reason,
        updatedBy,
        schoolId
      });

      res.json({
        success: true,
        message: 'Staff member deactivated successfully',
        data: { staff }
      });

    } catch (error) {
      logger.error('Deactivate staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating staff member'
      });
    }
  }

  // Get staff statistics
  static async getStaffStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const statistics = await Staff.getStaffStatistics(schoolId);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Get staff statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching staff statistics'
      });
    }
  }

  // Bulk import staff
  static async bulkImportStaff(req, res) {
    try {
      const { staffList } = req.body;
      const schoolId = req.user.schoolId;
      const createdBy = req.user.userId;

      if (!Array.isArray(staffList) || staffList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Staff list is required and must be an array'
        });
      }

      const result = await Staff.bulkImport(staffList, schoolId, createdBy);

      logger.info(`Bulk staff import completed`, {
        successful: result.successful,
        failed: result.failed,
        total: staffList.length,
        createdBy,
        schoolId
      });

      res.json({
        success: true,
        message: `Bulk import completed. ${result.successful} successful, ${result.failed} failed.`,
        data: result
      });

    } catch (error) {
      logger.error('Bulk import staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing staff members'
      });
    }
  }

  // Get staff by department
  static async getStaffByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const { activeOnly = true } = req.query;
      const schoolId = req.user.schoolId;

      const staff = await Staff.findByDepartment(
        departmentId,
        schoolId,
        activeOnly === 'true'
      );

      res.json({
        success: true,
        data: { staff }
      });

    } catch (error) {
      logger.error('Get staff by department error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department staff'
      });
    }
  }
}

module.exports = StaffController;