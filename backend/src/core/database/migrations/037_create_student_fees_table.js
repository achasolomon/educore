// backend/src/core/database/migrations/037_create_student_fees_table.js
exports.up = function(knex) {
  return knex.schema.createTable('student_fees', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('fee_structure_id').references('id').inTable('fee_structures').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL');
    
    // Fee details
    table.decimal('original_amount', 12, 2).notNullable(); // Original fee amount
    table.decimal('discount_amount', 12, 2).defaultTo(0); // Any discounts applied
    table.decimal('additional_charges', 12, 2).defaultTo(0); // Extra charges
    table.decimal('final_amount', 12, 2).notNullable(); // Amount after discounts/additions
    table.decimal('amount_paid', 12, 2).defaultTo(0); // Total amount paid so far
    table.decimal('balance', 12, 2).notNullable(); // Remaining balance
    
    // Payment tracking
    table.date('due_date');
    table.enum('status', ['pending', 'partial', 'paid', 'overdue', 'waived']).defaultTo('pending');
    table.date('last_payment_date');
    table.decimal('late_fee_applied', 12, 2).defaultTo(0);
    table.boolean('is_overdue').defaultTo(false);
    table.integer('overdue_days').defaultTo(0);
    
    // Discount/scholarship information
    table.string('discount_type'); // Sibling, Merit, Need-based, etc.
    table.decimal('discount_percentage', 5, 2).defaultTo(0);
    table.text('discount_reason');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.text('notes');
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['student_id', 'fee_structure_id']);
    table.index(['school_id', 'academic_year_id', 'status']);
    table.index(['student_id', 'status']);
    table.index(['due_date', 'is_overdue']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_fees');
};