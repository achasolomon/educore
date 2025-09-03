// backend/src/modules/finance/models/PaymentPlan.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class PaymentPlan {
  static tableName = 'payment_plans';

  static async create(planData, schoolId) {
    const [plan] = await db(this.tableName)
      .insert({
        ...planData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        balance: planData.remaining_amount
      })
      .returning('*');
    return plan;
  }

  static async createForStudent(studentId, academicYearId, planDetails, schoolId, createdBy) {
    const trx = await db.transaction();

    try {
      // Create payment plan
      const planData = {
        student_id: studentId,
        academic_year_id: academicYearId,
        plan_name: planDetails.plan_name,
        total_amount: planDetails.total_amount,
        down_payment: planDetails.down_payment || 0,
        remaining_amount: planDetails.total_amount - (planDetails.down_payment || 0),
        number_of_installments: planDetails.number_of_installments,
        installment_amount: planDetails.installment_amount,
        start_date: planDetails.start_date,
        end_date: planDetails.end_date,
        frequency: planDetails.frequency || 'monthly',
        grace_period_days: planDetails.grace_period_days || 7,
        terms_and_conditions: planDetails.terms_and_conditions,
        created_by: createdBy
      };

      const plan = await this.create(planData, schoolId);

      // Generate installments
      const installments = await this.generateInstallments(plan, schoolId, trx);

      await trx.commit();

      return {
        plan,
        installments
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async generateInstallments(plan, schoolId, trx = null) {
    const dbInstance = trx || db;
    const installments = [];

    const startDate = new Date(plan.start_date);
    let currentDate = new Date(startDate);

    for (let i = 1; i <= plan.number_of_installments; i++) {
      const gracePeriodEnd = new Date(currentDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + plan.grace_period_days);

      const installmentData = {
        id: crypto.randomUUID(),
        payment_plan_id: plan.id,
        school_id: schoolId,
        installment_number: i,
        amount: plan.installment_amount,
        balance: plan.installment_amount,
        due_date: currentDate.toISOString().split('T')[0],
        grace_period_end: gracePeriodEnd.toISOString().split('T')[0],
        total_amount_due: plan.installment_amount
      };

      await dbInstance('payment_plan_installments').insert(installmentData);
      installments.push(installmentData);

      // Calculate next due date based on frequency
      switch (plan.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi_weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }
    }

    return installments;
  }

  static async findByStudent(studentId, schoolId, academicYearId = null) {
    let query = db(this.tableName)
      .where('student_id', studentId)
      .where('school_id', schoolId);

    if (academicYearId) {
      query = query.where('academic_year_id', academicYearId);
    }

    return await query.orderBy('created_at', 'desc');
  }

  static async recordInstallmentPayment(installmentId, paymentId, amount, schoolId) {
    const trx = await db.transaction();

    try {
      // Get installment details
      const installment = await trx('payment_plan_installments')
        .where({ id: installmentId, school_id: schoolId })
        .first();

      if (!installment) {
        throw new Error('Installment not found');
      }

      const paymentAmount = parseFloat(amount);
      const newBalance = parseFloat(installment.balance) - paymentAmount;
      const newAmountPaid = parseFloat(installment.amount_paid) + paymentAmount;

      let newStatus = installment.status;
      if (newBalance <= 0) {
        newStatus = 'paid';
      }

      // Update installment
      await trx('payment_plan_installments')
        .where({ id: installmentId })
        .update({
          amount_paid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          payment_id: paymentId,
          paid_at: newStatus === 'paid' ? new Date() : installment.paid_at,
          updated_at: new Date()
        });

      // Update payment plan
      const paymentPlan = await trx(this.tableName)
        .where({ id: installment.payment_plan_id })
        .first();

      const newPlanAmountPaid = parseFloat(paymentPlan.amount_paid) + paymentAmount;
      const newPlanBalance = parseFloat(paymentPlan.balance) - paymentAmount;
      const newInstallmentsPaid = newStatus === 'paid' ? 
        paymentPlan.installments_paid + 1 : paymentPlan.installments_paid;

      let planStatus = paymentPlan.status;
      if (newPlanBalance <= 0) {
        planStatus = 'completed';
      }

      await trx(this.tableName)
        .where({ id: installment.payment_plan_id })
        .update({
          amount_paid: newPlanAmountPaid,
          balance: Math.max(0, newPlanBalance),
          installments_paid: newInstallmentsPaid,
          status: planStatus,
          updated_at: new Date()
        });

      await trx.commit();

      return {
        installment_updated: true,
        plan_updated: true,
        new_installment_balance: Math.max(0, newBalance),
        new_plan_balance: Math.max(0, newPlanBalance)
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async getOverdueInstallments(schoolId, gracePeriodExpired = true) {
    let query = db('payment_plan_installments')
      .select([
        'payment_plan_installments.*',
        'payment_plans.student_id',
        'payment_plans.plan_name',
        'students.first_name',
        'students.last_name',
        'students.parent_phone',
        'students.parent_email'
      ])
      .join('payment_plans', 'payment_plan_installments.payment_plan_id', 'payment_plans.id')
      .join('students', 'payment_plans.student_id', 'students.id')
      .where('payment_plan_installments.school_id', schoolId)
      .where('payment_plan_installments.status', 'pending')
      .where('payment_plan_installments.balance', '>', 0);

    if (gracePeriodExpired) {
      query = query.where('payment_plan_installments.grace_period_end', '<', new Date().toISOString().split('T')[0]);
    } else {
      query = query.where('payment_plan_installments.due_date', '<', new Date().toISOString().split('T')[0]);
    }

    const overdueInstallments = await query.orderBy('payment_plan_installments.due_date', 'asc');

    // Update overdue status and days
    for (const installment of overdueInstallments) {
      const daysOverdue = Math.floor((new Date() - new Date(installment.due_date)) / (1000 * 60 * 60 * 24));
      
      await db('payment_plan_installments')
        .where('id', installment.id)
        .update({
          status: 'overdue',
          days_overdue: daysOverdue,
          updated_at: new Date()
        });

      // Also update the payment plan's overdue installments count
      await db('payment_plans')
        .where('id', installment.payment_plan_id)
        .update({
          installments_overdue: db.raw('installments_overdue + 1'),
          updated_at: new Date()
        });
    }

    return overdueInstallments;
  }

  static async getPaymentPlanStats(schoolId) {
    const stats = await db(this.tableName)
      .select([
        'status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(total_amount) as total_amount'),
        db.raw('SUM(amount_paid) as amount_paid'),
        db.raw('SUM(balance) as balance')
      ])
      .where('school_id', schoolId)
      .groupBy('status');

    const summary = {
      total_plans: 0,
      total_amount: 0,
      amount_paid: 0,
      balance: 0,
      by_status: {}
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const totalAmount = parseFloat(stat.total_amount || 0);
      const amountPaid = parseFloat(stat.amount_paid || 0);
      const balance = parseFloat(stat.balance || 0);

      summary.total_plans += count;
      summary.total_amount += totalAmount;
      summary.amount_paid += amountPaid;
      summary.balance += balance;

      summary.by_status[stat.status] = {
        count,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance
      };
    });

    return summary;
  }
}

module.exports = PaymentPlan;