// backend/src/modules/communication/services/notificationService.js
const db = require('../../../core/database/connection');
const NotificationTemplate = require('../models/NotificationTemplate');
const crypto = require('crypto');

class NotificationService {
  static async sendNotification(type, templateKey, recipientId, data, schoolId) {
    try {
      // Get notification template
      const template = await NotificationTemplate.getByKey(templateKey, type, schoolId);
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      // Get recipient info
      const recipient = await db('users').where('id', recipientId).first();
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Render template content
      const content = this.renderTemplate(template.content, data);
      const subject = template.subject ? this.renderTemplate(template.subject, data) : null;

      // Determine recipient address based on type
      let recipientAddress;
      switch (type) {
        case 'email':
          recipientAddress = recipient.email;
          break;
        case 'sms':
          recipientAddress = recipient.phone;
          break;
        case 'push':
        case 'in_app':
          recipientAddress = recipient.id;
          break;
        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }

      // Queue notification
      const notification = {
        id: crypto.randomUUID(),
        school_id: schoolId,
        user_id: recipientId,
        template_id: template.id,
        type: type,
        template: templateKey,
        recipient: recipientAddress,
        subject: subject,
        content: content,
        data: JSON.stringify(data),
        status: 'pending',
        scheduled_at: new Date()
      };

      await db('notification_queue').insert(notification);
      return notification;

    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  static async sendBulkNotification(type, templateKey, recipients, data, schoolId) {
    const notifications = [];
    
    for (const recipientId of recipients) {
      try {
        const notification = await this.sendNotification(type, templateKey, recipientId, data, schoolId);
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to send notification to ${recipientId}:`, error);
      }
    }

    return notifications;
  }

  static renderTemplate(template, data) {
    let rendered = template;
    
    // Simple variable replacement: {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }

    return rendered;
  }

  // Automated notifications for system events
  static async notifyGradePublished(studentId, subjectName, grade, termName, schoolId) {
    const data = {
      student_name: await this.getStudentName(studentId),
      subject_name: subjectName,
      grade: grade,
      term_name: termName
    };

    // Get student's parents
    const parents = await this.getStudentParents(studentId);
    
    for (const parent of parents) {
      await this.sendNotification('email', 'grade_published', parent.id, data, schoolId);
      await this.sendNotification('in_app', 'grade_published', parent.id, data, schoolId);
    }
  }

  static async notifyReportReady(studentId, reportType, downloadUrl, schoolId) {
    const data = {
      student_name: await this.getStudentName(studentId),
      report_type: reportType,
      download_url: downloadUrl
    };

    const parents = await this.getStudentParents(studentId);
    
    for (const parent of parents) {
      await this.sendNotification('email', 'report_ready', parent.id, data, schoolId);
    }
  }

  static async notifyAnnouncementPublished(announcementId, schoolId) {
    const announcement = await db('announcements').where('id', announcementId).first();
    if (!announcement || !announcement.send_notification) return;

    // Get target recipients
    let recipients = [];
    if (announcement.target_audience.roles) {
      const roleUsers = await db('users')
        .select('id')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('users.school_id', schoolId)
        .whereIn('roles.name', announcement.target_audience.roles);
      
      recipients = roleUsers.map(u => u.id);
    }

    const data = {
      announcement_title: announcement.title,
      announcement_content: announcement.content,
      announcement_type: announcement.type
    };

    await this.sendBulkNotification('in_app', 'announcement_published', recipients, data, schoolId);
  }

  static async getStudentName(studentId) {
    const student = await db('students')
      .select('first_name', 'last_name')
      .where('id', studentId)
      .first();
    
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  }

  static async getStudentParents(studentId) {
    return await db('users')
      .select('users.*')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('student_guardians', 'users.id', 'student_guardians.guardian_id')
      .join('guardians', 'student_guardians.guardian_id', 'guardians.id')
      .where('student_guardians.student_id', studentId)
      .where('roles.name', 'parent');
  }
}

module.exports = NotificationService;
