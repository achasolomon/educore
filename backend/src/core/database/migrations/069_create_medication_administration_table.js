// backend/src/core/database/migrations/069_create_medication_administration_table.js
exports.up = function(knex) {
  return knex.schema.createTable('medication_administration', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('administered_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('authorized_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Medication details
    table.string('medication_name').notNullable();
    table.string('medication_type'); // tablet, liquid, injection, inhaler, etc.
    table.string('dosage').notNullable();
    table.string('unit_of_measurement'); // mg, ml, units, etc.
    table.text('administration_instructions');
    
    // Prescription information
    table.string('prescribed_by'); // Doctor name
    table.string('prescription_reference');
    table.date('prescription_date');
    table.date('prescription_expiry');
    table.text('medical_condition_treated');
    
    // Administration details
    table.datetime('scheduled_time').notNullable();
    table.datetime('actual_administration_time');
    table.enum('administration_method', [
      'oral', 'topical', 'injection', 'inhalation', 'nasal', 'rectal', 'other'
    ]).notNullable();
    
    // Status and completion
    table.enum('status', [
      'scheduled', 'administered', 'missed', 'refused', 'delayed', 'cancelled'
    ]).defaultTo('scheduled');
    
    table.text('administration_notes');
    table.text('reason_for_missed_refused');
    
    // Parent authorization
    table.boolean('parent_authorization_required').defaultTo(true);
    table.boolean('parent_authorization_received').defaultTo(false);
    table.datetime('parent_authorization_date');
    table.string('parent_authorization_method'); // written, verbal, electronic
    table.uuid('parent_authorization_document_id');
    
    // Safety and monitoring
    table.json('side_effects_to_monitor'); // Array of potential side effects
    table.json('observed_reactions'); // Array of observed reactions
    table.boolean('adverse_reaction_occurred').defaultTo(false);
    table.text('adverse_reaction_details');
    table.boolean('emergency_response_required').defaultTo(false);
    
    // Medication storage and tracking
    table.string('medication_batch_number');
    table.date('medication_expiry_date');
    table.string('storage_location');
    table.decimal('quantity_administered', 8, 3);
    table.decimal('remaining_quantity', 8, 3);
    
    // Schedule and frequency
    table.enum('frequency', [
      'once', 'daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
      'weekly', 'as_needed', 'emergency_only', 'other'
    ]).notNullable();
    
    table.integer('total_doses_prescribed');
    table.integer('doses_completed').defaultTo(0);
    table.boolean('course_completed').defaultTo(false);
    
    // Emergency medication specifics
    table.boolean('is_emergency_medication').defaultTo(false);
    table.json('emergency_administration_criteria'); // When to administer
    table.text('emergency_contact_instructions');
    
    // Integration with health incidents
    table.uuid('related_health_incident_id').references('id').inTable('health_incidents').onDelete('SET NULL');
    
    // Documentation and compliance
    table.boolean('documentation_complete').defaultTo(false);
    table.json('required_documentation'); // Array of required documents
    table.json('uploaded_documentation'); // Array of uploaded document URLs
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.index(['school_id', 'student_id', 'scheduled_time']);
    table.index(['status', 'scheduled_time']);
    table.index(['is_emergency_medication', 'school_id']);
    table.index(['administered_by', 'actual_administration_time']);
    table.index(['adverse_reaction_occurred', 'school_id']);
    table.index(['medication_expiry_date', 'school_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('medication_administration');
};