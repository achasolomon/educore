// backend/src/core/database/migrations/001_create_schools_table.js
exports.up = function(knex) {
  return knex.schema.createTable('schools', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('code').unique().notNullable(); // e.g., 'STJOHNS001'
    table.string('email').unique();
    table.string('phone');
    table.text('address');
    table.string('logo_url');
    table.string('website');
    table.enum('type', ['nursery', 'primary', 'secondary', 'mixed']).defaultTo('mixed');
    table.enum('status', ['active', 'suspended', 'inactive']).defaultTo('active');
    table.json('settings').defaultTo('{}'); // School-specific configurations
    table.timestamp('established_date');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['code', 'status']);
    table.index('name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('schools');
};
