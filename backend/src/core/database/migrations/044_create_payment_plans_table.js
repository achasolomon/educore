// backend/src/core/database/migrations/044_create_payment_plans_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_plans', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    
    // Plan details
    table.string('plan_name').notNullable();
    table.decimal('total_amount', 12, 2).notNullable();
    table.decimal('down_payment', 12, 2).defaultTo(0);
    table.decimal('remaining_amount', 12, 2).notNullable();
    table.integer('number_of_installments').notNullable();
    table.decimal('installment_amount', 12, 2).notNullable();
    
    // Schedule
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('frequency', ['weekly', 'bi_weekly', 'monthly', 'quarterly']).defaultTo('monthly');
    table.integer('grace_period_days').defaultTo(7);
    
    // Status tracking
    table.enum('status', ['active', 'completed', 'defaulted', 'cancelled']).defaultTo('active');
    table.decimal('amount_paid', 12, 2).defaultTo(0);
    table.decimal('balance', 12, 2).notNullable();
    table.integer('installments_paid').defaultTo(0);
    table.integer('installments_overdue').defaultTo(0);
    
    // Agreement
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('approved_at');
    table.text('terms_and_conditions');
    table.boolean('parent_agreed').defaultTo(false);
    table.datetime('parent_agreed_at');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'status']);
    table.index(['student_id', 'academic_year_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_plans');
};