// backend/src/core/database/migrations/004_create_user_roles_table.js
exports.up = function(knex) {
  return knex.schema.createTable('user_roles', function(table) {
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.primary(['user_id', 'role_id', 'school_id']);
    table.index(['user_id', 'school_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_roles');
};