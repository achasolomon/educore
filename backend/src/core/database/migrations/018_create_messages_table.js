// backend/src/core/database/migrations/018_create_messages_table.js
const crypto = require('crypto');

exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('conversation_id'); // Group related messages
    
    table.string('subject').notNullable();
    table.text('content').notNullable();
    table.enum('message_type', ['direct', 'broadcast', 'announcement', 'emergency']).defaultTo('direct');
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.json('attachments'); // File attachments
    table.json('metadata'); // Additional message data
    
    table.enum('status', ['draft', 'sent', 'delivered', 'read', 'failed']).defaultTo('draft');
    table.datetime('sent_at');
    table.datetime('scheduled_for'); // For scheduled messages
    table.timestamps(true, true);
    
    table.index(['school_id', 'message_type']);
    table.index(['sender_id', 'created_at']);
    table.index(['conversation_id']);
    table.index(['scheduled_for']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};

