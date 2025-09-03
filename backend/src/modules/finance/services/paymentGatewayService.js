
// backend/src/modules/finance/services/paymentGatewayService.js
const PaymentGateway = require('../models/PaymentGateway');
const PaymentTransaction = require('../models/PaymentTransaction');
const Payment = require('../models/Payment');
const logger = require('../../../core/utils/logger');

class PaymentGatewayService {
  /**
   * Initialize payment for a student fee
   */
  static async initiatePayment(paymentData, gatewayCode, schoolId) {
    try {
      const gateway = await PaymentGateway.findByCode(gatewayCode, schoolId);
      
      if (!gateway) {
        throw new Error('Payment gateway not found');
      }

      if (!gateway.is_active) {
        throw new Error('Payment gateway is not active');
      }

      // Validate amount limits
      const amount = parseFloat(paymentData.amount);
      if (gateway.minimum_amount && amount < gateway.minimum_amount) {
        throw new Error(`Minimum payment amount is ₦${gateway.minimum_amount}`);
      }

      if (gateway.maximum_amount && amount > gateway.maximum_amount) {
        throw new Error(`Maximum payment amount is ₦${gateway.maximum_amount}`);
      }

      // Calculate fees
      const feeCalculation = await PaymentGateway.calculateTransactionFee(gateway.id, amount);

      // Create payment record
      const payment = await Payment.create({
        ...paymentData,
        gateway_name: gateway.name,
        gateway_fee: feeCalculation.total_fee,
        payment_status: 'pending'
      }, schoolId);

      // Create transaction record
      const transaction = await PaymentTransaction.create({
        payment_id: payment.id,
        gateway_id: gateway.id,
        amount: amount,
        gateway_fee: feeCalculation.total_fee,
        net_amount: feeCalculation.net_amount,
        customer_email: paymentData.customer_email,
        customer_phone: paymentData.customer_phone,
        expires_at: new Date(Date.now() + (30 * 60 * 1000)) // 30 minutes expiry
      }, schoolId);

      // Initialize payment based on gateway type
      let paymentInitResult;
      switch (gateway.gateway_type) {
        case 'online':
          paymentInitResult = await this.initializeOnlinePayment(transaction, gateway, schoolId);
          break;
        case 'offline':
          paymentInitResult = await this.initializeOfflinePayment(transaction, gateway, schoolId);
          break;
        case 'manual':
          paymentInitResult = await this.initializeManualPayment(transaction, gateway, schoolId);
          break;
        default:
          throw new Error('Unsupported gateway type');
      }

      logger.info(`Payment initiated via ${gateway.name}`, {
        transactionReference: transaction.transaction_reference,
        amount,
        studentId: paymentData.student_id
      });

      return {
        payment,
        transaction,
        gateway,
        ...paymentInitResult
      };

    } catch (error) {
      logger.error('Payment initiation error:', error);
      throw error;
    }
  }

  /**
   * Initialize online payment (Paystack, Flutterwave)
   */
  static async initializeOnlinePayment(transaction, gateway, schoolId) {
    switch (gateway.code) {
      case 'PAYSTACK':
        return await this.initializePaystackPayment(transaction, gateway, schoolId);
      case 'FLUTTERWAVE':
        return await this.initializeFlutterwavePayment(transaction, gateway, schoolId);
      default:
        throw new Error('Unsupported online gateway');
    }
  }

