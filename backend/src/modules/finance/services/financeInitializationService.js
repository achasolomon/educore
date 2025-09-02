// backend/src/modules/finance/services/financeInitializationService.js
const FeeCategory = require('../models/FeeCategory');
const logger = require('../../../core/utils/logger');

class FinanceInitializationService {
  /**
   * Initialize complete financial management system for a new school
   */
  static async initializeSchoolFinanceSystem(schoolId) {
    try {
      logger.info(`Initializing finance system for school: ${schoolId}`);

      // Step 1: Initialize default fee categories
      const categories = await FeeCategory.initializeDefaultCategories(schoolId);
      logger.info(`Created ${categories.length} fee categories`);

      const summary = {
        categories: categories.length,
        message: 'Financial management system initialized successfully'
      };

      logger.info('Finance system initialization completed', summary);
      
      return summary;

    } catch (error) {
      logger.error('Finance system initialization error:', error);
      throw new Error('Failed to initialize financial management system');
    }
  }

  /**
   * Get finance system setup status for a school
   */
  static async getSetupStatus(schoolId) {
    try {
      const categories = await FeeCategory.findBySchool(schoolId);
      const isComplete = categories.length > 0;

      return {
        is_setup_complete: isComplete,
        categories_count: categories.length,
        setup_percentage: isComplete ? 100 : 0
      };

    } catch (error) {
      logger.error('Get finance setup status error:', error);
      throw error;
    }
  }

  /**
   * Generate fee structures for all classes in an academic year
   */
  static async generateFeeStructuresForAcademicYear(schoolId, academicYearId, feeTemplate) {
    try {
      const db = require('../../../core/database/connection');
      const FeeStructure = require('../models/FeeStructure');

      // Get all active classes
      const classes = await db('classes')
        .where({ school_id: schoolId, is_active: true });

      const results = [];

      for (const classInfo of classes) {
        try {
          const classStructures = await FeeStructure.bulkCreateForClass(
            classInfo.id,
            academicYearId,
            feeTemplate[classInfo.level] || feeTemplate.default,
            schoolId
          );

          results.push({
            class_id: classInfo.id,
            class_name: classInfo.name,
            structures_created: classStructures.length
          });

        } catch (error) {
          results.push({
            class_id: classInfo.id,
            class_name: classInfo.name,
            structures_created: 0,
            error: error.message
          });
        }
      }

      const totalStructures = results.reduce((sum, result) => sum + result.structures_created, 0);

      logger.info(`Generated ${totalStructures} fee structures for academic year ${academicYearId}`);

      return {
        total_structures: totalStructures,
        classes_processed: classes.length,
        results
      };

    } catch (error) {
      logger.error('Generate fee structures error:', error);
      throw error;
    }
  }
}

module.exports = FinanceInitializationService;