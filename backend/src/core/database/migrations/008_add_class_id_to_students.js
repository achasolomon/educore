// backend/src/core/database/migrations/008_add_class_id_to_students.js
exports.up = function(knex) {
  return knex.schema.table('students', function(table) {
    table.uuid('class_id').references('id').inTable('classes').onDelete('SET NULL');
    table.index('class_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('students', function(table) {
    table.dropColumn('class_id');
  });
};