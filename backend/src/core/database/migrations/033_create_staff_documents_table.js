// backend/src/core/database/migrations/033_create_staff_documents_table.js
exports.up = function(knex) {
  return knex.schema.createTable('staff_documents', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    
    table.string('document_type').notNullable(); // CV, Certificate, License, etc.
    table.string('document_name').notNullable();
    table.string('file_name').notNullable();
    table.string('file_path').notNullable();
    table.string('file_type'); // PDF, DOC, JPG, etc.
    table.integer('file_size');
    table.date('issue_date');
    table.date('expiry_date');
    table.string('issuing_authority');
    table.boolean('is_verified').defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users');
    table.datetime('verified_at');
    table.text('verification_notes');
    table.boolean('is_active').defaultTo(true);
    
    table.uuid('uploaded_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    table.index(['staff_id', 'document_type', 'is_active']);
    table.index(['school_id', 'expiry_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('staff_documents');
};
