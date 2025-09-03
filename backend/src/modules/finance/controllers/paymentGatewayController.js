// backend/src/modules/finance/controllers/paymentGatewayController.js
const PaymentGateway = require('../models/PaymentGateway');
const PaymentGatewayService = require('../services/paymentGatewayService');
const PaymentTransaction = require('../models/PaymentTransaction');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class PaymentGatewayController {
  // Get all payment gateways
  static async getAllGateways(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { active_only = true } = req.query;

      const gateways = await PaymentGateway.findBySchool(schoolId, active_only === 'true');

      res.json({
        success: true,
        data: { gateways }
      });

    } catch (error) {
      logger.error('Get all gateways error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment gateways'
      });
    }
  }

  // Initialize payment
  static async initiatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { gateway_code } = req.body;
      const schoolId = req.user.schoolId;

      const result = await PaymentGatewayService.initiatePayment(
        req.body,
        gateway_code,
        schoolId
      );

      logger.info(`Payment initiated via ${gateway_code}`, {
        transactionReference: result.transaction.transaction_reference,
        amount: result.payment.amount,
        studentId: req.body.student_id
      });

      res.status(201).json({
        success: true,
        message: 'Payment initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Initiate payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error initiating payment'
      });
    }
  }

  // Verify payment
  static async verifyPayment(req, res) {
    try {
      const { transaction_reference } = req.params;
      const schoolId = req.user.schoolId;

      const result = await PaymentGatewayService.verifyPayment(transaction_reference, schoolId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error verifying payment'
      });
    }
  }

  // Paystack webhook handler
  static async paystackWebhook(req, res) {
    try {
      const event = req.body;
      const schoolId = req.headers['x-school-id']; // Custom header for school identification

      if (event.event === 'charge.success') {
        const transactionReference = event.data.reference;
        
        await PaymentGatewayService.processSuccessfulPayment(
          transactionReference,
          event.data,
          schoolId
        );

        logger.info(`Paystack webhook: Payment successful for ${transactionReference}`);
      } else if (event.event === 'charge.failed') {
        const transactionReference = event.data.reference;
        
        await PaymentGatewayService.processFailedPayment(
          transactionReference,
          event.data,
          schoolId
        );

        logger.info(`Paystack webhook: Payment failed for ${transactionReference}`);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Paystack webhook error:', error);
      res.status(500).json({ success: false });
    }
  }

  // Flutterwave webhook handler
  static async flutterwaveWebhook(req, res) {
    try {
      const event = req.body;
      const schoolId = req.headers['x-school-id'];

      if (event.event === 'charge.completed' && event.data.status === 'successful') {
        const transactionReference = event.data.tx_ref;
        
        await PaymentGatewayService.processSuccessfulPayment(
          transactionReference,
          event.data,
          schoolId
        );

        logger.info(`Flutterwave webhook: Payment successful for ${transactionReference}`);
      } else if (event.data.status === 'failed') {
        const transactionReference = event.data.tx_ref;
        
        await PaymentGatewayService.processFailedPayment(
          transactionReference,
          event.data,
          schoolId
        );

        logger.info(`Flutterwave webhook: Payment failed for ${transactionReference}`);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Flutterwave webhook error:', error);
      res.status(500).json({ success: false });
    }
  }

  // Initialize default gateways
  static async initializeDefaults(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const gateways = await PaymentGateway.initializeDefaultGateways(schoolId);

      res.json({
        success: true,
        message: `Initialized ${gateways.length} default payment gateways`,
        data: { gateways }
      });

    } catch (error) {
      logger.error('Initialize default gateways error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default payment gateways'
      });
    }
  }

  // Get transaction statistics
  static async getTransactionStats(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { date_range = 30 } = req.query;

      const stats = await PaymentTransaction.getTransactionStats(schoolId, parseInt(date_range));

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction statistics'
      });
    }
  }
}

module.exports = PaymentGatewayController;