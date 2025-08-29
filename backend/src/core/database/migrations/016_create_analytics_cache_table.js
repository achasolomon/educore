// backend/src/core/database/migrations/016_create_analytics_cache_table.js
exports.up = function(knex) {
  return knex.schema.createTable('analytics_cache', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('cache_key').notNullable(); // 'class_performance_JSS1A_term1'
    table.string('metric_type').notNullable(); // 'class_performance', 'subject_analysis'
    table.json('data'); // Cached calculation results
    table.json('parameters'); // Parameters used to generate cache
    table.datetime('expires_at').notNullable();
    table.timestamps(true, true);
    
    table.unique(['school_id', 'cache_key']);
    table.index(['metric_type', 'expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('analytics_cache');
};
