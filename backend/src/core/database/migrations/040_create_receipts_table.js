
// backend/src/core/database/migrations/040_create_receipts_table.js
exports.up = function(knex) {
  return knex.schema.createTable('receipts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('payment_id').references('id').inTable('payments').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    
    table.string('receipt_number').notNullable();
    table.date('receipt_date').notNullable();
    table.decimal('total_amount', 12, 2).notNullable();
    table.json('fee_breakdown'); // Detailed breakdown of fees paid
    table.string('payment_method');
    table.string('payment_reference');
    
    // Receipt template and generation
    table.string('template_used').defaultTo('default');
    table.text('receipt_html'); // Generated HTML receipt
    table.string('pdf_path'); // Path to generated PDF
    table.boolean('is_generated').defaultTo(false);
    table.datetime('generated_at');
    
    // Email/SMS delivery tracking
    table.boolean('is_emailed').defaultTo(false);
    table.datetime('emailed_at');
    table.boolean('is_sms_sent').defaultTo(false);
    table.datetime('sms_sent_at');
    
    table.uuid('generated_by').references('id').inTable('users').onDelete('SET NULL');
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'receipt_number']);
    table.index(['student_id', 'receipt_date']);
    table.index(['payment_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('receipts');
};