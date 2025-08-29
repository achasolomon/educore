// backend/src/core/database/migrations/012_create_student_results_table.js
exports.up = function(knex) {
  return knex.schema.createTable('student_results', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.uuid('term_id').references('id').inTable('terms').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    // Individual assessment scores
    table.decimal('ca1_score', 5, 2);
    table.decimal('ca2_score', 5, 2);
    table.decimal('ca3_score', 5, 2);
    table.decimal('ca4_score', 5, 2);
    table.decimal('exam_score', 5, 2);
    
    // Calculated totals
    table.decimal('total_ca', 5, 2); // Sum of all CA scores
    table.decimal('total_score', 5, 2); // Final calculated score
    table.decimal('percentage', 5, 2); // Percentage score
    table.string('letter_grade', 2); // A, B, C, D, F
    table.integer('class_position'); // Position in class for this subject
    table.string('remark'); // Excellent, Very Good, Good, etc.
    
    table.enum('status', ['draft', 'published', 'approved']).defaultTo('draft');
    table.timestamps(true, true);
    
    table.unique(['student_id', 'subject_id', 'term_id']); // One result per student per subject per term
    table.index(['class_id', 'subject_id', 'term_id']);
    table.index(['student_id', 'term_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_results');
};