
// backend/src/core/database/migrations/056_create_vehicle_location_history_table.js
exports.up = function(knex) {
  return knex.schema.createTable('vehicle_location_history', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    
    // Location data
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.decimal('speed', 5, 2).defaultTo(0);
    table.decimal('heading', 5, 2).comment('Direction in degrees');
    table.decimal('altitude', 8, 2);
    table.decimal('accuracy', 8, 2).comment('GPS accuracy in meters');
    
    // Context
    table.string('location_source').defaultTo('gps'); // gps, manual, estimated
    table.boolean('is_moving').defaultTo(true);
    table.boolean('engine_on').defaultTo(true);
    
    // Timestamps
    table.datetime('recorded_at').notNullable();
    table.datetime('created_at').defaultTo(knex.fn.now());
    
    table.index(['vehicle_id', 'recorded_at']);
    table.index(['recorded_at']); // For cleanup of old records
    table.index(['latitude', 'longitude']); // For geospatial queries
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vehicle_location_history');
};
