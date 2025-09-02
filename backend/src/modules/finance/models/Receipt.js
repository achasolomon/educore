// backend/src/modules/finance/models/Receipt.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Receipt {
  static tableName = 'receipts';

  static async create(receiptData, schoolId) {
    const [receipt] = await db(this.tableName)
      .insert({
        ...receiptData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return receipt;
  }

  static async generateForPayment(payment, schoolId, generatedBy) {
    try {
      // Get payment allocations for receipt breakdown
      const allocations = await db('payment_allocations')
        .select([
          'payment_allocations.allocated_amount',
          'fee_categories.name as category_name',
          'fee_categories.code as category_code'
        ])
        .join('student_fees', 'payment_allocations.student_fee_id', 'student_fees.id')
        .join('fee_structures', 'student_fees.fee_structure_id', 'fee_structures.id')
        .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
        .where('payment_allocations.payment_id', payment.id);

      // Create fee breakdown for receipt
      const feeBreakdown = allocations.map(allocation => ({
        category: allocation.category_name,
        amount: parseFloat(allocation.allocated_amount)
      }));

      // Generate receipt HTML
      const receiptHtml = this.generateReceiptHTML(payment, feeBreakdown);

      const receiptData = {
        payment_id: payment.id,
        student_id: payment.student_id,
        receipt_number: payment.receipt_number,
        receipt_date: new Date().toISOString().split('T')[0],
        total_amount: payment.amount,
        fee_breakdown: JSON.stringify(feeBreakdown),
        payment_method: payment.payment_method,
        payment_reference: payment.payment_reference,
        receipt_html: receiptHtml,
        is_generated: true,
        generated_at: new Date(),
        generated_by: generatedBy
      };

      return await this.create(receiptData, schoolId);

    } catch (error) {
      throw new Error(`Failed to generate receipt: ${error.message}`);
    }
  }

  static generateReceiptHTML(payment, feeBreakdown) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - ${payment.receipt_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; }
          .receipt-details { margin: 20px 0; }
          .fee-breakdown { margin: 15px 0; }
          .total { font-weight: bold; font-size: 1.2em; border-top: 1px solid #ccc; padding-top: 10px; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>PAYMENT RECEIPT</h2>
          <h3>Receipt #: ${payment.receipt_number}</h3>
        </div>
        
        <div class="receipt-details">
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Reference:</strong> ${payment.payment_reference}</p>
          <p><strong>Payment Method:</strong> ${payment.payment_method.toUpperCase()}</p>
        </div>

        <div class="fee-breakdown">
          <h4>Payment Breakdown:</h4>
          ${feeBreakdown.map(fee => 
            `<p>${fee.category}: ₦${fee.amount.toLocaleString()}</p>`
          ).join('')}
        </div>

        <div class="total">
          <p>TOTAL PAID: ₦${parseFloat(payment.amount).toLocaleString()}</p>
        </div>

        <div class="footer">
          <p>Thank you for your payment!</p>
          <p><em>This is a computer-generated receipt.</em></p>
        </div>
      </body>
      </html>
    `;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async findByPayment(paymentId, schoolId) {
    return await db(this.tableName)
      .where({ payment_id: paymentId, school_id: schoolId })
      .first();
  }

  static async markAsEmailed(receiptId, schoolId) {
    await db(this.tableName)
      .where({ id: receiptId, school_id: schoolId })
      .update({
        is_emailed: true,
        emailed_at: new Date(),
        updated_at: new Date()
      });
  }
}

module.exports = Receipt;