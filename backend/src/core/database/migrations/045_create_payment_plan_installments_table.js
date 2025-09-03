// backend/src/core/database/migrations/045_create_payment_plan_installments_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_plan_installments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('payment_plan_id').references('id').inTable('payment_plans').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    // Installment details
    table.integer('installment_number').notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.date('due_date').notNullable();
    table.date('grace_period_end');
    
    // Payment tracking
    table.enum('status', ['pending', 'paid', 'overdue', 'waived']).defaultTo('pending');
    table.decimal('amount_paid', 12, 2).defaultTo(0);
    table.decimal('balance', 12, 2).notNullable();
    table.uuid('payment_id').references('id').inTable('payments').onDelete('SET NULL');
    table.datetime('paid_at');
    table.integer('days_overdue').defaultTo(0);
    
    // Late fees
    table.decimal('late_fee_applied', 12, 2).defaultTo(0);
    table.decimal('total_amount_due', 12, 2); // Amount + late fees
    
    table.text('notes');
    table.timestamps(true, true);
    
    table.unique(['payment_plan_id', 'installment_number']);
    table.index(['school_id', 'due_date', 'status']);
    table.index(['status', 'grace_period_end']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_plan_installments');
};