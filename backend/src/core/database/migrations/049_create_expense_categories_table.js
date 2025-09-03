// backend/src/core/database/migrations/049_create_expense_categories_table.js
exports.up = function(knex) {
  return knex.schema.createTable('expense_categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('parent_category_id').references('id').inTable('expense_categories').onDelete('SET NULL');
    
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description');
    table.enum('category_type', ['operating', 'capital', 'administrative', 'academic', 'maintenance']).notNullable();
    
    table.boolean('is_active').defaultTo(true);
    table.boolean('requires_approval').defaultTo(false);
    table.decimal('approval_threshold', 12, 2); // Requires approval above this amount
    table.integer('sort_order').defaultTo(0);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'code']);
    table.index(['school_id', 'category_type', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expense_categories');
};