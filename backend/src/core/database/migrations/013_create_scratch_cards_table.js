// backend/src/core/database/migrations/013_create_scratch_cards_table.js
exports.up = function(knex) {
  return knex.schema.createTable('scratch_cards', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('SET NULL');
    table.uuid('term_id').references('id').inTable('terms').onDelete('CASCADE');
    
    table.string('card_number').unique().notNullable(); // 12-digit card number
    table.string('pin').notNullable(); // 4-6 digit PIN
    table.enum('card_type', ['basic', 'standard', 'premium']).notNullable();
    table.decimal('amount', 10, 2).notNullable(); // Card price
    
    // Card usage tracking
    table.enum('status', ['active', 'used', 'expired', 'blocked']).defaultTo('active');
    table.datetime('used_at');
    table.string('used_by_ip');
    table.datetime('expires_at');
    table.integer('access_count').defaultTo(0);
    table.datetime('last_accessed_at');
    
    table.timestamps(true, true);
    
    table.index(['card_number', 'pin']);
    table.index(['school_id', 'status']);
    table.index(['student_id', 'term_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scratch_cards');
};