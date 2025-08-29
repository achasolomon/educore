// backend/src/core/database/migrations/011_create_grade_templates_table.js
exports.up = function(knex) {
  return knex.schema.createTable('grade_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('name').notNullable(); // 'Primary Grading', 'Secondary Grading'
    table.text('description');
    table.json('grade_boundaries'); // {A: {min: 70, max: 100}, B: {min: 60, max: 69}, ...}
    table.json('assessment_weights'); // {ca1: 10, ca2: 10, ca3: 10, ca4: 10, exam: 60}
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['school_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('grade_templates');
};