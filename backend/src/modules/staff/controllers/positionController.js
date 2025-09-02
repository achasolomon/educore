
// backend/src/modules/staff/controllers/positionController.js
const Position = require('../models/Position');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class PositionController {
  // Get all positions
  static async getAllPositions(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { department_id, category_id } = req.query;

      let positions;
      if (department_id) {
        positions = await Position.findByDepartment(department_id, schoolId);
      } else if (category_id) {
        positions = await Position.findByCategory(category_id, schoolId);
      } else {
        positions = await Position.findBySchool(schoolId);
      }

      // Get current staff count for each position
      for (let position of positions) {
        position.current_staff_count = await Position.getCurrentStaffCount(position.id);
        position.is_available = await Position.isAvailable(position.id);
      }

      res.json({
        success: true,
        data: { positions }
      });

    } catch (error) {
      logger.error('Get all positions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching positions'
      });
    }
  }

  // Get positions by department
  static async getPositionsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const schoolId = req.user.schoolId;

      const positions = await Position.findByDepartment(departmentId, schoolId);

      // Get current staff count for each position
      for (let position of positions) {
        position.current_staff_count = await Position.getCurrentStaffCount(position.id);
        position.is_available = await Position.isAvailable(position.id);
      }

      res.json({
        success: true,
        data: { positions }
      });

    } catch (error) {
      logger.error('Get positions by department error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching department positions'
      });
    }
  }

  // Create position
  static async createPosition(req, res) {
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
      const existing = await Position.findByCode(req.body.code, schoolId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Position with this code already exists'
        });
      }

      // Validate salary range
      if (req.body.min_salary && req.body.max_salary) {
        if (req.body.min_salary > req.body.max_salary) {
          return res.status(400).json({
            success: false,
            message: 'Minimum salary cannot be greater than maximum salary'
          });
        }
      }

      const position = await Position.create(req.body, schoolId);

      logger.info(`Position created: ${position.code}`, {
        positionId: position.id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Position created successfully',
        data: { position }
      });

    } catch (error) {
      logger.error('Create position error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating position'
      });
    }
  }

  // Initialize default positions
  static async initializeDefaults(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const positions = await Position.initializeDefaultPositions(schoolId);

      res.json({
        success: true,
        message: `Initialized ${positions.length} default positions`,
        data: { positions }
      });

    } catch (error) {
      logger.error('Initialize default positions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default positions'
      });
    }
  }

  // Update position
  static async updatePosition(req, res) {
    try {
      const { positionId } = req.params;
      const schoolId = req.user.schoolId;

      // Validate salary range if both are provided
      if (req.body.min_salary && req.body.max_salary) {
        if (req.body.min_salary > req.body.max_salary) {
          return res.status(400).json({
            success: false,
            message: 'Minimum salary cannot be greater than maximum salary'
          });
        }
      }

      const position = await Position.update(positionId, schoolId, req.body);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Position not found'
        });
      }

      res.json({
        success: true,
        message: 'Position updated successfully',
        data: { position }
      });

    } catch (error) {
      logger.error('Update position error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating position'
      });
    }
  }

  // Delete position
  static async deletePosition(req, res) {
    try {
      const { positionId } = req.params;
      const schoolId = req.user.schoolId;

      // Check if position has staff
      const staffCount = await Position.getCurrentStaffCount(positionId);
      if (staffCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete position. It has ${staffCount} active staff members.`
        });
      }

      await Position.delete(positionId, schoolId);

      res.json({
        success: true,
        message: 'Position deleted successfully'
      });

    } catch (error) {
      logger.error('Delete position error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting position'
      });
    }
  }
}

module.exports = PositionController;