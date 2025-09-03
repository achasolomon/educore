// backend/src/core/database/migrations/042_create_payment_transactions_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('payment_id').references('id').inTable('payments').onDelete('CASCADE');
    table.uuid('gateway_id').references('id').inTable('payment_gateways').onDelete('SET NULL');
    
    // Transaction identification
    table.string('transaction_reference').notNullable().unique();
    table.string('gateway_reference'); // External gateway reference
    table.string('authorization_code'); // For card payments
    
    // Transaction details
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('gateway_fee', 12, 2).defaultTo(0);
    table.decimal('net_amount', 12, 2); // Amount - gateway fee
    table.string('currency', 3).defaultTo('NGN');
    
    // Transaction status and flow
    table.enum('status', ['pending', 'processing', 'success', 'failed', 'cancelled', 'abandoned']).defaultTo('pending');
    table.datetime('initiated_at').notNullable();
    table.datetime('completed_at');
    table.datetime('expires_at');
    
    // Gateway response data
    table.json('gateway_request'); // Request sent to gateway
    table.json('gateway_response'); // Response from gateway
    table.text('failure_reason');
    table.string('gateway_message');
    
    // Customer information
    table.string('customer_email');
    table.string('customer_phone');
    table.json('customer_metadata');
    
    // Card/Payment method details (if applicable)
    table.string('card_last_four');
    table.string('card_type'); // visa, mastercard, etc.
    table.string('bank_name');
    table.string('channel'); // card, bank, mobile_money, etc.
    
    // Webhook and callback tracking
    table.boolean('webhook_received').defaultTo(false);
    table.datetime('webhook_received_at');
    table.integer('webhook_attempts').defaultTo(0);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'status']);
    table.index(['gateway_reference']);
    table.index(['payment_id']);
    table.index(['status', 'expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_transactions');
};