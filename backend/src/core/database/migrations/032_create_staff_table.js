// backend/src/core/database/migrations/032_create_staff_table.js
exports.up = function(knex) {
  return knex.schema.createTable('staff', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL'); // Link to auth user
    table.uuid('category_id').references('id').inTable('staff_categories').onDelete('CASCADE');
    table.uuid('department_id').references('id').inTable('departments').onDelete('CASCADE');
    table.uuid('position_id').references('id').inTable('positions').onDelete('CASCADE');
    
    // Personal Information
    table.string('staff_id').notNullable(); // Unique staff identifier
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('middle_name');
    table.enum('gender', ['male', 'female']).notNullable();
    table.date('date_of_birth');
    table.string('phone').notNullable();
    table.string('email');
    table.text('address');
    table.string('state_of_origin');
    table.string('lga_of_origin');
    table.string('nationality').defaultTo('Nigerian');
    table.enum('marital_status', ['single', 'married', 'divorced', 'widowed']);
    
    // Employment Information
    table.date('hire_date').notNullable();
    table.date('probation_end_date');
    table.date('confirmation_date');
    table.enum('employment_type', ['permanent', 'contract', 'part_time', 'casual', 'volunteer']).notNullable();
    table.enum('employment_status', ['active', 'on_leave', 'suspended', 'terminated', 'retired']).defaultTo('active');
    table.date('contract_start_date');
    table.date('contract_end_date');
    
    // Financial Information
    table.decimal('basic_salary', 12, 2);
    table.json('allowances'); // Housing, transport, medical etc.
    table.string('bank_name');
    table.string('account_number');
    table.string('account_name');
    table.string('pension_pin');
    table.string('tax_id');
    
    // Emergency Contact
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.string('emergency_contact_relationship');
    
    // Professional Information
    table.json('qualifications'); // Educational qualifications
    table.json('certifications'); // Professional certifications
    table.json('experience'); // Previous work experience
    table.json('skills'); // Special skills and competencies
    table.text('bio'); // Professional biography
    
    // Medical Information
    table.string('blood_group');
    table.json('medical_conditions');
    table.json('medications');
    
    // Documents and Photos
    table.string('photo_url');
    table.json('documents'); // CV, certificates, etc.
    
    // System fields
    table.boolean('is_active').defaultTo(true);
    table.json('metadata'); // Additional flexible data
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.timestamps(true, true);
    
    table.unique(['school_id', 'staff_id']);
    table.unique(['school_id', 'email']);
    table.index(['school_id', 'category_id', 'is_active']);
    table.index(['department_id', 'employment_status']);
    table.index(['employment_type', 'employment_status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('staff');
};
