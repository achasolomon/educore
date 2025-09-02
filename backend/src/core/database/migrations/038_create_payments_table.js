// backend/src/core/database/migrations/038_create_payments_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('payer_id').references('id').inTable('users').onDelete('SET NULL'); // Who made the payment
    
    // Payment identification
    table.string('payment_reference').notNullable().unique(); // System generated reference
    table.string('transaction_reference'); // External gateway reference
    table.string('receipt_number').notNullable(); // School receipt number
    
    // Payment details
    table.decimal('amount', 12, 2).notNullable();
    table.enum('payment_method', ['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'pos']).notNullable();
    table.enum('payment_status', ['pending', 'completed', 'failed', 'cancelled', 'refunded']).defaultTo('pending');
    table.datetime('payment_date').notNullable();
    table.date('value_date'); // When payment was actually received
    
    // Gateway information
    table.string('gateway_name'); // Paystack, Flutterwave, etc.
    table.string('gateway_reference');
    table.json('gateway_response'); // Full gateway response
    table.decimal('gateway_fee', 12, 2).defaultTo(0);
    
    // Bank/Cash details
    table.string('bank_name');
    table.string('account_number');
    table.string('teller_number');
    table.string('cheque_number');
    table.string('pos_terminal_id');
    
    // Processing information
    table.uuid('received_by').references('id').inTable('users').onDelete('SET NULL'); // Staff who recorded payment
    table.uuid('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('verified_at');
    table.boolean('is_verified').defaultTo(false);
    table.text('verification_notes');
    
    table.text('remarks');
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'student_id']);
    table.index(['payment_date', 'payment_status']);
    table.index(['payment_reference']);
    table.index(['transaction_reference']);
    table.index(['receipt_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};