// backend/src/core/database/migrations/063_create_library_fines_table.js
exports.up = function(knex) {
  return knex.schema.createTable('library_fines', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('member_id').references('id').inTable('library_members').onDelete('CASCADE');
    table.uuid('transaction_id').references('id').inTable('book_transactions').onDelete('CASCADE');
    table.uuid('book_id').references('id').inTable('library_books').onDelete('CASCADE');
    
    // Fine details
    table.string('fine_reference').notNullable();
    table.enum('fine_type', ['late_return', 'damage', 'replacement', 'processing', 'other']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.text('description').notNullable();
    table.date('fine_date').notNullable();
    table.date('due_date');
    
    // Payment tracking
    table.enum('status', ['pending', 'paid', 'waived', 'written_off']).defaultTo('pending');
    table.decimal('amount_paid', 10, 2).defaultTo(0);
    table.decimal('balance', 10, 2).notNullable();
    table.datetime('paid_at');
    table.uuid('payment_received_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('payment_method'); // cash, card, adjustment
    table.string('payment_reference');
    
    // Waiver details
    table.datetime('waived_at');
    table.uuid('waived_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('waiver_reason');
    
    // Integration with finance system
    table.uuid('finance_transaction_id').references('id').inTable('payments').onDelete('SET NULL');
    table.boolean('integrated_with_finance').defaultTo(false);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'fine_reference']);
    table.index(['school_id', 'member_id', 'status']);
    table.index(['transaction_id', 'fine_type']);
    table.index(['status', 'due_date']);
    table.index(['fine_date', 'amount']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('library_fines');
};