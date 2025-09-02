// backend/src/core/database/migrations/036_create_fee_structures_table.js
exports.up = function(knex) {
  return knex.schema.createTable('fee_structures', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL'); // NULL for session-based fees
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('fee_category_id').references('id').inTable('fee_categories').onDelete('CASCADE');
    
    table.decimal('amount', 12, 2).notNullable();
    table.date('due_date');
    table.decimal('early_payment_discount', 5, 2).defaultTo(0); // Percentage discount for early payment
    table.date('early_payment_deadline');
    table.decimal('late_fee_amount', 12, 2).defaultTo(0);
    table.integer('late_fee_days').defaultTo(30);
    
    table.boolean('is_active').defaultTo(true);
    table.text('notes');
    table.json('metadata');
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'academic_year_id', 'term_id', 'class_id', 'fee_category_id']);
    table.index(['school_id', 'academic_year_id', 'is_active']);
    table.index(['class_id', 'term_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('fee_structures');
};