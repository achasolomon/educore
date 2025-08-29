// backend/src/modules/analytics/controllers/analyticsController.js
const db = require('../../../core/database/connection');

class AnalyticsController {
  // School dashboard analytics
  static async getSchoolDashboard(req, res) {
    try {
      const schoolId = req.user.schoolId;

      // Get basic counts
      const stats = await db.raw(`
        SELECT 
          (SELECT COUNT(*) FROM students WHERE school_id = ? AND status = 'active') as total_students,
          (SELECT COUNT(*) FROM users WHERE school_id = ? AND status = 'active') as total_staff,
          (SELECT COUNT(*) FROM classes WHERE school_id = ? AND is_active = true) as total_classes,
          (SELECT COUNT(*) FROM subjects WHERE school_id = ? AND is_active = true) as total_subjects
      `, [schoolId, schoolId, schoolId, schoolId]);

      // Get grade distribution for current term
      const currentTerm = await db('terms')
        .join('academic_years', 'terms.academic_year_id', 'academic_years.id')
        .where('academic_years.school_id', schoolId)
        .where('terms.is_current', true)
        .first();

      let gradeDistribution = [];
      if (currentTerm) {
        gradeDistribution = await db('student_results')
          .select([
            'letter_grade',
            db.raw('COUNT(*) as count')
          ])
          .where('school_id', schoolId)
          .where('term_id', currentTerm.id)
          .groupBy('letter_grade')
          .orderBy('letter_grade');
      }

      // Get recent activity
      const recentReports = await db('generated_reports')
        .select(['report_name', 'status', 'created_at'])
        .where('school_id', schoolId)
        .orderBy('created_at', 'desc')
        .limit(5);

      res.json({
        success: true,
        data: {
          overview: stats.rows[0],
          gradeDistribution,
          recentActivity: recentReports
        }
      });

    } catch (error) {
      console.error('Get school dashboard error:', error);
      res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }
  }

  // Class performance analytics
  static async getClassAnalytics(req, res) {
    try {
      const { classId, termId } = req.params;
      const schoolId = req.user.schoolId;

      // Get class info
      const classInfo = await db('classes')
        .where({ id: classId, school_id: schoolId })
        .first();

      if (!classInfo) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get performance statistics
      const stats = await db('student_results')
        .select([
          db.raw('COUNT(DISTINCT student_id) as total_students'),
          db.raw('AVG(percentage) as average_percentage'),
          db.raw('MAX(percentage) as highest_score'),
          db.raw('MIN(percentage) as lowest_score'),
          db.raw('STDDEV(percentage) as standard_deviation')
        ])
        .where('class_id', classId)
        .where('term_id', termId)
        .first();

      // Get subject-wise performance
      const subjectPerformance = await db('student_results')
        .select([
          'subjects.name as subject_name',
          db.raw('AVG(student_results.percentage) as average_score'),
          db.raw('COUNT(student_results.student_id) as student_count')
        ])
        .join('subjects', 'student_results.subject_id', 'subjects.id')
        .where('student_results.class_id', classId)
        .where('student_results.term_id', termId)
        .groupBy('subjects.id', 'subjects.name')
        .orderBy('average_score', 'desc');

      // Get top performers
      const topPerformers = await db('student_results')
        .select([
          'students.first_name',
          'students.last_name',
          db.raw('AVG(student_results.percentage) as average_score')
        ])
        .join('students', 'student_results.student_id', 'students.id')
        .where('student_results.class_id', classId)
        .where('student_results.term_id', termId)
        .groupBy('students.id', 'students.first_name', 'students.last_name')
        .orderBy('average_score', 'desc')
        .limit(5);

      res.json({
        success: true,
        data: {
          classInfo,
          statistics: {
            ...stats,
            average_percentage: parseFloat(stats.average_percentage || 0).toFixed(2),
            standard_deviation: parseFloat(stats.standard_deviation || 0).toFixed(2)
          },
          subjectPerformance,
          topPerformers
        }
      });

    } catch (error) {
      console.error('Get class analytics error:', error);
      res.status(500).json({ success: false, message: 'Error fetching class analytics' });
    }
  }

  // Subject performance analytics
  static async getSubjectAnalytics(req, res) {
    try {
      const { subjectId, termId } = req.params;
      const schoolId = req.user.schoolId;

      // Get subject info
      const subject = await db('subjects')
        .where({ id: subjectId, school_id: schoolId })
        .first();

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Get overall subject performance
      const stats = await db('student_results')
        .select([
          db.raw('COUNT(*) as total_students'),
          db.raw('AVG(percentage) as average_percentage'),
          db.raw('MAX(percentage) as highest_score'),
          db.raw('MIN(percentage) as lowest_score')
        ])
        .where('subject_id', subjectId)
        .where('term_id', termId)
        .where('school_id', schoolId)
        .first();

      // Get class-wise performance
      const classPerformance = await db('student_results')
        .select([
          'classes.name as class_name',
          db.raw('AVG(student_results.percentage) as average_score'),
          db.raw('COUNT(student_results.student_id) as student_count')
        ])
        .join('classes', 'student_results.class_id', 'classes.id')
        .where('student_results.subject_id', subjectId)
        .where('student_results.term_id', termId)
        .where('student_results.school_id', schoolId)
        .groupBy('classes.id', 'classes.name')
        .orderBy('average_score', 'desc');

      res.json({
        success: true,
        data: {
          subject,
          statistics: {
            ...stats,
            average_percentage: parseFloat(stats.average_percentage || 0).toFixed(2)
          },
          classPerformance
        }
      });

    } catch (error) {
      console.error('Get subject analytics error:', error);
      res.status(500).json({ success: false, message: 'Error fetching subject analytics' });
    }
  }
}

module.exports = AnalyticsController;
