// backend/src/core/database/migrations/010_create_grades_table.js
exports.up = function(knex) {
  return knex.schema.createTable('grades', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('assessment_id').references('id').inTable('assessments').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('teacher_id').references('id').inTable('users').onDelete('SET NULL');
    
    table.decimal('score', 5, 2); // Score achieved (e.g., 85.50)
    table.decimal('percentage', 5, 2); // Calculated percentage
    table.string('letter_grade', 2); // A, B, C, D, F
    table.text('remarks'); // Teacher's comments
    table.enum('status', ['draft', 'published', 'reviewed']).defaultTo('draft');
    table.datetime('graded_at');
    table.timestamps(true, true);
    
    table.unique(['assessment_id', 'student_id']); // One grade per student per assessment
    table.index(['student_id', 'assessment_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('grades');
};