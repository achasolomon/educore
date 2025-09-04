// backend/src/core/database/migrations/055_create_vehicle_maintenance_table.js
exports.up = function(knex) {
  return knex.schema.createTable('vehicle_maintenance', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    table.uuid('scheduled_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('completed_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Maintenance details
    table.string('maintenance_type').notNullable(); // routine, repair, inspection, emergency
    table.string('category').notNullable(); // engine, brake, electrical, body, etc.
    table.text('description').notNullable();
    table.text('work_performed');
    
    // Scheduling
    table.date('scheduled_date').notNullable();
    table.date('completed_date');
    table.integer('estimated_hours');
    table.integer('actual_hours');
    
    // Financial
    table.decimal('estimated_cost', 10, 2);
    table.decimal('actual_cost', 10, 2);
    table.string('service_provider');
    table.string('invoice_number');
    
    // Parts and materials
    table.json('parts_used'); // Array of parts with quantities and costs
    table.json('materials_used');
    
    // Status tracking
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled');
    table.enum('priority', ['low', 'medium', 'high', 'emergency']).defaultTo('medium');
    table.integer('odometer_reading');
    
    // Documentation
    table.json('before_photos');
    table.json('after_photos');
    table.string('receipt_path');
    table.json('documents'); // Invoices, warranties, etc.
    
    // Quality and follow-up
    table.integer('quality_rating').comment('1-5 rating of service quality');
    table.text('quality_notes');
    table.boolean('warranty_applicable').defaultTo(false);
    table.date('warranty_expiry');
    table.date('next_service_due');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'vehicle_id', 'scheduled_date']);
    table.index(['status', 'priority', 'scheduled_date']);
    table.index(['maintenance_type', 'category']);
    table.index(['service_provider', 'completed_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vehicle_maintenance');
};
