
// backend/src/core/database/migrations/003_create_users_table.js
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.string('email').notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone');
    table.string('avatar_url');
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.text('address');
    table.enum('status', ['active', 'inactive', 'suspended', 'pending']).defaultTo('pending');
    table.timestamp('email_verified_at');
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.timestamp('last_login_at');
    table.json('preferences').defaultTo('{}');
    table.timestamps(true, true);
    
    // Composite unique constraint - email must be unique per school
    table.unique(['school_id', 'email']);
    table.index(['school_id', 'status']);
    table.index('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};