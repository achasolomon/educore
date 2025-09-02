// backend/src/core/database/migrations/035_create_fee_categories_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('fee_categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('name').notNullable(); // Tuition, Development, Transport, Books, etc.
    table.string('code').notNullable(); // TUITION, DEV, TRANS, BOOKS
    table.text('description');
    table.enum('category_type', ['mandatory', 'optional']).defaultTo('mandatory');
    table.boolean('is_recurring').defaultTo(true); // Charged every term/session
    table.enum('billing_cycle', ['term', 'session', 'monthly', 'one_time']).defaultTo('term');
    
    // Default amounts (can be overridden per class/student)
    table.decimal('default_amount', 12, 2).defaultTo(0);
    table.decimal('late_fee_amount', 12, 2).defaultTo(0);
    table.integer('late_fee_days').defaultTo(30); // Days after which late fee applies
    
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.json('metadata'); // Additional fee category data
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'is_active', 'sort_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('fee_categories');
};
