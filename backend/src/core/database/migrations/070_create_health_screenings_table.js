// backend/src/core/database/migrations/070_create_health_screenings_table.js
exports.up = function(knex) {
  return knex.schema.createTable('health_screenings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('conducted_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    
    // Screening identification
    table.string('screening_reference').notNullable();
    table.date('screening_date').notNullable();
    table.enum('screening_type', [
      'mass_screening', 'targeted_screening', 'follow_up_screening',
      'pre_sports_screening', 'routine_health_check', 'epidemic_screening'
    ]).notNullable();
    
    // Specific screening categories
    table.boolean('vision_screening_conducted').defaultTo(false);
    table.json('vision_screening_results');
    
    table.boolean('hearing_screening_conducted').defaultTo(false);
    table.json('hearing_screening_results');
    
    table.boolean('dental_screening_conducted').defaultTo(false);
    table.json('dental_screening_results');
    
    table.boolean('growth_screening_conducted').defaultTo(false);
    table.json('growth_measurements'); // height, weight, BMI trends
    
    table.boolean('nutrition_screening_conducted').defaultTo(false);
    table.json('nutrition_assessment');
    
    table.boolean('mental_health_screening_conducted').defaultTo(false);
    table.json('mental_health_indicators');
    
    table.boolean('skin_screening_conducted').defaultTo(false);
    table.json('skin_examination_findings');
    
    table.boolean('posture_screening_conducted').defaultTo(false);
    table.json('posture_assessment');
    
    // Epidemic/Disease specific screenings
    table.json('disease_specific_screenings'); // COVID, malaria, etc.
    table.json('symptom_checklist'); // Array of symptoms checked
    table.decimal('temperature_recorded', 4, 1);
    table.boolean('fever_detected').defaultTo(false);
    
    // Risk assessment
    table.json('risk_factors_identified'); // Array of health risk factors
    table.enum('overall_risk_level', ['low', 'moderate', 'high', 'critical']).defaultTo('low');
    table.text('risk_assessment_notes');
    
    // Screening results and recommendations
    table.enum('screening_outcome', [
      'normal', 'requires_monitoring', 'requires_follow_up', 
      'immediate_attention_needed', 'referral_required'
    ]).defaultTo('normal');
    
    table.json('abnormal_findings'); // Array of abnormal findings
    table.json('recommendations'); // Array of recommendations
    table.json('referrals_made'); // Array of referrals to specialists
    
    // Follow-up tracking
    table.boolean('follow_up_required').defaultTo(false);
    table.date('follow_up_due_date');
    table.text('follow_up_instructions');
    table.boolean('follow_up_completed').defaultTo(false);
    table.date('follow_up_completion_date');
    
    // Parent communication
    table.boolean('parents_notified').defaultTo(false);
    table.datetime('parents_notification_date');
    table.enum('notification_method', ['phone', 'sms', 'email', 'letter', 'in_person']);
    table.text('parent_communication_notes');
    
    // Screening program tracking
    table.string('screening_program_name'); // e.g., "Annual Health Screening 2024"
    table.uuid('screening_program_id'); // Link to screening program if exists
    table.boolean('part_of_mass_screening').defaultTo(false);
    table.integer('screening_sequence_number'); // Order in mass screening
    
    // Quality assurance
    table.boolean('screening_quality_verified').defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.datetime('verification_date');
    table.text('quality_notes');
    
    // Documentation and reporting
    table.json('screening_documents'); // Array of document URLs
    table.boolean('added_to_health_record').defaultTo(false);
    table.boolean('reported_to_health_authorities').defaultTo(false);
    table.text('additional_notes');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'screening_reference']);
    table.index(['school_id', 'student_id', 'screening_date']);
    table.index(['screening_type', 'academic_year_id']);
    table.index(['screening_outcome', 'follow_up_required']);
    table.index(['fever_detected', 'screening_date']);
    table.index(['overall_risk_level', 'school_id']);
    table.index(['parents_notified', 'screening_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('health_screenings');
};