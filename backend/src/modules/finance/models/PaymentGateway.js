// backend/src/modules/finance/models/PaymentGateway.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class PaymentGateway {
  static tableName = 'payment_gateways';

  static async create(gatewayData, schoolId) {
    const [gateway] = await db(this.tableName)
      .insert({
        ...gatewayData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return gateway;
  }

  static async findBySchool(schoolId, activeOnly = true) {
    let query = db(this.tableName)
      .where('school_id', schoolId);

    if (activeOnly) {
      query = query.where('is_active', true);
    }

    return await query.orderBy('sort_order', 'asc');
  }

  static async findByCode(code, schoolId) {
    return await db(this.tableName)
      .where({ code, school_id: schoolId })
      .first();
  }

  static async initializeDefaultGateways(schoolId) {
    const defaultGateways = [
      {
        name: 'Cash Payment',
        code: 'CASH',
        gateway_type: 'manual',
        description: 'Direct cash payment at school',
        is_active: true,
        is_test_mode: false,
        transaction_fee_percentage: 0,
        transaction_fee_fixed: 0,
        minimum_amount: 100,
        sort_order: 1
      },
      {
        name: 'Bank Transfer',
        code: 'BANK_TRANSFER',
        gateway_type: 'offline',
        description: 'Direct bank transfer to school account',
        is_active: true,
        is_test_mode: false,
        transaction_fee_percentage: 0,
        transaction_fee_fixed: 0,
        minimum_amount: 1000,
        sort_order: 2
      },
      {
        name: 'Paystack',
        code: 'PAYSTACK',
        gateway_type: 'online',
        description: 'Online payment via Paystack',
        is_active: false, // Requires configuration
        is_test_mode: true,
        transaction_fee_percentage: 1.5,
        transaction_fee_fixed: 100,
        minimum_amount: 100,
        supports_recurring: true,
        supports_refunds: true,
        sort_order: 3,
        config: {
          public_key: '',
          secret_key: '',
          webhook_url: '/api/finance/webhooks/paystack'
        }
      },
      {
        name: 'Flutterwave',
        code: 'FLUTTERWAVE',
        gateway_type: 'online',
        description: 'Online payment via Flutterwave',
        is_active: false, // Requires configuration
        is_test_mode: true,
        transaction_fee_percentage: 1.4,
        transaction_fee_fixed: 0,
        minimum_amount: 100,
        supports_recurring: false,
        supports_refunds: true,
        sort_order: 4,
        config: {
          public_key: '',
          secret_key: '',
          encryption_key: '',
          webhook_url: '/api/finance/webhooks/flutterwave'
        }
      }
    ];

    const createdGateways = [];
    for (const gatewayData of defaultGateways) {
      const existing = await this.findByCode(gatewayData.code, schoolId);
      if (!existing) {
        const gateway = await this.create(gatewayData, schoolId);
        createdGateways.push(gateway);
      }
    }

    return createdGateways;
  }

  static async calculateTransactionFee(gatewayId, amount) {
    const gateway = await db(this.tableName)
      .where('id', gatewayId)
      .first();

    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    const percentageFee = (parseFloat(amount) * parseFloat(gateway.transaction_fee_percentage)) / 100;
    const fixedFee = parseFloat(gateway.transaction_fee_fixed);
    const totalFee = percentageFee + fixedFee;

    return {
      percentage_fee: percentageFee,
      fixed_fee: fixedFee,
      total_fee: totalFee,
      net_amount: parseFloat(amount) - totalFee
    };
  }

  static async update(id, schoolId, updateData) {
    const [gateway] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return gateway;
  }

  static async toggleActive(id, schoolId, isActive) {
    return await this.update(id, schoolId, { is_active: isActive });
  }
}

module.exports = PaymentGateway;
