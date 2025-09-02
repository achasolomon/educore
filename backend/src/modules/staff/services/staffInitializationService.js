// backend/src/modules/staff/services/staffInitializationService.js
const StaffCategory = require('../models/StaffCategory');
const Department = require('../models/Department');
const Position = require('../models/Position');
const logger = require('../../../core/utils/logger');

class StaffInitializationService {
  /**
   * Initialize complete staff management system for a new school
   */
  static async initializeSchoolStaffSystem(schoolId) {
    try {
      logger.info(`Initializing staff system for school: ${schoolId}`);

      // Step 1: Initialize staff categories
      const categories = await StaffCategory.initializeDefaultCategories(schoolId);
      logger.info(`Created ${categories.length} staff categories`);

      // Step 2: Initialize departments
      const departments = await Department.initializeDefaultDepartments(schoolId);
      logger.info(`Created ${departments.length} departments`);

      // Step 3: Initialize positions
      const positions = await Position.initializeDefaultPositions(schoolId);
      logger.info(`Created ${positions.length} positions`);

      const summary = {
        categories: categories.length,
        departments: departments.length,
        positions: positions.length,
        message: 'Staff management system initialized successfully'
      };

      logger.info('Staff system initialization completed', summary);
      
      return summary;

    } catch (error) {
      logger.error('Staff system initialization error:', error);
      throw new Error('Failed to initialize staff management system');
    }
  }

  /**
   * Get staff system setup status for a school
   */
  static async getSetupStatus(schoolId) {
    try {
      const [categories, departments, positions] = await Promise.all([
        StaffCategory.findBySchool(schoolId),
        Department.findBySchool(schoolId),
        Position.findBySchool(schoolId)
      ]);

      const isComplete = categories.length > 0 && departments.length > 0 && positions.length > 0;

      return {
        is_setup_complete: isComplete,
        categories_count: categories.length,
        departments_count: departments.length,
        positions_count: positions.length,
        setup_percentage: Math.round(
          ((categories.length > 0 ? 33 : 0) +
           (departments.length > 0 ? 33 : 0) +
           (positions.length > 0 ? 34 : 0))
        )
      };

    } catch (error) {
      logger.error('Get setup status error:', error);
      throw error;
    }
  }
}

module.exports = StaffInitializationService;