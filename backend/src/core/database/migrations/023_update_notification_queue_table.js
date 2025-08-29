
// backend/src/core/database/migrations/023_update_notification_queue_table.js
exports.up = function(knex) {
  return knex.schema.alterTable('notification_queue', function(table) {
    table.uuid('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');
    table.uuid('related_id'); // ID of related object (student, class, etc.)
    table.string('related_type'); // Type of related object
    table.json('tracking'); // Delivery tracking info
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('notification_queue', function(table) {
    table.dropColumn('template_id');
    table.dropColumn('related_id');
    table.dropColumn('related_type');
    table.dropColumn('tracking');
  });
};