// backend/src/modules/finance/models/PaymentReminder.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class PaymentReminder {
  static tableName = 'payment_reminders';

  static async create(reminderData, schoolId) {
    const [reminder] = await db(this.tableName)
      .insert({
        ...reminderData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return reminder;
  }

  static async createForOverdueFees(schoolId) {
    try {
      const StudentFee = require('./StudentFee');
      const overdueFeesQuery = db('student_fees')
        .select([
          'student_fees.*',
          'students.first_name',
          'students.last_name',
          'students.phone as student_phone',
          'students.parent_phone',
          'students.parent_email',
          'fee_categories.name as category_name'
        ])
        .join('students', 'student_fees.student_id', 'students.id')
        .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
        .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
        .where('student_fees.school_id', schoolId)
        .where('student_fees.is_overdue', true)
        .where('student_fees.balance', '>', 0);

      const overdueFees = await overdueFeesQuery;
      const reminders = [];

      for (const fee of overdueFees) {
        // Check if reminder already sent today
        const existingReminder = await db(this.tableName)
          .where('student_fee_id', fee.id)
          .where('reminder_type', 'overdue')
          .whereRaw('DATE(created_at) = CURRENT_DATE')
          .first();

        if (!existingReminder) {
          const daysOverdue = Math.floor((new Date() - new Date(fee.due_date)) / (1000 * 60 * 60 * 24));
          
          let reminderType = 'overdue';
          let messageTitle = 'Fee Payment Overdue';
          let deliveryMethod = 'sms';

          // Escalate reminder based on days overdue
          if (daysOverdue >= 30) {
            reminderType = 'final_notice';
            messageTitle = 'Final Notice - Fee Payment Required';
            deliveryMethod = 'all'; // Send via all channels
          }

          const messageContent = `
            Dear Parent/Guardian,

            This is a ${reminderType === 'final_notice' ? 'FINAL NOTICE' : 'reminder'} that the ${fee.category_name} fee for ${fee.first_name} ${fee.last_name} is overdue by ${daysOverdue} days.

            Outstanding Amount: ₦${parseFloat(fee.balance).toLocaleString()}
            Due Date: ${new Date(fee.due_date).toLocaleDateString()}

            Please make payment as soon as possible to avoid further complications.

            Thank you.
          `.trim();

          const reminderData = {
            student_id: fee.student_id,
            student_fee_id: fee.id,
            reminder_type: reminderType,
            message_title: messageTitle,
            message_content: messageContent,
            outstanding_amount: fee.balance,
            due_date: fee.due_date,
            days_overdue: daysOverdue,
            delivery_method: deliveryMethod,
            scheduled_for: new Date()
          };

          const reminder = await this.create(reminderData, schoolId);
          reminders.push(reminder);
        }
      }

      return reminders;

    } catch (error) {
      throw new Error(`Failed to create overdue reminders: ${error.message}`);
    }
  }

  static async createDueDateReminders(schoolId, daysBefore = 3) {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysBefore);

      const upcomingFeesQuery = db('student_fees')
        .select([
          'student_fees.*',
          'students.first_name',
          'students.last_name',
          'students.phone as student_phone',
          'students.parent_phone',
          'students.parent_email',
          'fee_categories.name as category_name'
        ])
        .join('students', 'student_fees.student_id', 'students.id')
        .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
        .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
        .where('student_fees.school_id', schoolId)
        .where('student_fees.due_date', dueDate.toISOString().split('T')[0])
        .where('student_fees.balance', '>', 0)
        .whereNot('student_fees.status', 'paid');

      const upcomingFees = await upcomingFeesQuery;
      const reminders = [];

      for (const fee of upcomingFees) {
        // Check if reminder already sent for this due date
        const existingReminder = await db(this.tableName)
          .where('student_fee_id', fee.id)
          .where('reminder_type', 'due_date')
          .where('due_date', fee.due_date)
          .first();

        if (!existingReminder) {
          const messageContent = `
            Dear Parent/Guardian,

            This is a friendly reminder that the ${fee.category_name} fee for ${fee.first_name} ${fee.last_name} is due in ${daysBefore} days.

            Amount Due: ₦${parseFloat(fee.balance).toLocaleString()}
            Due Date: ${new Date(fee.due_date).toLocaleDateString()}

            Please make payment before the due date to avoid late fees.

            Thank you.
          `.trim();

          const reminderData = {
            student_id: fee.student_id,
            student_fee_id: fee.id,
            reminder_type: 'due_date',
            message_title: 'Fee Payment Due Soon',
            message_content: messageContent,
            outstanding_amount: fee.balance,
            due_date: fee.due_date,
            days_overdue: 0,
            delivery_method: 'sms',
            scheduled_for: new Date()
          };

          const reminder = await this.create(reminderData, schoolId);
          reminders.push(reminder);
        }
      }

      return reminders;

    } catch (error) {
      throw new Error(`Failed to create due date reminders: ${error.message}`);
    }
  }

  static async markAsSent(id, deliveryResult, schoolId) {
    const updateData = {
      status: deliveryResult.success ? 'sent' : 'failed',
      sent_at: new Date(),
      updated_at: new Date()
    };

    if (deliveryResult.success && deliveryResult.delivered_at) {
      updateData.status = 'delivered';
      updateData.delivered_at = deliveryResult.delivered_at;
    }

    if (!deliveryResult.success) {
      updateData.delivery_error = deliveryResult.error;
      updateData.retry_count = db.raw('retry_count + 1');
    }

    const [reminder] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update(updateData)
      .returning('*');

    return reminder;
  }

  static async getPendingReminders(schoolId, limit = 50) {
    return await db(this.tableName)
      .where('school_id', schoolId)
      .where('status', 'pending')
      .where('scheduled_for', '<=', new Date().toISOString())
      .orderBy('scheduled_for', 'asc')
      .limit(limit);
  }

  static async getReminderStats(schoolId, dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const stats = await db(this.tableName)
      .select([
        'reminder_type',
        'status',
        'delivery_method',
        db.raw('COUNT(*) as count')
      ])
      .where('school_id', schoolId)
      .where('created_at', '>=', startDate.toISOString())
      .groupBy(['reminder_type', 'status', 'delivery_method']);

    return stats;
  }
}

module.exports = PaymentReminder;
