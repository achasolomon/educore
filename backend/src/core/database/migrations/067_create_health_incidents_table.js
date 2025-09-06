// backend/src/core/database/migrations/067_create_health_incidents_table.js
exports.up = function(knex) {
  return knex.schema.createTable('health_incidents', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('reported_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('attended_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Incident identification
    table.string('incident_reference').notNullable();
    table.datetime('incident_datetime').notNullable();
    table.string('location_of_incident').notNullable(); // classroom, playground, cafeteria, etc.
    
    // Incident classification
    table.enum('incident_type', [
      'injury', 'illness', 'allergic_reaction', 'medication_related', 
      'behavioral', 'emergency', 'accident', 'other'
    ]).notNullable();
    
    table.enum('severity_level', [
      'minor', 'moderate', 'serious', 'critical', 'life_threatening'
    ]).notNullable();
    
    // Incident details
    table.text('incident_description').notNullable();
    table.text('symptoms_observed');
    table.json('vital_signs'); // Temperature, pulse, BP, etc.
    table.text('immediate_action_taken');
    table.json('witnesses'); // Array of witness information
    
    // Treatment and response
    table.text('treatment_provided');
    table.json('medications_administered'); // Array of medication records
    table.boolean('first_aid_provided').defaultTo(false);
    table.uuid('first_aid_provider').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('professional_medical_attention_required').defaultTo(false);
    table.string('medical_professional_contacted');
    
    // Emergency response
    table.boolean('parents_notified').defaultTo(false);
    table.datetime('parents_notification_time');
    table.string('parent_notification_method'); // phone, sms, email, in-person
    table.boolean('emergency_services_called').defaultTo(false);
    table.string('emergency_service_type'); // ambulance, fire, police
    table.datetime('emergency_services_arrival_time');
    table.string('hospital_taken_to');
    
    // Follow-up and resolution
    table.enum('student_disposition', [
      'remained_at_school', 'sent_home', 'taken_to_hospital', 
      'picked_up_by_parent', 'referred_to_nurse', 'other'
    ]).notNullable();
    
    table.text('follow_up_instructions');
    table.boolean('requires_follow_up').defaultTo(false);
    table.date('follow_up_date');
    table.text('follow_up_notes');
    
    // Documentation and reporting
    table.json('incident_photos'); // Array of photo URLs (if applicable)
    table.boolean('incident_report_filed').defaultTo(false);
    table.string('official_report_number');
    table.boolean('insurance_claim_required').defaultTo(false);
    table.string('insurance_claim_number');
    
    // Status tracking
    table.enum('status', ['open', 'under_investigation', 'resolved', 'closed']).defaultTo('open');
    table.text('resolution_notes');
    table.datetime('resolved_at');
    table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Prevention and learning
    table.boolean('preventable_incident').defaultTo(false);
    table.text('prevention_recommendations');
    table.json('safety_measures_implemented'); // Array of new safety measures
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'incident_reference']);
    table.index(['school_id', 'student_id', 'incident_datetime']);
    table.index(['incident_type', 'severity_level']);
    table.index(['status', 'requires_follow_up']);
    table.index(['incident_datetime', 'school_id']);
    table.index(['parents_notified', 'emergency_services_called']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('health_incidents');
};
