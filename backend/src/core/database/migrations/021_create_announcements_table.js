// backend/src/core/database/migrations/021_create_announcements_table.js
exports.up = function(knex) {
  return knex.schema.createTable('announcements', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.enum('type', ['general', 'academic', 'event', 'emergency', 'holiday']).notNullable();
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.json('target_audience'); // roles, classes, or specific users
    table.json('attachments');
    
    table.datetime('publish_at'); // When to publish
    table.datetime('expires_at'); // When announcement expires
    table.boolean('is_published').defaultTo(false);
    table.boolean('send_notification').defaultTo(true); // Send push/email notifications
    table.boolean('is_pinned').defaultTo(false); // Pin to top of announcements
    
    table.integer('view_count').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['school_id', 'type', 'is_published']);
    table.index(['publish_at', 'expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('announcements');
};