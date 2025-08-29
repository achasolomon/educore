// backend/src/modules/communication/models/NotificationTemplate.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class NotificationTemplate {
  static tableName = 'notification_templates';

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

  static async getByKey(templateKey, type, schoolId) {
    return await db(this.tableName)
      .where({
        template_key: templateKey,
        type: type,
        school_id: schoolId,
        is_active: true
      })
      .first();
  }

  static async getAllBySchool(schoolId, type = null) {
    let query = db(this.tableName)
      .where({ school_id: schoolId, is_active: true });
    
    if (type) query = query.where({ type });
    
    return await query.orderBy('name');
  }

  static getDefaultTemplates() {
    return [
      {
        name: 'Grade Published',
        template_key: 'grade_published',
        type: 'email',
        subject: 'New Grade Available for {{student_name}}',
        content: 'Dear Parent,\n\nA new grade has been published for {{student_name}} in {{subject_name}}.\n\nGrade: {{grade}}\nTerm: {{term_name}}\n\nPlease log in to view the complete details.\n\nBest regards,\nSchool Administration',
        variables: ['student_name', 'subject_name', 'grade', 'term_name'],
        is_system_template: true
      },
      {
        name: 'Report Ready',
        template_key: 'report_ready',
        type: 'email',
        subject: '{{report_type}} Ready for {{student_name}}',
        content: 'Dear Parent,\n\nThe {{report_type}} for {{student_name}} is now ready for download.\n\nYou can access it here: {{download_url}}\n\nBest regards,\nSchool Administration',
        variables: ['student_name', 'report_type', 'download_url'],
        is_system_template: true
      },
      {
        name: 'Announcement Published',
        template_key: 'announcement_published',
        type: 'in_app',
        subject: 'New {{announcement_type}} Announcement',
        content: '{{announcement_title}}\n\n{{announcement_content}}',
        variables: ['announcement_title', 'announcement_content', 'announcement_type'],
        is_system_template: true
      }
    ];
  }

  static async seedDefaultTemplates(schoolId, createdBy) {
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      await this.create({
        ...template,
        created_by: createdBy
      }, schoolId);
    }
  }
}

module.exports = NotificationTemplate;