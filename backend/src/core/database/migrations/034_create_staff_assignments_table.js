
// backend/src/core/database/migrations/034_create_staff_assignments_table.js
exports.up = function(knex) {
  return knex.schema.createTable('staff_assignments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    // Assignment details
    table.enum('assignment_type', ['class', 'subject', 'administrative', 'supervisory', 'other']).notNullable();
    table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE'); // For class teachers
    table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE'); // For subject teachers
    table.string('assignment_title'); // For other types of assignments
    table.text('assignment_description');
    
    // Assignment period
    table.date('start_date').notNullable();
    table.date('end_date');
    table.uuid('term_id').references('id').inTable('terms').onDelete('SET NULL');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('SET NULL');
    
    // Assignment details
    table.integer('teaching_load_hours'); // Hours per week for academic staff
    table.json('responsibilities'); // Specific responsibilities
    table.enum('status', ['active', 'completed', 'suspended', 'cancelled']).defaultTo('active');
    
    table.uuid('assigned_by').references('id').inTable('users');
    table.uuid('approved_by').references('id').inTable('users');
    table.datetime('approved_at');
    table.text('notes');
    
    table.timestamps(true, true);
    
    table.index(['staff_id', 'assignment_type', 'status']);
    table.index(['class_id', 'status']);
    table.index(['subject_id', 'status']);
    table.index(['school_id', 'term_id', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('staff_assignments');
};