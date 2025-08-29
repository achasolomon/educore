// backend/src/core/database/migrations/014_create_report_templates_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('report_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('name').notNullable(); // 'Student Report Card', 'Class Performance'
    table.string('type').notNullable(); // 'student_report', 'class_report', 'subject_report'
    table.text('description');
    table.json('template_config'); // Layout, sections, formatting options
    table.json('data_fields'); // Which fields to include
    table.string('output_format').defaultTo('pdf'); // 'pdf', 'excel', 'html'
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['school_id', 'type']);
    table.index(['is_active', 'is_default']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('report_templates');
};