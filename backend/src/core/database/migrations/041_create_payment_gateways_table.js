// backend/src/core/database/migrations/041_create_payment_gateways_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_gateways', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('name').notNullable(); // Paystack, Flutterwave, Bank Transfer, etc.
    table.string('code').notNullable(); // PAYSTACK, FLUTTERWAVE, BANK, CASH
    table.enum('gateway_type', ['online', 'offline', 'manual']).notNullable();
    table.text('description');
    
    // Gateway configuration
    table.json('config'); // API keys, webhook URLs, etc.
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_test_mode').defaultTo(true);
    
    // Fee configuration
    table.decimal('transaction_fee_percentage', 5, 4).defaultTo(0); // e.g., 1.5%
    table.decimal('transaction_fee_fixed', 12, 2).defaultTo(0); // Fixed fee in Naira
    table.decimal('minimum_amount', 12, 2).defaultTo(0);
    table.decimal('maximum_amount', 12, 2); // NULL for no limit
    
    // Supported features
    table.boolean('supports_recurring').defaultTo(false);
    table.boolean('supports_refunds').defaultTo(false);
    table.json('supported_currencies').defaultTo('["NGN"]');
    
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_gateways');
};
