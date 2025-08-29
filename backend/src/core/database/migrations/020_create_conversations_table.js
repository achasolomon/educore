// backend/src/core/database/migrations/020_create_conversations_table.js
exports.up = function(knex) {
  return knex.schema.createTable('conversations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('title').notNullable();
    table.enum('type', ['direct', 'group', 'class', 'parent_teacher']).notNullable();
    table.json('participants'); // Array of user IDs
    table.json('metadata'); // Additional conversation data (class_id, student_id, etc.)
    
    table.datetime('last_message_at');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_archived').defaultTo(false);
    table.timestamps(true, true);
    
    table.index(['school_id', 'type']);
    table.index(['initiated_by', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('conversations');
};