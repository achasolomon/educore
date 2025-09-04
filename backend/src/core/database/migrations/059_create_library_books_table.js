// backend/src/core/database/migrations/059_create_library_books_table.js
exports.up = function(knex) {
  return knex.schema.createTable('library_books', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Book identification
    table.string('isbn').unique();
    table.string('isbn_13').unique();
    table.string('barcode').notNullable();
    table.string('library_code').notNullable();
    table.string('accession_number').notNullable();
    
    // Book details
    table.string('title').notNullable();
    table.string('subtitle');
    table.string('author').notNullable();
    table.string('co_authors');
    table.string('publisher');
    table.integer('publication_year');
    table.string('edition');
    table.string('language').defaultTo('English');
    table.integer('pages');
    
    // Categorization
    table.string('category').notNullable();
    table.string('sub_category');
    table.string('genre');
    table.string('subject');
    table.text('keywords');
    table.string('dewey_decimal');
    table.string('location_rack');
    table.string('location_shelf');
    
    // Physical description
    table.enum('format', ['hardcover', 'paperback', 'digital', 'audio']).defaultTo('paperback');
    table.string('dimensions'); // e.g., "24cm x 16cm"
    table.decimal('weight', 5, 2); // in kg
    table.string('cover_image_url');
    
    // Acquisition details
    table.date('acquisition_date').notNullable();
    table.enum('acquisition_type', ['purchase', 'donation', 'exchange', 'other']).defaultTo('purchase');
    table.string('supplier');
    table.decimal('cost', 10, 2);
    table.string('invoice_number');
    table.text('acquisition_notes');
    
    // Status and condition
    table.enum('status', ['available', 'checked_out', 'reserved', 'maintenance', 'lost', 'damaged', 'withdrawn']).defaultTo('available');
    table.enum('condition', ['excellent', 'good', 'fair', 'poor', 'damaged']).defaultTo('good');
    table.text('condition_notes');
    
    // Circulation rules
    table.integer('loan_period_days').defaultTo(14);
    table.integer('max_renewals').defaultTo(2);
    table.decimal('replacement_cost', 10, 2);
    table.decimal('late_fee_per_day', 6, 2).defaultTo(5.00);
    table.boolean('is_reference_only').defaultTo(false);
    table.boolean('is_restricted').defaultTo(false);
    table.json('restricted_to_classes'); // Array of class IDs
    
    // Digital content
    table.string('digital_file_path');
    table.string('digital_format'); // pdf, epub, etc.
    table.bigint('file_size_bytes');
    table.boolean('allow_digital_download').defaultTo(false);
    
    // Statistics
    table.integer('total_checkouts').defaultTo(0);
    table.integer('current_popularity_score').defaultTo(0);
    table.decimal('average_rating', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.date('last_checked_out');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'barcode']);
    table.unique(['school_id', 'accession_number']);
    table.index(['school_id', 'status', 'category']);
    table.index(['title', 'author']);
    table.index(['isbn', 'isbn_13']);
    table.index(['location_rack', 'location_shelf']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('library_books');
};