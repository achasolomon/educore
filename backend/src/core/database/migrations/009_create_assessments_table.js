// backend/src/core/database/migrations/009_create_assessments_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('assessments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('title').notNullable(); // 'CA1', 'Mid-term Exam', 'Final Exam'
    table.text('description');
    table.enum('type', ['ca', 'exam', 'assignment', 'project', 'practical']).notNullable();
    table.integer('max_score').notNullable().defaultTo(100);
    table.integer('weight_percentage').notNullable(); // How much this assessment contributes to final grade
    table.date('assessment_date');
    table.datetime('due_date');
    table.enum('status', ['draft', 'published', 'completed', 'graded']).defaultTo('draft');
    table.text('instructions');
    table.timestamps(true, true);
    
    table.index(['school_id', 'class_id', 'subject_id']);
    table.index(['term_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('assessments');
};