// backend/src/core/database/migrations/026_create_attendance_rules_table.js
exports.up = function(knex) {
  return knex.schema.createTable('attendance_rules', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('rule_name').notNullable();
    table.string('rule_type').notNullable(); // 'lateness_threshold', 'absence_alert', etc.
    table.json('rule_config'); // Rule-specific configuration
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0); // Rule execution order
    
    table.timestamps(true, true);
    
    table.index(['school_id', 'rule_type', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance_rules');
};