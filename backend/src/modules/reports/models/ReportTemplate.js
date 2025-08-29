// backend/src/modules/reports/models/ReportTemplate.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class ReportTemplate {
  static tableName = 'report_templates';

  static async create(templateData, schoolId) {
    const [template] = await db(this.tableName)
      .insert({
        ...templateData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return template;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllBySchool(schoolId, type = null) {
    let query = db(this.tableName)
      .where({ school_id: schoolId, is_active: true });
    
    if (type) query = query.where({ type });
    
    return await query.orderBy('name');
  }

  static async getDefaultTemplate(schoolId, type) {
    return await db(this.tableName)
      .where({
        school_id: schoolId,
        type: type,
        is_default: true,
        is_active: true
      })
      .first();
  }

  static getDefaultStudentReportTemplate() {
    return {
      name: 'Standard Student Report Card',
      type: 'student_report',
      template_config: {
        header: {
          schoolName: true,
          schoolLogo: true,
          termInfo: true,
          studentPhoto: true
        },
        sections: [
          {
            name: 'student_info',
            title: 'Student Information',
            fields: ['name', 'class', 'admission_number', 'term']
          },
          {
            name: 'academic_performance',
            title: 'Academic Performance',
            fields: ['subject', 'ca_scores', 'exam_score', 'total', 'grade', 'position']
          },
          {
            name: 'summary',
            title: 'Performance Summary',
            fields: ['total_subjects', 'average_score', 'overall_position', 'remark']
          },
          {
            name: 'attendance',
            title: 'Attendance Record',
            fields: ['school_days', 'days_present', 'days_absent', 'punctuality']
          }
        ],
        footer: {
          principalSignature: true,
          classTeacherSignature: true,
          nextTermBegins: true
        }
      },
      data_fields: [
        'student_info', 'academic_results', 'attendance', 'behavioral_records'
      ],
      output_format: 'pdf'
    };
  }
}

module.exports = ReportTemplate;