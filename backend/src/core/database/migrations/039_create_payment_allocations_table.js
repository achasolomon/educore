// backend/src/core/database/migrations/039_create_payment_allocations_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_allocations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('payment_id').references('id').inTable('payments').onDelete('CASCADE');
    table.uuid('student_fee_id').references('id').inTable('student_fees').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.decimal('allocated_amount', 12, 2).notNullable();
    table.text('allocation_notes');
    table.timestamps(true, true);
    
    table.index(['payment_id']);
    table.index(['student_fee_id']);
    table.index(['school_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_allocations');
};