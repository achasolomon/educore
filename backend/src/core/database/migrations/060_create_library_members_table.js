
// backend/src/core/database/migrations/060_create_library_members_table.js
exports.up = function(knex) {
  return knex.schema.createTable('library_members', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    
    // Member identification
    table.string('member_id').notNullable();
    table.string('library_card_number').notNullable();
    table.enum('member_type', ['student', 'teacher', 'staff', 'parent', 'external']).notNullable();
    
    // Member details
    table.string('class_id').references('id').inTable('classes').onDelete('SET NULL');
    table.string('department');
    table.string('designation');
    
    // Membership status
    table.enum('status', ['active', 'suspended', 'expired', 'blocked']).defaultTo('active');
    table.date('membership_start_date').notNullable();
    table.date('membership_end_date').notNullable();
    table.date('last_active_date');
    
    // Borrowing privileges
    table.integer('max_books_allowed').defaultTo(3);
    table.integer('max_digital_books_allowed').defaultTo(2);
    table.integer('loan_period_days').defaultTo(14);
    table.integer('max_renewals_allowed').defaultTo(2);
    table.boolean('can_reserve_books').defaultTo(true);
    table.json('restricted_categories'); // Categories member cannot borrow
    
    // Current status
    table.integer('books_currently_borrowed').defaultTo(0);
    table.integer('digital_books_currently_borrowed').defaultTo(0);
    table.integer('books_reserved').defaultTo(0);
    table.decimal('outstanding_fines', 10, 2).defaultTo(0);
    table.boolean('has_overdue_books').defaultTo(false);
    
    // Statistics
    table.integer('total_books_borrowed').defaultTo(0);
    table.integer('total_reservations_made').defaultTo(0);
    table.integer('total_renewals_made').defaultTo(0);
    table.decimal('total_fines_paid', 10, 2).defaultTo(0);
    table.integer('reading_score').defaultTo(0);
    
    // Preferences
    table.json('favorite_genres');
    table.json('preferred_authors');
    table.boolean('email_notifications').defaultTo(true);
    table.boolean('sms_notifications').defaultTo(false);
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'member_id']);
    table.unique(['school_id', 'library_card_number']);
    table.unique(['user_id', 'academic_year_id']);
    table.index(['school_id', 'status', 'member_type']);
    table.index(['class_id', 'status']);
    table.index(['has_overdue_books', 'outstanding_fines']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('library_members');
};