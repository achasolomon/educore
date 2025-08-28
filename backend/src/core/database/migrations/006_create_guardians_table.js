// backend/src/core/database/migrations/006_create_guardians_table.js
exports.up = function(knex) {
  return knex.schema
    .createTable('guardians', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone').notNullable();
      table.string('email');
      table.string('occupation');
      table.text('work_address');
      table.string('work_phone');
      table.text('home_address');
      table.enum('gender', ['male', 'female']);
      table.timestamps(true, true);
      
      table.index(['school_id', 'phone']);
      table.index(['first_name', 'last_name']);
    })
    .createTable('student_guardians', function(table) {
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.uuid('guardian_id').references('id').inTable('guardians').onDelete('CASCADE');
      table.enum('relationship', ['father', 'mother', 'guardian', 'uncle', 'aunt', 'grandparent', 'sibling', 'other']).notNullable();
      table.boolean('is_primary').defaultTo(false);
      table.boolean('can_pickup').defaultTo(true);
      table.boolean('emergency_contact').defaultTo(true);
      table.timestamps(true, true);
      
      table.primary(['student_id', 'guardian_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('student_guardians')
    .dropTable('guardians');
};