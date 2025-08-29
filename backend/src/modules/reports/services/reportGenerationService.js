// backend/src/modules/reports/services/reportGenerationService.js
const ReportTemplate = require('../models/ReportTemplate');
const GeneratedReport = require('../models/GeneratedReport');
const db = require('../../../core/database/connection');
const PDFService = require('./pdfService');
const ExcelService = require('./excelService');

class ReportGenerationService {
  static async generateStudentReport(studentId, termId, templateId, generatedBy, schoolId) {
    try {
      // Create report record
      const reportData = {
        report_name: `Student Report - ${new Date().toISOString()}`,
        report_type: 'student_report',
        template_id: templateId,
        generated_by: generatedBy,
        filters: { student_id: studentId, term_id: termId },
        metadata: { student_ids: [studentId], term_id: termId },
        status: 'generating'
      };

      const report = await GeneratedReport.create(reportData, schoolId);

      // Get template
      const template = await ReportTemplate.findById(templateId, schoolId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Gather report data
      const reportData_compiled = await this.compileStudentReportData(studentId, termId, schoolId);

      // Generate report based on format
      let filePath;
      if (template.output_format === 'pdf') {
        filePath = await PDFService.generateStudentReportPDF(reportData_compiled, template);
      } else if (template.output_format === 'excel') {
        filePath = await ExcelService.generateStudentReportExcel(reportData_compiled, template);
      }

      // Update report record
      await GeneratedReport.updateStatus(report.id, 'completed', filePath);

      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      if (report && report.id) {
        await GeneratedReport.updateStatus(report.id, 'failed', null, error.message);
      }
      throw error;
    }
  }

  static async generateClassReport(classId, termId, templateId, generatedBy, schoolId) {
    try {
      // Get all students in class
      const students = await db('students')
        .where({ class_id: classId, status: 'active' });

      const studentIds = students.map(s => s.id);

      const reportData = {
        report_name: `Class Report - ${new Date().toISOString()}`,
        report_type: 'class_report',
        template_id: templateId,
        generated_by: generatedBy,
        filters: { class_id: classId, term_id: termId },
        metadata: { student_ids: studentIds, class_id: classId, term_id: termId },
        status: 'generating'
      };

      const report = await GeneratedReport.create(reportData, schoolId);

      const template = await ReportTemplate.findById(templateId, schoolId);
      const reportData_compiled = await this.compileClassReportData(classId, termId, schoolId);

      let filePath;
      if (template.output_format === 'pdf') {
        filePath = await PDFService.generateClassReportPDF(reportData_compiled, template);
      } else if (template.output_format === 'excel') {
        filePath = await ExcelService.generateClassReportExcel(reportData_compiled, template);
      }

      await GeneratedReport.updateStatus(report.id, 'completed', filePath);
      return report;

    } catch (error) {
      console.error('Class report generation error:', error);
      throw error;
    }
  }

  static async compileStudentReportData(studentId, termId, schoolId) {
    // Get student info
    const student = await db('students')
      .select([
        'students.*',
        'classes.name as class_name',
        'classes.level as class_level'
      ])
      .join('classes', 'students.class_id', 'classes.id')
      .where('students.id', studentId)
      .first();

    // Get term info
    const term = await db('terms')
      .select(['terms.*', 'academic_years.name as academic_year_name'])
      .join('academic_years', 'terms.academic_year_id', 'academic_years.id')
      .where('terms.id', termId)
      .first();

    // Get school info
    const school = await db('schools').where('id', schoolId).first();

    // Get academic results
    const results = await db('student_results')
      .select([
        'student_results.*',
        'subjects.name as subject_name',
        'subjects.code as subject_code'
      ])
      .join('subjects', 'student_results.subject_id', 'subjects.id')
      .where('student_results.student_id', studentId)
      .where('student_results.term_id', termId)
      .orderBy('subjects.name');

    // Calculate summary statistics
    const totalSubjects = results.length;
    const totalScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
    const averageScore = totalSubjects > 0 ? (totalScore / totalSubjects).toFixed(2) : 0;

    // Get class position (overall)
    const classPosition = await this.getStudentClassPosition(studentId, termId, schoolId);

    // Get attendance data (placeholder - would integrate with attendance system)
    const attendance = {
      total_school_days: 65,
      days_present: 63,
      days_absent: 2,
      punctuality_percentage: 95
    };

    return {
      student,
      term,
      school,
      results,
      summary: {
        totalSubjects,
        averageScore,
        classPosition,
        overallGrade: this.calculateOverallGrade(averageScore)
      },
      attendance,
      generated_at: new Date()
    };
  }

  static async compileClassReportData(classId, termId, schoolId) {
    // Get class info
    const classInfo = await db('classes')
      .select([
        'classes.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      ])
      .leftJoin('users', 'classes.class_teacher_id', 'users.id')
      .where('classes.id', classId)
      .first();

    // Get term and school info
    const term = await db('terms')
      .select(['terms.*', 'academic_years.name as academic_year_name'])
      .join('academic_years', 'terms.academic_year_id', 'academic_years.id')
      .where('terms.id', termId)
      .first();

    const school = await db('schools').where('id', schoolId).first();

    // Get all student results for the class
    const studentResults = await db('student_results')
      .select([
        'students.student_id',
        'students.first_name',
        'students.last_name',
        'student_results.*',
        'subjects.name as subject_name'
      ])
      .join('students', 'student_results.student_id', 'students.id')
      .join('subjects', 'student_results.subject_id', 'subjects.id')
      .where('student_results.class_id', classId)
      .where('student_results.term_id', termId)
      .orderBy('students.first_name');

    // Calculate class statistics
    const stats = await this.calculateClassStatistics(classId, termId);

    return {
      classInfo,
      term,
      school,
      studentResults,
      statistics: stats,
      generated_at: new Date()
    };
  }

  static async getStudentClassPosition(studentId, termId, schoolId) {
    const position = await db('student_results')
      .select('class_position')
      .where('student_id', studentId)
      .where('term_id', termId)
      .first();

    return position ? position.class_position : null;
  }

  static calculateOverallGrade(averageScore) {
    if (averageScore >= 70) return 'A';
    if (averageScore >= 60) return 'B';
    if (averageScore >= 50) return 'C';
    if (averageScore >= 40) return 'D';
    return 'F';
  }

  static async calculateClassStatistics(classId, termId) {
    const stats = await db('student_results')
      .select([
        db.raw('COUNT(DISTINCT student_id) as total_students'),
        db.raw('AVG(percentage) as average_percentage'),
        db.raw('MAX(percentage) as highest_score'),
        db.raw('MIN(percentage) as lowest_score'),
        db.raw('COUNT(CASE WHEN letter_grade = \'A\' THEN 1 END) as grade_a_count'),
        db.raw('COUNT(CASE WHEN letter_grade = \'B\' THEN 1 END) as grade_b_count'),
        db.raw('COUNT(CASE WHEN letter_grade = \'C\' THEN 1 END) as grade_c_count'),
        db.raw('COUNT(CASE WHEN letter_grade = \'D\' THEN 1 END) as grade_d_count'),
        db.raw('COUNT(CASE WHEN letter_grade = \'F\' THEN 1 END) as grade_f_count')
      ])
      .where('class_id', classId)
      .where('term_id', termId)
      .first();

    return {
      ...stats,
      average_percentage: parseFloat(stats.average_percentage || 0).toFixed(2),
      pass_rate: stats.total_students > 0 ? 
        (((stats.total_students - stats.grade_f_count) / stats.total_students) * 100).toFixed(2) : 0
    };
  }
}

module.exports = ReportGenerationService;