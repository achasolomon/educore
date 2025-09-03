// backend/src/modules/finance/controllers/paymentPlanController.js
const PaymentPlan = require('../models/PaymentPlan');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class PaymentPlanController {
  // Create payment plan for student
  static async createPaymentPlan(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { studentId } = req.params;
      const schoolId = req.user.schoolId;
      const createdBy = req.user.userId;

      const result = await PaymentPlan.createForStudent(
        studentId,
        req.body.academic_year_id,
        req.body,
        schoolId,
        createdBy
      );

      logger.info(`Payment plan created for student ${studentId}`, {
        planId: result.plan.id,
        totalAmount: result.plan.total_amount,
        installments: result.installments.length
      });

      res.status(201).json({
        success: true,
        message: 'Payment plan created successfully',
        data: result
      });

    } catch (error) {
      logger.error('Create payment plan error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating payment plan'
      });
    }
  }

  // Get payment plans for student
  static async getStudentPaymentPlans(req, res) {
    try {
      const { studentId } = req.params;
      const { academic_year_id } = req.query;
      const schoolId = req.user.schoolId;

      const plans = await PaymentPlan.findByStudent(studentId, schoolId, academic_year_id);

      res.json({
        success: true,
        data: { plans }
      });

    } catch (error) {
      logger.error('Get student payment plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment plans'
      });
    }
  }

  // Record installment payment
  static async recordInstallmentPayment(req, res) {
    try {
      const { installmentId } = req.params;
      const { payment_id, amount } = req.body;
      const schoolId = req.user.schoolId;

      const result = await PaymentPlan.recordInstallmentPayment(
        installmentId,
        payment_id,
        amount,
        schoolId
      );

      logger.info(`Installment payment recorded: ${installmentId}`, {
        amount,
        paymentId: payment_id
      });

      res.json({
        success: true,
        message: 'Installment payment recorded successfully',
        data: result
      });

    } catch (error) {
      logger.error('Record installment payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error recording installment payment'
      });
    }
  }

  // Get overdue installments
  static async getOverdueInstallments(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { grace_period_expired = true } = req.query;

      const overdueInstallments = await PaymentPlan.getOverdueInstallments(
        schoolId,
        grace_period_expired === 'true'
      );

      res.json({
        success: true,
        data: { overdue_installments: overdueInstallments }
      });

    } catch (error) {
      logger.error('Get overdue installments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching overdue installments'
      });
    }
  }

  // Get payment plan statistics
  static async getPaymentPlanStats(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const stats = await PaymentPlan.getPaymentPlanStats(schoolId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get payment plan stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment plan statistics'
      });
    }
  }
}

module.exports = PaymentPlanController;