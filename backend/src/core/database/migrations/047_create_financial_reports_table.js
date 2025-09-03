
// backend/src/core/database/migrations/047_create_financial_reports_table.js
exports.up = function(knex) {
  return knex.schema.createTable('financial_reports', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('generated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Report details
    table.string('report_name').notNullable();
    table.enum('report_type', ['fee_collection', 'outstanding_fees', 'payment_analysis', 'revenue_report', 'defaulters_report']).notNullable();
    table.enum('report_format', ['pdf', 'excel', 'csv', 'json']).defaultTo('pdf');
    table.enum('report_period', ['daily', 'weekly', 'monthly', 'termly', 'yearly', 'custom']).notNullable();
    
    // Time period
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('SET NULL');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL');
    
    // Filters applied
    table.json('filters'); // Class filters, fee category filters, etc.
    table.json('parameters'); // Report-specific parameters
    
    // Report data and files
    table.json('report_data'); // Generated report data
    table.text('report_summary'); // Executive summary
    table.string('file_path'); // Path to generated file
    table.integer('file_size'); // File size in bytes
    
    // Status and scheduling
    table.enum('status', ['pending', 'generating', 'completed', 'failed', 'expired']).defaultTo('pending');
    table.boolean('is_scheduled').defaultTo(false);
    table.string('schedule_frequency'); // daily, weekly, monthly
    table.datetime('next_generation');
    table.datetime('completed_at');
    table.datetime('expires_at');
    
    // Sharing and access
    table.boolean('is_public').defaultTo(false);
    table.json('shared_with'); // Array of user IDs who can access
    table.string('download_token'); // Secure token for downloads
    table.integer('download_count').defaultTo(0);
    
    table.text('error_message');
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'report_type', 'status']);
    table.index(['generated_by', 'created_at']);
    table.index(['is_scheduled', 'next_generation']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('financial_reports');
};