// backend/src/modules/finance/models/PaymentTransaction.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class PaymentTransaction {
  static tableName = 'payment_transactions';

  static async create(transactionData, schoolId) {
    const transactionReference = await this.generateTransactionReference(schoolId);
    
    const [transaction] = await db(this.tableName)
      .insert({
        ...transactionData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        transaction_reference: transactionReference,
        initiated_at: new Date()
      })
      .returning('*');
    return transaction;
  }

  static async generateTransactionReference(schoolId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp.slice(-8)}${random}`;
  }

  static async findByReference(transactionReference, schoolId) {
    return await db(this.tableName)
      .where({ transaction_reference: transactionReference, school_id: schoolId })
      .first();
  }

  static async findByGatewayReference(gatewayReference, schoolId) {
    return await db(this.tableName)
      .where({ gateway_reference: gatewayReference, school_id: schoolId })
      .first();
  }

  static async updateStatus(id, status, gatewayResponse = null, schoolId) {
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (status === 'success' || status === 'failed') {
      updateData.completed_at = new Date();
    }

    if (gatewayResponse) {
      updateData.gateway_response = gatewayResponse;
      updateData.gateway_message = gatewayResponse.message || gatewayResponse.gateway_response;
      
      // Extract card details if available
      if (gatewayResponse.authorization) {
        updateData.card_last_four = gatewayResponse.authorization.last4;
        updateData.card_type = gatewayResponse.authorization.card_type;
        updateData.bank_name = gatewayResponse.authorization.bank;
        updateData.authorization_code = gatewayResponse.authorization.authorization_code;
      }

      if (gatewayResponse.channel) {
        updateData.channel = gatewayResponse.channel;
      }
    }

    const [transaction] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update(updateData)
      .returning('*');

    return transaction;
  }

  static async markWebhookReceived(transactionReference, webhookData, schoolId) {
    const [transaction] = await db(this.tableName)
      .where({ transaction_reference: transactionReference, school_id: schoolId })
      .update({
        webhook_received: true,
        webhook_received_at: new Date(),
        webhook_attempts: db.raw('webhook_attempts + 1'),
        gateway_response: db.raw('COALESCE(gateway_response, \'{}\'::jsonb) || ?::jsonb', [JSON.stringify(webhookData)]),
        updated_at: new Date()
      })
      .returning('*');

    return transaction;
  }

  static async findPendingTransactions(schoolId, olderThanMinutes = 30) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

    return await db(this.tableName)
      .where('school_id', schoolId)
      .where('status', 'pending')
      .where('initiated_at', '<', cutoffTime.toISOString())
      .orderBy('initiated_at', 'asc');
  }

  static async getTransactionStats(schoolId, dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const stats = await db(this.tableName)
      .select([
        'status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('SUM(gateway_fee) as total_fees')
      ])
      .where('school_id', schoolId)
      .where('initiated_at', '>=', startDate.toISOString())
      .groupBy('status');

    const summary = {
      total_transactions: 0,
      total_amount: 0,
      total_fees: 0,
      success_rate: 0,
      by_status: {}
    };

    let successfulCount = 0;

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      const amount = parseFloat(stat.total_amount || 0);
      const fees = parseFloat(stat.total_fees || 0);

      summary.total_transactions += count;
      summary.total_amount += amount;
      summary.total_fees += fees;

      if (stat.status === 'success') {
        successfulCount = count;
      }

      summary.by_status[stat.status] = {
        count,
        amount,
        fees
      };
    });

    if (summary.total_transactions > 0) {
      summary.success_rate = ((successfulCount / summary.total_transactions) * 100).toFixed(2);
    }

    return summary;
  }
}

module.exports = PaymentTransaction;
