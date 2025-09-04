// backend/src/core/database/migrations/065_create_reading_sessions_table.js
exports.up = function(knex) {
  return knex.schema.createTable('reading_sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('member_id').references('id').inTable('library_members').onDelete('CASCADE');
    table.uuid('book_id').references('id').inTable('library_books').onDelete('CASCADE');
    table.uuid('transaction_id').references('id').inTable('book_transactions').onDelete('CASCADE');
    
    // Session tracking
    table.datetime('session_start').notNullable();
    table.datetime('session_end');
    table.integer('duration_minutes').defaultTo(0);
    table.integer('pages_read').defaultTo(0);
    table.decimal('progress_percentage', 5, 2).defaultTo(0);
    
    // Reading location and context
    table.enum('reading_location', ['library', 'home', 'classroom', 'other']).defaultTo('library');
    table.enum('reading_format', ['physical', 'digital', 'audio']).defaultTo('physical');
    table.string('device_used'); // For digital reading
    
    // Progress tracking
    table.integer('chapter_reached');
    table.string('last_bookmark');
    table.json('notes'); // Reading notes and highlights
    table.integer('vocabulary_words_looked_up').defaultTo(0);
    
    // Comprehension and engagement
    table.integer('comprehension_score'); // If available from digital platform
    table.integer('engagement_score'); // Based on reading pattern
    table.boolean('completed_book').defaultTo(false);
    
    table.timestamps(true, true);
    
    table.index(['school_id', 'member_id', 'session_start']);
    table.index(['book_id', 'reading_format']);
    table.index(['transaction_id', 'completed_book']);
    table.index(['session_start', 'duration_minutes']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reading_sessions');
};