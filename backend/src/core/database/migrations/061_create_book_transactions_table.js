// backend/src/core/database/migrations/061_create_book_transactions_table.js
exports.up = function(knex) {
  return knex.schema.createTable('book_transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('book_id').references('id').inTable('library_books').onDelete('CASCADE');
    table.uuid('member_id').references('id').inTable('library_members').onDelete('CASCADE');
    table.uuid('issued_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('returned_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Transaction identification
    table.string('transaction_id').notNullable();
    table.enum('transaction_type', ['checkout', 'return', 'renewal', 'reservation', 'cancellation']).notNullable();
    
    // Checkout details
    table.datetime('issued_at').notNullable();
    table.datetime('due_date').notNullable();
    table.datetime('returned_at');
    table.integer('renewal_count').defaultTo(0);
    table.boolean('is_digital').defaultTo(false);
    
    // Status tracking
    table.enum('status', ['active', 'returned', 'overdue', 'lost', 'damaged']).defaultTo('active');
    table.integer('days_overdue').defaultTo(0);
    
    // Fines and fees
    table.decimal('late_fee_charged', 10, 2).defaultTo(0);
    table.decimal('damage_fee_charged', 10, 2).defaultTo(0);
    table.decimal('replacement_fee_charged', 10, 2).defaultTo(0);
    table.decimal('total_fees', 10, 2).defaultTo(0);
    table.boolean('fees_paid').defaultTo(true);
    
    // Return condition
    table.enum('return_condition', ['excellent', 'good', 'fair', 'poor', 'damaged', 'lost']).defaultTo('good');
    table.text('return_notes');
    table.text('damage_description');
    
    // Digital access tracking
    table.datetime('last_accessed_at');
    table.integer('total_access_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'transaction_id']);
    table.index(['school_id', 'book_id', 'status']);
    table.index(['member_id', 'status', 'issued_at']);
    table.index(['due_date', 'status']);
    table.index(['is_digital', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('book_transactions');
};