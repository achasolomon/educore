// backend/src/core/database/migrations/029_create_staff_categories_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('staff_categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('name').notNullable(); // Teachers, Administrative, Support, Medical, Transport
    table.string('code').notNullable(); // ACAD, ADMIN, SUPP, MED, TRANS
    table.text('description');
    table.json('required_fields'); // Specific fields required for this category
    table.json('optional_fields'); // Optional fields for this category
    table.boolean('is_academic').defaultTo(false); // Academic vs Non-academic distinction
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('staff_categories');
};