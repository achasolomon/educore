// backend/src/core/database/migrations/058_create_transport_fees_table.js
exports.up = function(knex) {
  return knex.schema.createTable('transport_fees', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_transport_id').references('id').inTable('student_transport').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL');
    
    // Fee structure
    table.decimal('monthly_fee', 10, 2).notNullable();
    table.decimal('total_fee', 10, 2).notNullable();
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('final_amount', 10, 2).notNullable();
    
    // Payment tracking
    table.decimal('amount_paid', 10, 2).defaultTo(0);
    table.decimal('balance', 10, 2).notNullable();
    table.enum('status', ['pending', 'partial', 'paid', 'overdue']).defaultTo('pending');
    
    // Due dates
    table.date('due_date').notNullable();
    table.date('last_payment_date');
    table.boolean('is_overdue').defaultTo(false);
    table.integer('days_overdue').defaultTo(0);
    
    // Late fees
    table.decimal('late_fee_amount', 10, 2).defaultTo(0);
    table.date('late_fee_applied_date');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['student_transport_id', 'academic_year_id', 'term_id']);
    table.index(['school_id', 'status', 'due_date']);
    table.index(['academic_year_id', 'term_id']);
    table.index(['is_overdue', 'days_overdue']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transport_fees');
};