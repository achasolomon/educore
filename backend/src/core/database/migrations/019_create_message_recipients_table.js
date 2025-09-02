// backend/src/core/database/migrations/019_create_message_recipients_table.js
exports.up = function(knex) {
  return knex.schema.createTable('message_recipients', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('message_id').references('id').inTable('messages').onDelete('CASCADE');
    table.uuid('recipient_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.enum('recipient_type', ['to', 'cc', 'bcc']).defaultTo('to');
    table.enum('status', ['pending', 'delivered', 'read', 'failed']).defaultTo('pending');
    table.datetime('delivered_at');
    table.datetime('read_at');
    table.text('delivery_error'); // Error message if delivery failed
    table.timestamps(true, true);
    
    table.unique(['message_id', 'recipient_id']);
    table.index(['recipient_id', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('message_recipients');
};