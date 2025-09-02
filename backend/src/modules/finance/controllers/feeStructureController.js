// backend/src/modules/finance/controllers/feeStructureController.js
const FeeStructure = require('../models/FeeStructure');
const FeeCategory = require('../models/FeeCategory');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class FeeStructureController {
  // Get fee structures
  static async getFeeStructures(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, class_id, term_id } = req.query;

      let structures;
      if (class_id && academic_year_id) {
        structures = await FeeStructure.findByClass(class_id, schoolId, academic_year_id, term_id);
      } else {
        structures = await FeeStructure.findBySchool(schoolId, academic_year_id);
      }

      res.json({
        success: true,
        data: { structures }
      });

    } catch (error) {
      logger.error('Get fee structures error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching fee structures'
      });
    }
  }

  // Create fee structure
  static async createStructure(req, res) {
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

      // Check if structure already exists
      const existing = await db('fee_structures')
        .where({
          school_id: schoolId,
          academic_year_id: req.body.academic_year_id,
          class_id: req.body.class_id,
          fee_category_id: req.body.fee_category_id,
          term_id: req.body.term_id || null
        })
        .first();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Fee structure already exists for this class, term, and category'
        });
      }

      const structure = await FeeStructure.create(req.body, schoolId);

      logger.info(`Fee structure created`, {
        structureId: structure.id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: { structure }
      });

    } catch (error) {
      logger.error('Create fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating fee structure'
      });
    }
  }

  // Bulk create fee structures for class
  static async bulkCreateForClass(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { classId } = req.params;
      const { academic_year_id, fee_structures } = req.body;
      const schoolId = req.user.schoolId;

      const createdStructures = await FeeStructure.bulkCreateForClass(
        classId,
        academic_year_id,
        fee_structures,
        schoolId
      );

      logger.info(`Bulk fee structures created for class ${classId}`, {
        count: createdStructures.length,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: `Created ${createdStructures.length} fee structures successfully`,
        data: { structures: createdStructures }
      });

    } catch (error) {
      logger.error('Bulk create fee structures error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating fee structures'
      });
    }
  }

  // Get total fee for class
  static async getClassFeeTotal(req, res) {
    try {
      const { classId } = req.params;
      const { academic_year_id, term_id } = req.query;
      const schoolId = req.user.schoolId;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const totalFee = await FeeStructure.getTotalFeeForClass(
        classId,
        academic_year_id,
        term_id,
        schoolId
      );

      res.json({
        success: true,
        data: { 
          class_id: classId,
          academic_year_id,
          term_id,
          total_fee: totalFee
        }
      });

    } catch (error) {
      logger.error('Get class fee total error:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating class fee total'
      });
    }
  }

  // Copy fee structures from previous year
  static async copyFromPreviousYear(req, res) {
    try {
      const { from_academic_year_id, to_academic_year_id, adjustment_percentage = 0 } = req.body;
      const schoolId = req.user.schoolId;

      if (!from_academic_year_id || !to_academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Both source and target academic year IDs are required'
        });
      }

      const newStructures = await FeeStructure.copyFromPreviousYear(
        from_academic_year_id,
        to_academic_year_id,
        schoolId,
        parseFloat(adjustment_percentage)
      );

      logger.info(`Fee structures copied from ${from_academic_year_id} to ${to_academic_year_id}`, {
        count: newStructures.length,
        adjustment_percentage,
        schoolId
      });

      res.json({
        success: true,
        message: `Copied ${newStructures.length} fee structures with ${adjustment_percentage}% adjustment`,
        data: { structures: newStructures }
      });

    } catch (error) {
      logger.error('Copy fee structures error:', error);
      res.status(500).json({
        success: false,
        message: 'Error copying fee structures from previous year'
      });
    }
  }

  // Update fee structure
  static async updateStructure(req, res) {
    try {
      const { structureId } = req.params;
      const schoolId = req.user.schoolId;

      const structure = await FeeStructure.update(structureId, schoolId, req.body);

      if (!structure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      res.json({
        success: true,
        message: 'Fee structure updated successfully',
        data: { structure }
      });

    } catch (error) {
      logger.error('Update fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating fee structure'
      });
    }
  }

  // Delete fee structure
  static async deleteStructure(req, res) {
    try {
      const { structureId } = req.params;
      const schoolId = req.user.schoolId;

      await FeeStructure.delete(structureId, schoolId);

      res.json({
        success: true,
        message: 'Fee structure deleted successfully'
      });

    } catch (error) {
      logger.error('Delete fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting fee structure'
      });
    }
  }
}

module.exports = FeeStructureController;