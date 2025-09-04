// backend/src/core/database/migrations/064_create_book_reviews_table.js
exports.up = function(knex) {
  return knex.schema.createTable('book_reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('book_id').references('id').inTable('library_books').onDelete('CASCADE');
    table.uuid('member_id').references('id').inTable('library_members').onDelete('CASCADE');
    table.uuid('transaction_id').references('id').inTable('book_transactions').onDelete('SET NULL');
    
    // Review details
    table.integer('rating').notNullable(); // 1-5 stars
    table.string('title');
    table.text('review_text');
    table.boolean('is_anonymous').defaultTo(false);
    table.boolean('recommend_to_others').defaultTo(true);
    
    // Moderation
    table.enum('status', ['pending', 'approved', 'rejected', 'flagged']).defaultTo('approved');
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('reviewed_at');
    table.text('moderation_notes');
    
    // Engagement
    table.integer('helpful_count').defaultTo(0);
    table.integer('not_helpful_count').defaultTo(0);
    table.boolean('is_verified_reader').defaultTo(false);
    
    table.timestamps(true, true);
    
    table.unique(['member_id', 'book_id']); // One review per member per book
    table.index(['school_id', 'book_id', 'status']);
    table.index(['member_id', 'rating']);
    table.index(['status', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('book_reviews');
};