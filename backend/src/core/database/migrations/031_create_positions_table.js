// backend/src/core/database/migrations/031_create_positions_table.js
exports.up = function(knex) {
  return knex.schema.createTable('positions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('department_id').references('id').inTable('departments').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('staff_categories').onDelete('CASCADE');
    
    table.string('title').notNullable(); // Principal, Teacher, Accountant, Driver
    table.string('code').notNullable(); // PRIN, TCH, ACC, DRV
    table.text('job_description');
    table.json('requirements'); // Qualifications, experience, certifications needed
    table.json('responsibilities'); // Key duties and responsibilities
    
    table.integer('grade_level'); // Salary grade level
    table.decimal('min_salary', 12, 2);
    table.decimal('max_salary', 12, 2);
    table.boolean('is_management').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.integer('max_positions'); // Maximum number of this position allowed
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'category_id', 'is_active']);
    table.index(['department_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('positions');
};