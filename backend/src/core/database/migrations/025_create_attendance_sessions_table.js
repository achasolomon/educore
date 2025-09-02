// backend/src/core/database/migrations/025_create_attendance_sessions_table.js
exports.up = function(knex) {
  return knex.schema.createTable('attendance_sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('teacher_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.date('session_date').notNullable();
    table.time('start_time');
    table.time('end_time');
    table.enum('session_type', ['morning', 'afternoon', 'full_day']).defaultTo('full_day');
    table.enum('status', ['active', 'completed', 'cancelled']).defaultTo('active');
    
    table.integer('total_students');
    table.integer('present_count').defaultTo(0);
    table.integer('absent_count').defaultTo(0);
    table.integer('late_count').defaultTo(0);
    
    table.text('notes'); // Session notes
    table.datetime('completed_at');
    table.timestamps(true, true);
    
    table.index(['school_id', 'session_date']);
    table.index(['class_id', 'session_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_sessions');
};