// backend/src/core/database/migrations/002_create_roles_and_permissions.js
exports.up = function(knex) {
  return knex.schema
    .createTable('roles', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable(); // 'super_admin', 'school_admin', 'teacher', 'parent', 'student'
      table.string('display_name').notNullable();
      table.text('description');
      table.integer('level').notNullable(); // 1=super_admin, 2=school_admin, 3=teacher, 4=parent, 5=student
      table.boolean('is_system_role').defaultTo(false);
      table.timestamps(true, true);
      
      table.unique('name');
      table.index('level');
    })
    .createTable('permissions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable().unique(); // 'students:create', 'grades:view'
      table.string('resource').notNullable(); // 'students', 'grades', 'users'
      table.string('action').notNullable(); // 'create', 'read', 'update', 'delete'
      table.text('description');
      table.timestamps(true, true);
      
      table.index(['resource', 'action']);
    })
    .createTable('role_permissions', function(table) {
      table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
      table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
      table.timestamps(true, true);
      
      table.primary(['role_id', 'permission_id']);
    });
    
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('role_permissions')
    .dropTable('permissions')
    .dropTable('roles');
};