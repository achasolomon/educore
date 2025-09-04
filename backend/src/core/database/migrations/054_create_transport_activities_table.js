// backend/src/core/database/migrations/054_create_transport_activities_table.js
exports.up = function(knex) {
  return knex.schema.createTable('transport_activities', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    table.uuid('route_id').references('id').inTable('transport_routes').onDelete('CASCADE');
    
    // Activity details
    table.enum('activity_type', ['boarded', 'alighted', 'absent', 'late']).notNullable();
    table.datetime('recorded_at').notNullable();
    table.string('stop_id').comment('Reference to stop in route stops JSON');
    
    // Location tracking
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('location_name');
    
    // Additional details
    table.uuid('recorded_by').references('id').inTable('users').onDelete('SET NULL').comment('Driver or conductor who recorded');
    table.text('notes');
    table.boolean('guardian_notified').defaultTo(false);
    table.datetime('guardian_notification_sent_at');
    
    // Verification
    table.boolean('is_verified').defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('verified_at');
    
    table.timestamps(true, true);
    
    table.index(['school_id', 'student_id', 'recorded_at']);
    table.index(['vehicle_id', 'activity_type', 'recorded_at']);
    table.index(['route_id', 'recorded_at']);
    table.index(['activity_type', 'guardian_notified']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transport_activities');
};