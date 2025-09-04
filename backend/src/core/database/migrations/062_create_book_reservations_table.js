
// backend/src/core/database/migrations/062_create_book_reservations_table.js
exports.up = function(knex) {
  return knex.schema.createTable('book_reservations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('book_id').references('id').inTable('library_books').onDelete('CASCADE');
    table.uuid('member_id').references('id').inTable('library_members').onDelete('CASCADE');
    
    // Reservation details
    table.string('reservation_id').notNullable();
    table.datetime('reserved_at').notNullable();
    table.datetime('expires_at').notNullable();
    table.datetime('notified_at');
    table.datetime('fulfilled_at');
    
    // Status and queue
    table.enum('status', ['active', 'notified', 'fulfilled', 'expired', 'cancelled']).defaultTo('active');
    table.integer('queue_position').notNullable();
    table.integer('estimated_wait_days');
    
    // Notification tracking
    table.boolean('notification_sent').defaultTo(false);
    table.integer('notification_count').defaultTo(0);
    table.datetime('last_notification_sent');
    
    // Fulfillment
    table.uuid('fulfilled_transaction_id').references('id').inTable('book_transactions').onDelete('SET NULL');
    table.text('cancellation_reason');
    table.uuid('cancelled_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'reservation_id']);
    table.index(['school_id', 'book_id', 'status']);
    table.index(['member_id', 'status']);
    table.index(['status', 'expires_at']);
    table.index(['queue_position', 'reserved_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('book_reservations');
};