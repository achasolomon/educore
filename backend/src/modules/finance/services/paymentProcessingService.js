// backend/src/modules/finance/services/paymentProcessingService.js
const PaymentReminder = require('../models/PaymentReminder');
const PaymentPlan = require('../models/PaymentPlan');
const logger = require('../../../core/utils/logger');

class PaymentProcessingService {
  /**
   * Daily payment processing tasks
   */
  static async runDailyTasks(schoolId) {
    try {
      const results = {
        overdue_reminders: 0,
        due_date_reminders: 0,
        overdue_installments: 0,
        expired_transactions: 0
      };

      // Generate overdue payment reminders
      const overdueReminders = await PaymentReminder.createForOverdueFees(schoolId);
      results.overdue_reminders = overdueReminders.length;

      // Generate due date reminders (3 days before due date)
      const dueDateReminders = await PaymentReminder.createDueDateReminders(schoolId, 3);
      results.due_date_reminders = dueDateReminders.length;

      // Update overdue installments
      const overdueInstallments = await PaymentPlan.getOverdueInstallments(schoolId);
      results.overdue_installments = overdueInstallments.length;

      // Clean up expired transactions
      const PaymentGatewayService = require('./paymentGatewayService');
      results.expired_transactions = await PaymentGatewayService.cleanupExpiredTransactions(schoolId);

      logger.info(`Daily payment tasks completed for school ${schoolId}`, results);
      
      return results;

    } catch (error) {
      logger.error('Daily payment tasks error:', error);
      throw error;
    }
  }

  /**
   * Weekly payment processing tasks
   */
  static async runWeeklyTasks(schoolId) {
    try {
      const results = {
        final_notice_reminders: 0,
        defaulted_plans: 0
      };

      // Generate final notice reminders for severely overdue fees
      const finalNoticeReminders = await this.generateFinalNoticeReminders(schoolId);
      results.final_notice_reminders = finalNoticeReminders.length;

      // Mark payment plans as defaulted if too many installments are overdue
      const defaultedPlans = await this.markDefaultedPlans(schoolId);
      results.defaulted_plans = defaultedPlans;

      logger.info(`Weekly payment tasks completed for school ${schoolId}`, results);
      
      return results;

    } catch (error) {
      logger.error('Weekly payment tasks error:', error);
      throw error;
    }
  }

  static async generateFinalNoticeReminders(schoolId) {
    // Implementation for final notice reminders
    // This would be similar to overdue reminders but for fees overdue > 30 days
    return [];
  }

  static async markDefaultedPlans(schoolId) {
    // Implementation to mark payment plans as defaulted
    // if more than 2 installments are overdue
    return 0;
  }
}

module.exports = PaymentProcessingService;