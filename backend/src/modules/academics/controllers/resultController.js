// backend/src/modules/results/controllers/resultController.js
const StudentResult = require('../models/StudentResult');
const db = require('../../../core/database/connection');

class ResultController {
  static async getStudentResult(req, res) {
    try {
      const { studentId, termId } = req.params;
      const schoolId = req.user.schoolId;

      // Get student info
      const student = await db('students')
        .select(['id', 'student_id', 'first_name', 'last_name', 'class_id'])
        .where('id', studentId)
        .where('school_id', schoolId)
        .first();

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Get results
      const results = await StudentResult.getStudentResults(studentId, termId, schoolId);

      // Calculate overall statistics
      const totalSubjects = results.length;
      const totalScore = results.reduce((sum, r) => sum + r.percentage, 0);
      const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0;

      res.json({
        success: true,
        data: {
          student,
          results,
          summary: {
            totalSubjects,
            averageScore: averageScore.toFixed(2),
            totalScore: totalScore.toFixed(2)
          }
        }
      });

    } catch (error) {
      console.error('Get student result error:', error);
      res.status(500).json({ success: false, message: 'Error fetching results' });
    }
  }

  static async processTermResults(req, res) {
    try {
      const { termId } = req.params;
      const schoolId = req.user.schoolId;

      // Get all students in the school
      const students = await db('students')
        .where('school_id', schoolId)
        .where('status', 'active');

      let processedCount = 0;

      for (const student of students) {
        // Get all subjects the student has assessments for in this term
        const subjects = await db('assessments')
          .distinct('subject_id')
          .where('class_id', student.class_id)
          .where('term_id', termId)
          .where('school_id', schoolId);

        for (const subject of subjects) {
          await StudentResult.calculateAndSaveResults(
            student.id,
            subject.subject_id,
            student.class_id,
            termId,
            schoolId
          );
          processedCount++;
        }
      }

      // Calculate class positions for all classes
      const classes = await db('classes')
        .where('school_id', schoolId)
        .where('is_active', true);

      for (const classItem of classes) {
        await StudentResult.calculateClassPositions(classItem.id, termId, schoolId);
      }

      res.json({
        success: true,
        message: `Processed ${processedCount} results and calculated class positions`,
        data: { processedCount }
      });

    } catch (error) {
      console.error('Process term results error:', error);
      res.status(500).json({ success: false, message: 'Error processing results' });
    }
  }

  static async getClassResults(req, res) {
    try {
      const { classId, termId } = req.params;
      const schoolId = req.user.schoolId;

      const results = await db('student_results')
        .select([
          'students.student_id',
          'students.first_name',
          'students.last_name',
          'student_results.class_position',
          db.raw('AVG(student_results.percentage) as average_score'),
          db.raw('COUNT(student_results.subject_id) as subject_count')
        ])
        .join('students', 'student_results.student_id', 'students.id')
        .where('student_results.class_id', classId)
        .where('student_results.term_id', termId)
        .where('student_results.school_id', schoolId)
        .groupBy('students.id', 'student_results.class_position')
        .orderBy('student_results.class_position');

      res.json({
        success: true,
        data: { results }
      });

    } catch (error) {
      console.error('Get class results error:', error);
      res.status(500).json({ success: false, message: 'Error fetching class results' });
    }
  }
}

module.exports = ResultController;