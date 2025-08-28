// backend/src/core/database/migrations/007_create_academic_structure.js
exports.up = function(knex) {
  return knex.schema
    .createTable('academic_years', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('name').notNullable(); // '2024/2025'
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.boolean('is_current').defaultTo(false);
      table.enum('status', ['upcoming', 'active', 'completed']).defaultTo('upcoming');
      table.timestamps(true, true);
      
      table.unique(['school_id', 'name']);
      table.index(['school_id', 'is_current']);
    })
    .createTable('terms', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
      table.string('name').notNullable(); // 'First Term', 'Second Term', 'Third Term'
      table.integer('term_number').notNullable(); // 1, 2, 3
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.boolean('is_current').defaultTo(false);
      table.timestamps(true, true);
      
      table.unique(['academic_year_id', 'term_number']);
    })
    .createTable('classes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('name').notNullable(); // 'JSS 1A', 'Primary 3B'
      table.string('level').notNullable(); // 'Nursery 1', 'Primary 1', 'JSS 1', 'SSS 3'
      table.string('section'); // 'A', 'B', 'C' - for multiple streams
      table.integer('capacity').defaultTo(50);
      table.uuid('class_teacher_id').references('id').inTable('users');
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.unique(['school_id', 'name']);
      table.index(['school_id', 'level']);
    })
    .createTable('subjects', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('name').notNullable(); // 'Mathematics', 'English Language'
      table.string('code').notNullable(); // 'MTH', 'ENG'
      table.text('description');
      table.enum('category', ['core', 'elective', 'vocational']).defaultTo('core');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.unique(['school_id', 'code']);
      table.index(['school_id', 'category']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('subjects')
    .dropTable('classes')
    .dropTable('terms')
    .dropTable('academic_years');
};