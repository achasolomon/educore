// backend/src/core/database/migrations/017_create_notification_queue_table.js
exports.up = function(knex) {
  return knex.schema.createTable('notification_queue', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.string('type').notNullable(); // 'email', 'sms', 'push'
    table.string('template').notNullable(); // 'report_ready', 'grade_published'
    table.string('recipient'); // Email or phone number
    table.string('subject');
    table.text('content');
    table.json('data'); // Template variables
    table.json('attachments'); // File paths for email attachments
    table.enum('status', ['pending', 'sent', 'failed', 'cancelled']).defaultTo('pending');
    table.text('error_message');
    table.integer('retry_count').defaultTo(0);
    table.datetime('scheduled_at');
    table.datetime('sent_at');
    table.timestamps(true, true);
    
    table.index(['status', 'scheduled_at']);
    table.index(['school_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_queue');
};