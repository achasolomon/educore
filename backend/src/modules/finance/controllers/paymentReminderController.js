
// backend/src/modules/finance/controllers/paymentReminderController.js
const PaymentReminder = require('../models/PaymentReminder');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class PaymentReminderController {
  // Generate overdue payment reminders
  static async generateOverdueReminders(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const reminders = await PaymentReminder.createForOverdueFees(schoolId);

      logger.info(`Generated ${reminders.length} overdue payment reminders`);

      res.json({
        success: true,
        message: `Generated ${reminders.length} overdue payment reminders`,
        data: { reminders }
      });

    } catch (error) {
      logger.error('Generate overdue reminders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating overdue reminders'
      });
    }
  }

  // Generate due date reminders
  static async generateDueDateReminders(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { days_before = 3 } = req.query;

      const reminders = await PaymentReminder.createDueDateReminders(
        schoolId, 
        parseInt(days_before)
      );

      logger.info(`Generated ${reminders.length} due date reminders`);

      res.json({
        success: true,
        message: `Generated ${reminders.length} due date reminders`,
        data: { reminders }
      });

    } catch (error) {
      logger.error('Generate due date reminders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating due date reminders'
      });
    }
  }

  // Get pending reminders for processing
  static async getPendingReminders(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { limit = 50 } = req.query;

      const reminders = await PaymentReminder.getPendingReminders(schoolId, parseInt(limit));

      res.json({
        success: true,
        data: { reminders }
      });

    } catch (error) {
      logger.error('Get pending reminders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending reminders'
      });
    }
  }

  // Mark reminder as sent
  static async markReminderSent(req, res) {
    try {
      const { reminderId } = req.params;
      const { delivery_result } = req.body;
      const schoolId = req.user.schoolId;

      const reminder = await PaymentReminder.markAsSent(reminderId, delivery_result, schoolId);

      res.json({
        success: true,
        message: 'Reminder status updated successfully',
        data: { reminder }
      });

    } catch (error) {
      logger.error('Mark reminder sent error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating reminder status'
      });
    }
  }

  // Get reminder statistics
  static async getReminderStats(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { date_range = 30 } = req.query;

      const stats = await PaymentReminder.getReminderStats(schoolId, parseInt(date_range));

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Get reminder stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reminder statistics'
      });
    }
  }
}

module.exports = PaymentReminderController;