
// backend/src/modules/communication/controllers/notificationController.js
const NotificationService = require('../services/notificationService');
const NotificationTemplate = require('../models/NotificationTemplate');
const db = require('../../../core/database/connection');

class NotificationController {
  // Get user's notifications
  static async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let query = db('notification_queue')
        .where({ user_id: userId, school_id: schoolId });

      if (status) query = query.where({ status });

      const notifications = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: { notifications }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
  }

  // Send manual notification
  static async sendNotification(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { type, templateKey, recipientId, data } = req.body;

      if (!type || !templateKey || !recipientId || !data) {
        return res.status(400).json({
          success: false,
          message: 'Type, template key, recipient ID, and data are required'
        });
      }

      const notification = await NotificationService.sendNotification(
        type,
        templateKey,
        recipientId,
        data,
        schoolId
      );

      res.status(201).json({
        success: true,
        message: 'Notification sent successfully',
        data: { notification }
      });

    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({ success: false, message: 'Error sending notification' });
    }
  }

  // Get notification templates
  static async getTemplates(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { type } = req.query;

      const templates = await NotificationTemplate.getAllBySchool(schoolId, type);

      res.json({
        success: true,
        data: { templates }
      });

    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ success: false, message: 'Error fetching templates' });
    }
  }
}

module.exports = NotificationController;