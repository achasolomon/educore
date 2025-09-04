// backend/src/core/database/migrations/057_create_vehicle_fuel_logs_table.js
exports.up = function(knex) {
  return knex.schema.createTable('vehicle_fuel_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    table.uuid('recorded_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Fuel details
    table.decimal('fuel_amount', 8, 2).notNullable().comment('Amount in liters');
    table.decimal('cost', 10, 2).notNullable();
    table.decimal('cost_per_liter', 6, 2).notNullable();
    table.date('refuel_date').notNullable();
    table.time('refuel_time');
    
    // Vehicle state
    table.integer('odometer_reading').notNullable();
    table.integer('fuel_level_before').comment('Fuel level percentage before refuel');
    table.integer('fuel_level_after').comment('Fuel level percentage after refuel');
    
    // Location and provider
    table.string('fuel_station').notNullable();
    table.string('fuel_station_location');
    table.decimal('station_latitude', 10, 8);
    table.decimal('station_longitude', 11, 8);
    
    // Documentation
    table.string('receipt_number');
    table.string('receipt_path');
    table.text('notes');
    
    // Fuel efficiency tracking
    table.decimal('distance_since_last_refuel', 8, 2);
    table.decimal('fuel_efficiency', 5, 2).comment('KM per liter');
    
    table.timestamps(true, true);
    
    table.index(['school_id', 'vehicle_id', 'refuel_date']);
    table.index(['refuel_date', 'cost']);
    table.index(['fuel_station', 'refuel_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vehicle_fuel_logs');
};