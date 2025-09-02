// backend/src/core/database/migrations/028_create_attendance_alerts_table.js
exports.up = function(knex) {
  return knex.schema.createTable('attendance_alerts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('triggered_by_rule').references('id').inTable('attendance_rules').onDelete('SET NULL');
    
    table.enum('alert_type', ['low_attendance', 'consecutive_absences', 'late_pattern', 'perfect_attendance']).notNullable();
    table.enum('severity', ['info', 'warning', 'critical']).defaultTo('info');
    table.string('alert_title').notNullable();
    table.text('alert_message');
    table.json('alert_data'); // Additional alert context
    
    table.enum('status', ['active', 'acknowledged', 'resolved', 'dismissed']).defaultTo('active');
    table.uuid('acknowledged_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('acknowledged_at');
    table.text('resolution_notes');
    
    table.timestamps(true, true);
    
    table.index(['school_id', 'status']);
    table.index(['student_id', 'alert_type']);
    table.index(['severity', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_alerts');
};