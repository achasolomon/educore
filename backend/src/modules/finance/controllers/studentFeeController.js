// backend/src/modules/finance/controllers/studentFeeController.js
const StudentFee = require('../models/StudentFee');
const FeeStructure = require('../models/FeeStructure');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class StudentFeeController {
  // Get student fees
  static async getStudentFees(req, res) {
    try {
      const { studentId } = req.params;
      const { academic_year_id, term_id } = req.query;
      const schoolId = req.user.schoolId;

      const fees = await StudentFee.findByStudent(studentId, schoolId, academic_year_id, term_id);

      res.json({
        success: true,
        data: { fees }
      });

    } catch (error) {
      logger.error('Get student fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching student fees'
      });
    }
  }

  // Generate fees for student
  static async generateFeesForStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { studentId } = req.params;
      const { class_id, academic_year_id, term_id } = req.body;
      const schoolId = req.user.schoolId;

      const generatedFees = await StudentFee.generateForStudent(
        studentId,
        class_id,
        academic_year_id,
        term_id,
        schoolId
      );

      logger.info(`Generated ${generatedFees.length} fees for student ${studentId}`);

      res.status(201).json({
        success: true,
        message: `Generated ${generatedFees.length} fee records for student`,
        data: { fees: generatedFees }
      });

    } catch (error) {
      logger.error('Generate student fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating student fees'
      });
    }
  }

  // Get student fee summary
  static async getStudentFeeSummary(req, res) {
    try {
      const { studentId } = req.params;
      const { academic_year_id } = req.query;
      const schoolId = req.user.schoolId;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const summary = await StudentFee.getFeeSummaryForStudent(studentId, academic_year_id, schoolId);

      res.json({
        success: true,
        data: { summary }
      });

    } catch (error) {
      logger.error('Get student fee summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching student fee summary'
      });
    }
  }

  // Apply discount to student fee
  static async applyDiscount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { studentFeeId } = req.params;
      const { discount_amount, discount_type, reason } = req.body;
      const schoolId = req.user.schoolId;
      const approvedBy = req.user.userId;

      const updatedFee = await StudentFee.applyDiscount(
        studentFeeId,
        discount_amount,
        discount_type,
        reason,
        approvedBy,
        schoolId
      );

      logger.info(`Discount applied to student fee ${studentFeeId}`, {
        discount_amount,
        discount_type,
        approvedBy
      });

      res.json({
        success: true,
        message: 'Discount applied successfully',
        data: { fee: updatedFee }
      });

    } catch (error) {
      logger.error('Apply discount error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error applying discount'
      });
    }
  }

  // Get outstanding fees
  static async getOutstandingFees(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { class_id, academic_year_id, overdue_only } = req.query;

      const filters = {
        class_id,
        academic_year_id,
        overdue_only: overdue_only === 'true'
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const outstandingFees = await StudentFee.getOutstandingFees(schoolId, filters);

      res.json({
        success: true,
        data: { outstanding_fees: outstandingFees }
      });

    } catch (error) {
      logger.error('Get outstanding fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching outstanding fees'
      });
    }
  }

  // Update overdue status
  static async updateOverdueStatus(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const updatedCount = await StudentFee.updateOverdueStatus(schoolId);

      res.json({
        success: true,
        message: `Updated overdue status for ${updatedCount} fee records`,
        data: { updated_count: updatedCount }
      });

    } catch (error) {
      logger.error('Update overdue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating overdue status'
      });
    }
  }

  // Bulk generate fees for class
  static async bulkGenerateForClass(req, res) {
    try {
      const { classId } = req.params;
      const { academic_year_id, term_id } = req.body;
      const schoolId = req.user.schoolId;

      // Get all students in class
      const students = await db('students')
        .where({ class_id: classId, status: 'active' });

      let totalGenerated = 0;
      const results = [];

      for (const student of students) {
        try {
          const generatedFees = await StudentFee.generateForStudent(
            student.id,
            classId,
            academic_year_id,
            term_id,
            schoolId
          );

          results.push({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            generated_count: generatedFees.length
          });

          totalGenerated += generatedFees.length;

        } catch (error) {
          results.push({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            generated_count: 0,
            error: error.message
          });
        }
      }

      logger.info(`Bulk generated ${totalGenerated} fees for class ${classId}`);

      res.json({
        success: true,
        message: `Generated ${totalGenerated} fee records for ${students.length} students`,
        data: { results }
      });

    } catch (error) {
      logger.error('Bulk generate fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating fees for class'
      });
    }
  }
}

module.exports = StudentFeeController;