// backend/src/core/database/migrations/048_create_budget_table.js
exports.up = function(knex) {
  return knex.schema.createTable('budgets', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Budget details
    table.string('budget_name').notNullable();
    table.text('description');
    table.enum('budget_type', ['revenue', 'expense', 'capital', 'operational']).notNullable();
    table.enum('status', ['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled']).defaultTo('draft');
    
    // Budget period
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('period_type', ['monthly', 'termly', 'yearly']).defaultTo('yearly');
    
    // Financial figures
    table.decimal('total_budgeted_amount', 12, 2).notNullable();
    table.decimal('total_actual_amount', 12, 2).defaultTo(0);
    table.decimal('variance_amount', 12, 2).defaultTo(0);
    table.decimal('variance_percentage', 5, 2).defaultTo(0);
    table.decimal('utilization_rate', 5, 2).defaultTo(0);
    
    // Budget breakdown
    table.json('budget_items'); // Line items with categories and amounts
    table.json('monthly_breakdown'); // Month-by-month budget allocation
    table.json('actual_spending'); // Actual amounts spent per category
    
    // Approval workflow
    table.datetime('submitted_at');
    table.datetime('approved_at');
    table.text('approval_notes');
    table.json('revision_history');
    
    // Monitoring and alerts
    table.decimal('alert_threshold', 5, 2).defaultTo(80); // Alert when 80% spent
    table.boolean('alerts_enabled').defaultTo(true);
    table.datetime('last_review_date');
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'academic_year_id', 'status']);
    table.index(['budget_type', 'status']);
    table.index(['created_by', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('budgets');
};