  /**
   * Initialize Paystack payment (free integration)
   */
  static async initializePaystackPayment(transaction, gateway, schoolId) {
    try {
      // For free implementation, we'll create the payment URL manually
      // In production, you'd use Paystack's SDK here
      
      const config = gateway.config;
      const paymentUrl = `https://checkout.paystack.com/${config.public_key}`;
      
      const paymentData = {
        reference: transaction.transaction_reference,
        amount: transaction.amount * 100, // Paystack uses kobo
        email: transaction.customer_email,
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          student_id: transaction.student_id,
          school_id: schoolId
        }
      };

      // Update transaction with gateway details
      await PaymentTransaction.updateStatus(
        transaction.id,
        'processing',
        { 
          paystack_reference: transaction.transaction_reference,
          initialization_data: paymentData 
        },
        schoolId
      );

      return {
        payment_url: paymentUrl,
        reference: transaction.transaction_reference,
        public_key: config.public_key,
        payment_data: paymentData
      };

    } catch (error) {
      logger.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize Paystack payment');
    }
  }

  /**
   * Initialize Flutterwave payment (free integration)
   */
  static async initializeFlutterwavePayment(transaction, gateway, schoolId) {
    try {
      const config = gateway.config;
      
      const paymentData = {
        tx_ref: transaction.transaction_reference,
        amount: transaction.amount,
        currency: 'NGN',
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: transaction.customer_email,
          phone_number: transaction.customer_phone
        },
        customizations: {
          title: 'School Fee Payment',
          description: 'Payment for school fees'
        },
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`
      };

      // Update transaction with gateway details
      await PaymentTransaction.updateStatus(
        transaction.id,
        'processing',
        { 
          flutterwave_reference: transaction.transaction_reference,
          initialization_data: paymentData 
        },
        schoolId
      );

      return {
        public_key: config.public_key,
        payment_data: paymentData,
        reference: transaction.transaction_reference
      };

    } catch (error) {
      logger.error('Flutterwave initialization error:', error);
      throw new Error('Failed to initialize Flutterwave payment');
    }
  }

  /**
   * Initialize offline payment (Bank Transfer)
   */
  static async initializeOfflinePayment(transaction, gateway, schoolId) {
    // Get school bank details (you'd store this in school settings)
    const bankDetails = {
      bank_name: 'Example Bank',
      account_number: '1234567890',
      account_name: 'School Name',
      reference: transaction.transaction_reference
    };

    await PaymentTransaction.updateStatus(
      transaction.id,
      'pending',
      { bank_details: bankDetails },
      schoolId
    );

    return {
      bank_details: bankDetails,
      instructions: `Please transfer ₦${transaction.amount} to the account details above and use ${transaction.transaction_reference} as your reference.`
    };
  }

  /**
   * Initialize manual payment (Cash, POS)
   */
  static async initializeManualPayment(transaction, gateway, schoolId) {
    await PaymentTransaction.updateStatus(
      transaction.id,
      'pending',
      { manual_payment: true },
      schoolId
    );

    return {
      instructions: `Please proceed to the school's finance office to complete your cash payment.`,
      reference: transaction.transaction_reference
    };
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(transactionReference, schoolId) {
    try {
      const transaction = await PaymentTransaction.findByReference(transactionReference, schoolId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const gateway = await PaymentGateway.findById(transaction.gateway_id);
      
      if (!gateway) {
        throw new Error('Gateway not found');
      }

      let verificationResult;
      switch (gateway.code) {
        case 'PAYSTACK':
          verificationResult = await this.verifyPaystackPayment(transaction, gateway);
          break;
        case 'FLUTTERWAVE':
          verificationResult = await this.verifyFlutterwavePayment(transaction, gateway);
          break;
        default:
          // For manual/offline payments, return current status
          verificationResult = {
            status: transaction.status,
            verified: transaction.status === 'success'
          };
      }

      return {
        transaction,
        verification: verificationResult
      };

    } catch (error) {
      logger.error('Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Verify Paystack payment (free verification)
   */
  static async verifyPaystackPayment(transaction, gateway) {
    try {
      // For free implementation, we'll simulate verification
      // In production, you'd call Paystack's verification API
      
      return {
        status: transaction.status,
        verified: true,
        gateway_response: {
          reference: transaction.transaction_reference,
          amount: transaction.amount * 100,
          status: transaction.status,
          paid_at: transaction.completed_at
        }
      };

    } catch (error) {
      logger.error('Paystack verification error:', error);
      throw error;
    }
  }

  /**
   * Verify Flutterwave payment
   */
  static async verifyFlutterwavePayment(transaction, gateway) {
    try {
      // For free implementation, we'll simulate verification
      // In production, you'd call Flutterwave's verification API
      
      return {
        status: transaction.status,
        verified: true,
        gateway_response: {
          tx_ref: transaction.transaction_reference,
          amount: transaction.amount,
          status: transaction.status,
          charged_at: transaction.completed_at
        }
      };

    } catch (error) {
      logger.error('Flutterwave verification error:', error);
      throw error;
    }
  }

  /**
   * Process successful payment
   */
  static async processSuccessfulPayment(transactionReference, gatewayResponse, schoolId) {
    try {
      const transaction = await PaymentTransaction.findByReference(transactionReference, schoolId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status
      await PaymentTransaction.updateStatus(
        transaction.id,
        'success',
        gatewayResponse,
        schoolId
      );

      // Update payment status and allocate to student fees
      const payment = await Payment.findById(transaction.payment_id, schoolId);
      
      if (payment) {
        // Mark payment as completed and verify
        await Payment.verifyPayment(
          payment.id,
          schoolId,
          'system', // System verified
          'Payment verified via gateway callback'
        );

        // Allocate payment to student fees
        const StudentFee = require('../models/StudentFee');
        await this.allocatePaymentToFees(payment, schoolId);
      }

      logger.info(`Payment processed successfully: ${transactionReference}`);

      return {
        success: true,
        transaction,
        payment
      };

    } catch (error) {
      logger.error('Process successful payment error:', error);
      throw error;
    }
  }

  /**
   * Allocate payment to outstanding fees
   */
  static async allocatePaymentToFees(payment, schoolId) {
    try {
      const StudentFee = require('../models/StudentFee');
      const db = require('../../../core/database/connection');
      
      let remainingAmount = parseFloat(payment.amount);

      // Get outstanding fees for the student
      const outstandingFees = await StudentFee.findByStudent(
        payment.student_id,
        schoolId
      );

      // Filter and sort fees by priority
      const feesToPay = outstandingFees
        .filter(fee => fee.balance > 0)
        .sort((a, b) => {
          if (a.is_overdue && !b.is_overdue) return -1;
          if (!a.is_overdue && b.is_overdue) return 1;
          return new Date(a.due_date) - new Date(b.due_date);
        });

      // Allocate payment to fees
      for (const fee of feesToPay) {
        if (remainingAmount <= 0) break;

        const feeBalance = parseFloat(fee.balance);
        const allocationAmount = Math.min(remainingAmount, feeBalance);

        if (allocationAmount > 0) {
          // Create allocation record
          await db('payment_allocations').insert({
            id: require('crypto').randomUUID(),
            payment_id: payment.id,
            student_fee_id: fee.id,
            school_id: schoolId,
            allocated_amount: allocationAmount
          });

          // Update student fee
          await StudentFee.applyPayment(fee.id, allocationAmount, schoolId);

          remainingAmount -= allocationAmount;
        }
      }

      return {
        allocated_amount: parseFloat(payment.amount) - remainingAmount,
        remaining_amount: remainingAmount
      };

    } catch (error) {
      logger.error('Allocate payment to fees error:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  static async processFailedPayment(transactionReference, gatewayResponse, schoolId) {
    try {
      const transaction = await PaymentTransaction.findByReference(transactionReference, schoolId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status
      await PaymentTransaction.updateStatus(
        transaction.id,
        'failed',
        gatewayResponse,
        schoolId
      );

      // Update payment status
      const payment = await Payment.findById(transaction.payment_id, schoolId);
      if (payment) {
        await Payment.updateStatus(payment.id, 'failed', schoolId);
      }

      logger.info(`Payment failed: ${transactionReference}`, {
        reason: gatewayResponse.message || 'Unknown error'
      });

      return {
        success: false,
        transaction,
        payment,
        error: gatewayResponse.message || 'Payment failed'
      };

    } catch (error) {
      logger.error('Process failed payment error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired transactions
   */
  static async cleanupExpiredTransactions(schoolId) {
    try {
      const expiredTransactions = await db('payment_transactions')
        .where('school_id', schoolId)
        .where('status', 'pending')
        .where('expires_at', '<', new Date().toISOString());

      let cleanedCount = 0;

      for (const transaction of expiredTransactions) {
        await PaymentTransaction.updateStatus(
          transaction.id,
          'abandoned',
          { reason: 'Transaction expired' },
          schoolId
        );
        cleanedCount++;
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired transactions for school ${schoolId}`);
      }

      return cleanedCount;

    } catch (error) {
      logger.error('Cleanup expired transactions error:', error);
      throw error;
    }
  }
}

module.exports = PaymentGatewayService;