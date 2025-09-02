// backend/src/core/database/migrations/024_create_attendance_records_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('attendance_records', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('marked_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.date('attendance_date').notNullable();
    table.enum('status', ['present', 'absent', 'late', 'excused', 'sick', 'suspended']).notNullable();
    table.time('check_in_time');
    table.time('check_out_time');
    table.text('remarks'); // Reason for absence, lateness, etc.
    table.enum('method', ['manual', 'qr_code', 'biometric', 'bulk']).defaultTo('manual');
    table.json('metadata'); // Additional tracking data
    
    table.boolean('is_modified').defaultTo(false); // Track if attendance was corrected
    table.uuid('modified_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('modified_at');
    table.timestamps(true, true);
    
    table.unique(['student_id', 'attendance_date']); // One record per student per day
    table.index(['school_id', 'attendance_date']);
    table.index(['class_id', 'attendance_date', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_records');
};