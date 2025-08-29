// backend/src/core/database/migrations/015_create_generated_reports_table.js
exports.up = function(knex) {
  return knex.schema.createTable('generated_reports', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('template_id').references('id').inTable('report_templates').onDelete('CASCADE');
    table.uuid('generated_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('report_name').notNullable();
    table.string('report_type').notNullable(); // 'student_report', 'class_report', etc.
    table.json('filters'); // Report generation parameters
    table.json('metadata'); // Student IDs, class IDs, term IDs included
    table.string('file_path'); // Path to generated file
    table.string('file_format'); // 'pdf', 'excel'
    table.bigInteger('file_size');
    table.enum('status', ['generating', 'completed', 'failed', 'expired']).defaultTo('generating');
    table.text('error_message'); // If generation failed
    table.datetime('expires_at'); // Auto-delete after certain period
    table.integer('download_count').defaultTo(0);
    table.datetime('last_downloaded_at');
    table.timestamps(true, true);
    
    table.index(['school_id', 'status']);
    table.index(['generated_by', 'created_at']);
    table.index('expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('generated_reports');
};