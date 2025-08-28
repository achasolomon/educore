// backend/src/core/database/migrations/005_create_students_table.js
exports.up = function(knex) {
  return knex.schema.createTable('students', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('student_id').notNullable(); // e.g., 'STU/2024/001'
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('middle_name');
    table.date('date_of_birth').notNullable();
    table.enum('gender', ['male', 'female']).notNullable();
    table.string('blood_group');
    table.text('medical_conditions');
    table.text('allergies');
    table.string('photo_url');
    table.date('admission_date').notNullable();
    table.string('admission_number').notNullable();
    table.enum('status', ['active', 'graduated', 'transferred', 'withdrawn', 'suspended']).defaultTo('active');
    table.text('address').notNullable();
    table.string('state_of_origin');
    table.string('lga_of_origin');
    table.string('nationality').defaultTo('Nigerian');
    table.string('previous_school');
    table.text('special_needs');
    table.json('emergency_contacts').defaultTo('[]');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'student_id']);
    table.unique(['school_id', 'admission_number']);
    table.index(['school_id', 'status']);
    table.index(['first_name', 'last_name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('students');
};