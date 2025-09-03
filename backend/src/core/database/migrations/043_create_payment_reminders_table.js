// backend/src/core/database/migrations/043_create_payment_reminders_table.js
exports.up = function(knex) {
  return knex.schema.createTable('payment_reminders', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('student_fee_id').references('id').inTable('student_fees').onDelete('CASCADE');
    
    // Reminder details
    table.string('reminder_type').notNullable(); // due_date, overdue, final_notice
    table.string('message_title').notNullable();
    table.text('message_content').notNullable();
    table.decimal('outstanding_amount', 12, 2).notNullable();
    table.date('due_date');
    table.integer('days_overdue').defaultTo(0);
    
    // Delivery tracking
    table.enum('delivery_method', ['sms', 'email', 'whatsapp', 'in_app', 'all']).defaultTo('sms');
    table.enum('status', ['pending', 'sent', 'delivered', 'failed']).defaultTo('pending');
    table.datetime('scheduled_for');
    table.datetime('sent_at');
    table.datetime('delivered_at');
    table.text('delivery_error');
    table.integer('retry_count').defaultTo(0);
    
    // Response tracking
    table.boolean('payment_made').defaultTo(false);
    table.datetime('payment_made_at');
    table.decimal('payment_amount', 12, 2);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'status']);
    table.index(['student_id', 'reminder_type']);
    table.index(['scheduled_for', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_reminders');
};