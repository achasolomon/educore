// backend/src/core/database/migrations/030_create_departments_table.js
exports.up = function(knex) {
  return knex.schema.createTable('departments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('name').notNullable(); // Mathematics, English, Administration, Maintenance
    table.string('code').notNullable(); // MATH, ENG, ADMIN, MAINT
    table.text('description');
    table.uuid('parent_department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.uuid('head_of_department').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('department_type').notNullable(); // academic, administrative, support
    table.boolean('is_active').defaultTo(true);
    table.integer('staff_capacity');
    table.json('metadata'); // Additional department-specific data
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'department_type', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('departments');
};
