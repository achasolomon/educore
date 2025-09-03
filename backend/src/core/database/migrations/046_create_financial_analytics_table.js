// backend/src/core/database/migrations/046_create_financial_analytics_table.js
exports.up = function(knex) {
  return knex.schema.createTable('financial_analytics', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL');
    
    // Time period
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.enum('period_type', ['daily', 'weekly', 'monthly', 'termly', 'yearly']).notNullable();
    
    // Revenue analytics
    table.decimal('total_fees_billed', 12, 2).defaultTo(0);
    table.decimal('total_payments_received', 12, 2).defaultTo(0);
    table.decimal('outstanding_balance', 12, 2).defaultTo(0);
    table.decimal('overdue_amount', 12, 2).defaultTo(0);
    
    // Collection analytics
    table.decimal('collection_rate', 5, 2).defaultTo(0); // Percentage
    table.integer('total_students_billed').defaultTo(0);
    table.integer('students_fully_paid').defaultTo(0);
    table.integer('students_with_balance').defaultTo(0);
    table.integer('students_overdue').defaultTo(0);
    
    // Payment method breakdown
    table.json('payment_method_breakdown'); // {cash: amount, bank_transfer: amount, etc.}
    table.json('fee_category_breakdown'); // {tuition: amount, transport: amount, etc.}
    
    // Transaction analytics
    table.integer('total_transactions').defaultTo(0);
    table.integer('successful_transactions').defaultTo(0);
    table.integer('failed_transactions').defaultTo(0);
    table.decimal('transaction_success_rate', 5, 2).defaultTo(0);
    table.decimal('total_gateway_fees', 12, 2).defaultTo(0);
    
    // Discount and waivers
    table.decimal('total_discounts_given', 12, 2).defaultTo(0);
    table.decimal('total_waivers', 12, 2).defaultTo(0);
    table.integer('students_with_discounts').defaultTo(0);
    
    // Comparison metrics
    table.decimal('previous_period_revenue', 12, 2);
    table.decimal('revenue_growth_rate', 5, 2); // Percentage change
    table.decimal('target_revenue', 12, 2);
    table.decimal('target_achievement_rate', 5, 2); // Percentage of target achieved
    
    table.json('metadata'); // Additional analytics data
    table.timestamps(true, true);
    
    table.unique(['school_id', 'academic_year_id', 'term_id', 'period_start', 'period_type']);
    table.index(['school_id', 'period_type', 'period_start']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('financial_analytics');
};