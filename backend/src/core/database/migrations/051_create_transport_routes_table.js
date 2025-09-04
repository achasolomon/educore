// backend/src/core/database/migrations/051_create_transport_routes_table.js
exports.up = function(knex) {
  return knex.schema.createTable('transport_routes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Route details
    table.string('route_name').notNullable();
    table.string('route_code').notNullable();
    table.text('description');
    
    // Location details
    table.string('start_location').notNullable();
    table.string('end_location').notNullable();
    table.decimal('start_latitude', 10, 8);
    table.decimal('start_longitude', 11, 8);
    table.decimal('end_latitude', 10, 8);
    table.decimal('end_longitude', 11, 8);
    
    // Route specifications
    table.integer('estimated_duration').comment('Duration in minutes');
    table.decimal('distance_km', 8, 2);
    table.json('route_coordinates').comment('GPS coordinates array for route path');
    table.json('stops').comment('Array of stops with coordinates and details');
    
    // Schedule
    table.json('operating_days').comment('Array of operating days');
    table.time('start_time');
    table.time('end_time');
    table.time('morning_pickup_start');
    table.time('morning_pickup_end');
    table.time('evening_pickup_start');
    table.time('evening_pickup_end');
    
    // Status and optimization
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_optimized').defaultTo(false);
    table.datetime('last_optimized_at');
    table.decimal('optimization_score', 5, 2).comment('Route efficiency score 0-100');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'route_code']);
    table.index(['school_id', 'is_active']);
    table.index(['start_time', 'end_time']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transport_routes');
};