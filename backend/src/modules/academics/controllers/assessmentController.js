// backend/src/modules/assessments/controllers/assessmentController.js
const Assessment = require('../models/Assessment');
const Grade = require('../models/Grade');
const db = require('../../../core/database/connection');

class AssessmentController {
  static async getAssessments(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        page = 1, 
        limit = 20, 
        class_id,
        subject_id,
        term_id,
        type,
        status 
      } = req.query;
      
      const offset = (page - 1) * limit;

      const result = await Assessment.getAllBySchool(schoolId, {
        class_id,
        subject_id,
        term_id,
        type,
        status,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          assessments: result.data,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get assessments error:', error);
      res.status(500).json({ success: false, message: 'Error fetching assessments' });
    }
  }

  static async createAssessment(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        title,
        description,
        type,
        classId,
        subjectId,
        termId,
        maxScore = 100,
        weightPercentage,
        assessmentDate,
        instructions
      } = req.body;

      if (!title || !type || !classId || !subjectId || !termId || !weightPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Required: title, type, classId, subjectId, termId, weightPercentage'
        });
      }

      const assessmentData = {
        title,
        description,
        type,
        class_id: classId,
        subject_id: subjectId,
        term_id: termId,
        max_score: maxScore,
        weight_percentage: weightPercentage,
        assessment_date: assessmentDate,
        instructions,
        created_by: req.user.userId,
        status: 'published'
      };

      const assessment = await Assessment.create(assessmentData, schoolId);

      res.status(201).json({
        success: true,
        message: 'Assessment created successfully',
        data: { assessment }
      });

    } catch (error) {
      console.error('Create assessment error:', error);
      res.status(500).json({ success: false, message: 'Error creating assessment' });
    }
  }

  static async getAssessmentDetails(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const result = await Assessment.getStudentsForAssessment(id, schoolId);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Assessment not found' });
      }

      res.json({
        success: true,
        data: {
          assessment: result.assessment,
          students: result.students
        }
      });

    } catch (error) {
      console.error('Get assessment details error:', error);
      res.status(500).json({ success: false, message: 'Error fetching assessment details' });
    }
  }

  static async submitGrades(req, res) {
    try {
      const { id } = req.params; // assessment_id
      const { grades } = req.body;
      const teacherId = req.user.userId;

      if (!grades || !Array.isArray(grades)) {
        return res.status(400).json({
          success: false,
          message: 'Grades array is required'
        });
      }

      // Get assessment to validate max_score
      const assessment = await Assessment.findById(id, req.user.schoolId);
      if (!assessment) {
        return res.status(404).json({ success: false, message: 'Assessment not found' });
      }

      // Process and validate grades
      const processedGrades = grades.map(grade => {
        const score = parseFloat(grade.score);
        const percentage = (score / assessment.max_score) * 100;
        const letterGrade = Grade.calculateLetterGrade(percentage);

        return {
          assessment_id: id,
          student_id: grade.student_id,
          teacher_id: teacherId,
          score: score,
          percentage: percentage.toFixed(2),
          letter_grade: letterGrade,
          remarks: grade.remarks || Grade.getRemarkFromGrade(letterGrade),
          status: 'published'
        };
      });

      // Bulk upsert grades
      const savedGrades = await Grade.bulkUpsert(processedGrades);

      res.json({
        success: true,
        message: `${savedGrades.length} grades submitted successfully`,
        data: { grades: savedGrades }
      });

    } catch (error) {
      console.error('Submit grades error:', error);
      res.status(500).json({ success: false, message: 'Error submitting grades' });
    }
  }
}

module.exports = AssessmentController;