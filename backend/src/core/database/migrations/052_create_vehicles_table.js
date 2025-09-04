// backend/src/core/database/migrations/052_create_vehicles_table.js
exports.up = function(knex) {
  return knex.schema.createTable('vehicles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('route_id').references('id').inTable('transport_routes').onDelete('SET NULL');
    table.uuid('driver_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('conductor_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Vehicle identification
    table.string('vehicle_number').notNullable();
    table.string('registration_number').notNullable();
    table.string('vehicle_type').defaultTo('bus'); // bus, van, car
    table.string('make').notNullable();
    table.string('model').notNullable();
    table.integer('year');
    table.string('color');
    table.integer('capacity').notNullable();
    
    // Technical specifications
    table.string('engine_number');
    table.string('chassis_number');
    table.string('fuel_type').defaultTo('diesel'); // petrol, diesel, cng, electric
    table.decimal('fuel_tank_capacity', 8, 2);
    table.decimal('mileage_per_liter', 5, 2);
    
    // Legal and insurance
    table.date('insurance_expiry').notNullable();
    table.string('insurance_company');
    table.string('insurance_policy_number');
    table.date('fitness_certificate_expiry');
    table.date('permit_expiry');
    table.date('pollution_certificate_expiry');
    
    // Current status and location
    table.enum('status', ['active', 'maintenance', 'out_of_service', 'inactive']).defaultTo('active');
    table.text('status_notes');
    table.decimal('current_latitude', 10, 8);
    table.decimal('current_longitude', 11, 8);
    table.decimal('current_speed', 5, 2).defaultTo(0);
    table.integer('fuel_level').defaultTo(100).comment('Fuel level percentage');
    table.datetime('last_location_update');
    
    // Maintenance
    table.string('maintenance_schedule').defaultTo('monthly'); // weekly, monthly, quarterly
    table.date('last_maintenance_date');
    table.date('next_maintenance_due');
    table.integer('odometer_reading').defaultTo(0);
    
    // Features and equipment
    table.boolean('has_gps').defaultTo(false);
    table.boolean('has_first_aid').defaultTo(false);
    table.boolean('has_fire_extinguisher').defaultTo(false);
    table.boolean('has_cctv').defaultTo(false);
    table.boolean('has_speed_governor').defaultTo(false);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'vehicle_number']);
    table.unique(['school_id', 'registration_number']);
    table.index(['school_id', 'status']);
    table.index(['route_id', 'status']);
    table.index(['driver_id', 'conductor_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vehicles');
};