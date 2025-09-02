// backend/src/core/database/migrations/027_create_attendance_analytics_table.js
exports.up = function(knex) {
  return knex.schema.createTable('attendance_analytics', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('CASCADE');
    
    // Attendance statistics
    table.integer('total_school_days').defaultTo(0);
    table.integer('days_present').defaultTo(0);
    table.integer('days_absent').defaultTo(0);
    table.integer('days_late').defaultTo(0);
    table.integer('days_excused').defaultTo(0);
    
    // Calculated metrics
    table.decimal('attendance_percentage', 5, 2).defaultTo(0);
    table.decimal('punctuality_percentage', 5, 2).defaultTo(0);
    table.integer('consecutive_absences').defaultTo(0);
    table.date('last_attendance_date');
    
    // Trend indicators
    table.enum('attendance_trend', ['improving', 'declining', 'stable']).defaultTo('stable');
    table.json('monthly_breakdown'); // Month-wise attendance summary
    
    table.timestamps(true, true);
    
    table.unique(['student_id', 'term_id']);
    table.index(['class_id', 'term_id']);
    table.index(['attendance_percentage']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_analytics');
};