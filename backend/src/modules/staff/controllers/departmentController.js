// backend/src/modules/staff/controllers/departmentController.js
const Department = require('../models/Department');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class DepartmentController {
  // Get all departments
  static async getAllDepartments(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { type } = req.query;

      let departments;
      if (type) {
        departments = await Department.findByType(type, schoolId);
      } else {
        departments = await Department.findBySchool(schoolId);
      }

      // Get staff count for each department
      for (let dept of departments) {
        dept.staff_count = await Department.getStaffCount(dept.id);
      }

      res.json({
        success: true,
        data: { departments }
      });

    } catch (error) {
      logger.error('Get all departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching departments'
      });
    }
  }

  // Create department
  static async createDepartment(req, res) {
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

      // Check for duplicate code
      const existing = await Department.findByCode(req.body.code, schoolId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Department with this code already exists'
        });
      }

      const department = await Department.create(req.body, schoolId);

      logger.info(`Department created: ${department.code}`, {
        departmentId: department.id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: { department }
      });

    } catch (error) {
      logger.error('Create department error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating department'
      });
    }
  }

  // Initialize default departments
  static async initializeDefaults(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const departments = await Department.initializeDefaultDepartments(schoolId);

      res.json({
        success: true,
        message: `Initialized ${departments.length} default departments`,
        data: { departments }
      });

    } catch (error) {
      logger.error('Initialize default departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default departments'
      });
    }
  }

  // Update department
  static async updateDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const schoolId = req.user.schoolId;

      const department = await Department.update(departmentId, schoolId, req.body);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: { department }
      });

    } catch (error) {
      logger.error('Update department error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating department'
      });
    }
  }

  // Assign Head of Department
  static async assignHOD(req, res) {
    try {
      const { departmentId } = req.params;
      const { hodUserId } = req.body;
      const schoolId = req.user.schoolId;

      const department = await Department.assignHOD(departmentId, hodUserId, schoolId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      logger.info(`HOD assigned to department: ${department.code}`, {
        departmentId,
        hodUserId,
        schoolId
      });

      res.json({
        success: true,
        message: 'Head of Department assigned successfully',
        data: { department }
      });

    } catch (error) {
      logger.error('Assign HOD error:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning Head of Department'
      });
    }
  }

  // Delete department
  static async deleteDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const schoolId = req.user.schoolId;

      // Check if department has staff
      const staffCount = await Department.getStaffCount(departmentId);
      if (staffCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete department. It has ${staffCount} active staff members.`
        });
      }

      await Department.delete(departmentId, schoolId);

      res.json({
        success: true,
        message: 'Department deleted successfully'
      });

    } catch (error) {
      logger.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting department'
      });
    }
  }
}

module.exports = DepartmentController;