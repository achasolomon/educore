// backend/src/core/database/migrations/053_create_student_transport_table.js
exports.up = function(knex) {
  return knex.schema.createTable('student_transport', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('route_id').references('id').inTable('transport_routes').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    
    // Transport assignment details
    table.string('stop_id').notNullable().comment('Reference to stop in route stops JSON');
    table.string('pickup_point').notNullable();
    table.decimal('pickup_latitude', 10, 8);
    table.decimal('pickup_longitude', 11, 8);
    
    // Schedule preferences
    table.boolean('morning_pickup').defaultTo(true);
    table.boolean('evening_pickup').defaultTo(true);
    table.time('preferred_pickup_time');
    table.time('preferred_dropoff_time');
    
    // Status and enrollment
    table.enum('status', ['active', 'suspended', 'terminated']).defaultTo('active');
    table.date('enrolled_date').notNullable();
    table.date('start_date');
    table.date('end_date');
    
    // Financial
    table.decimal('transport_fee', 10, 2).defaultTo(0);
    table.enum('payment_frequency', ['monthly', 'quarterly', 'annually']).defaultTo('monthly');
    table.boolean('fee_paid').defaultTo(false);
    table.date('fee_due_date');
    
    // Emergency and guardian info
    table.uuid('authorized_pickup_guardian_id').references('id').inTable('guardians').onDelete('SET NULL');
    table.json('emergency_contacts');
    table.text('special_instructions');
    table.text('medical_notes');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['student_id', 'academic_year_id', 'status']);
    table.index(['school_id', 'route_id', 'status']);
    table.index(['academic_year_id', 'status']);
    table.index(['enrolled_date', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_transport');
};