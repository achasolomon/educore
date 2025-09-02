
// backend/src/modules/finance/controllers/paymentController.js
const Payment = require('../models/Payment');
const StudentFee = require('../models/StudentFee');
const Receipt = require('../models/Receipt');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class PaymentController {
  // Record new payment
  static async recordPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const schoolId = req.user.schoolId;
      const receivedBy = req.user.userId;

      const result = await Payment.recordPayment(req.body, schoolId, receivedBy);

      logger.info(`Payment recorded: ${result.payment.payment_reference}`, {
        paymentId: result.payment.id,
        amount: result.payment.amount,
        studentId: result.payment.student_id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: result
      });

    } catch (error) {
      logger.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error recording payment'
      });
    }
  }

  // Get payment by ID
  static async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      const schoolId = req.user.schoolId;

      const payment = await Payment.findById(paymentId, schoolId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: { payment }
      });

    } catch (error) {
      logger.error('Get payment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment'
      });
    }
  }

  // Get payments for student
  static async getStudentPayments(req, res) {
    try {
      const { studentId } = req.params;
      const schoolId = req.user.schoolId;
      const { 
        payment_status, 
        start_date, 
        end_date, 
        page = 1, 
        limit = 20 
      } = req.query;

      const filters = {
        payment_status,
        start_date,
        end_date
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const payments = await Payment.findByStudent(studentId, schoolId, filters);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedPayments = payments.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          payments: paginatedPayments,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: payments.length,
            total_pages: Math.ceil(payments.length / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get student payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching student payments'
      });
    }
  }

  // Verify payment
  static async verifyPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { verification_notes } = req.body;
      const schoolId = req.user.schoolId;
      const verifiedBy = req.user.userId;

      const payment = await Payment.verifyPayment(
        paymentId,
        schoolId,
        verifiedBy,
        verification_notes
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      logger.info(`Payment verified: ${payment.payment_reference}`, {
        paymentId,
        verifiedBy
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: { payment }
      });

    } catch (error) {
      logger.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying payment'
      });
    }
  }

  // Get payment statistics
  static async getPaymentStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { start_date, end_date, class_id } = req.query;

      const filters = {
        start_date,
        end_date,
        class_id
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const statistics = await Payment.getPaymentStatistics(schoolId, filters);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Get payment statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment statistics'
      });
    }
  }

  // Get all payments with filters
  static async getAllPayments(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        payment_status,
        payment_method,
        start_date,
        end_date,
        student_id,
        page = 1,
        limit = 20
      } = req.query;

      let query = db('payments')
        .select([
          'payments.*',
          'students.first_name',
          'students.last_name',
          'students.student_id'
        ])
        .join('students', 'payments.student_id', 'students.id')
        .where('payments.school_id', schoolId);

      // Apply filters
      if (payment_status) {
        query = query.where('payments.payment_status', payment_status);
      }

      if (payment_method) {
        query = query.where('payments.payment_method', payment_method);
      }

      if (start_date) {
        query = query.where('payments.payment_date', '>=', start_date);
      }

      if (end_date) {
        query = query.where('payments.payment_date', '<=', end_date);
      }

      if (student_id) {
        query = query.where('payments.student_id', student_id);
      }

      // Get total count for pagination
      const totalCount = await query.clone().count('* as count').first();

      // Apply pagination
      const payments = await query
        .orderBy('payments.payment_date', 'desc')
        .limit(parseInt(limit))
        .offset((parseInt(page) - 1) * parseInt(limit));

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: parseInt(totalCount.count),
            total_pages: Math.ceil(totalCount.count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get all payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payments'
      });
    }
  }

  // Generate payment receipt
  static async generateReceipt(req, res) {
    try {
      const { paymentId } = req.params;
      const schoolId = req.user.schoolId;

      // Get payment details
      const payment = await Payment.findById(paymentId, schoolId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Generate receipt using Receipt model
      const receipt = await Receipt.generateForPayment(payment, schoolId, req.user.userId);

      res.json({
        success: true,
        message: 'Receipt generated successfully',
        data: { receipt }
      });

    } catch (error) {
      logger.error('Generate receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating receipt'
      });
    }
  }
}

module.exports = PaymentController;