
// backend/src/core/database/migrations/050_create_expenses_table.js
exports.up = function(knex) {
  return knex.schema.createTable('expenses', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('expense_categories').onDelete('CASCADE');
    table.uuid('budget_id').references('id').inTable('budgets').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Expense details
    table.string('expense_reference').notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.decimal('amount', 12, 2).notNullable();
    table.date('expense_date').notNullable();
    table.string('vendor_name');
    table.string('receipt_number');
    
    // Payment details
    table.enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'card']).notNullable();
    table.enum('payment_status', ['pending', 'paid', 'partially_paid', 'cancelled']).defaultTo('pending');
    table.decimal('amount_paid', 12, 2).defaultTo(0);
    table.decimal('balance', 12, 2);
    table.date('payment_date');
    
    // Approval workflow
    table.enum('approval_status', ['pending', 'approved', 'rejected', 'cancelled']).defaultTo('pending');
    table.datetime('submitted_for_approval_at');
    table.datetime('approved_at');
    table.text('approval_notes');
    table.text('rejection_reason');
    
    // Document attachments
    table.json('attachments'); // Receipts, invoices, etc.
    table.string('receipt_path');
    table.boolean('has_receipt').defaultTo(false);
    
    // Recurring expenses
    table.boolean('is_recurring').defaultTo(false);
    table.string('recurrence_frequency'); // monthly, yearly
    table.uuid('parent_expense_id').references('id').inTable('expenses').onDelete('SET NULL');
    table.date('next_occurrence');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'expense_reference']);
    table.index(['school_id', 'category_id', 'expense_date']);
    table.index(['approval_status', 'payment_status']);
    table.index(['created_by', 'expense_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expenses');
};