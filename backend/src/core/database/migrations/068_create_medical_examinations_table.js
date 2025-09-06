// backend/src/core/database/migrations/068_create_medical_examinations_table.js
exports.up = function(knex) {
  return knex.schema.createTable('medical_examinations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('conducted_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
    
    // Examination details
    table.string('examination_reference').notNullable();
    table.date('examination_date').notNullable();
    table.enum('examination_type', [
      'annual_physical', 'sports_clearance', 'routine_checkup', 
      'follow_up', 'pre_admission', 'special_assessment', 'vision_screening',
      'hearing_screening', 'dental_checkup', 'vaccination_review'
    ]).notNullable();
    
    // Medical professional details
    table.string('examining_doctor_name');
    table.string('examining_doctor_license');
    table.string('medical_facility');
    table.string('facility_contact');
    
    // Physical measurements
    table.decimal('height_cm', 5, 2);
    table.decimal('weight_kg', 5, 2);
    table.decimal('bmi', 4, 2);
    table.enum('bmi_status', ['underweight', 'normal', 'overweight', 'obese']);
    table.string('blood_pressure'); // systolic/diastolic
    table.integer('heart_rate_bpm');
    table.decimal('temperature_celsius', 4, 1);
    
    // Vision assessment
    table.string('vision_left_eye'); // 20/20, 6/6, etc.
    table.string('vision_right_eye');
    table.boolean('vision_correction_needed').defaultTo(false);
    table.text('vision_notes');
    
    // Hearing assessment
    table.enum('hearing_left_ear', ['normal', 'mild_loss', 'moderate_loss', 'severe_loss', 'deaf']).defaultTo('normal');
    table.enum('hearing_right_ear', ['normal', 'mild_loss', 'moderate_loss', 'severe_loss', 'deaf']).defaultTo('normal');
    table.boolean('hearing_aid_recommended').defaultTo(false);
    table.text('hearing_notes');
    
    // Dental assessment
    table.integer('number_of_teeth');
    table.integer('cavities_count').defaultTo(0);
    table.boolean('orthodontic_treatment_needed').defaultTo(false);
    table.enum('dental_hygiene', ['excellent', 'good', 'fair', 'poor']).defaultTo('good');
    table.text('dental_recommendations');
    
    // General physical assessment
    table.enum('general_appearance', ['excellent', 'good', 'fair', 'poor', 'concerning']).defaultTo('good');
    table.enum('nutritional_status', ['excellent', 'good', 'adequate', 'poor', 'malnourished']).defaultTo('adequate');
    table.boolean('developmental_milestones_met').defaultTo(true);
    table.text('developmental_concerns');
    
    // System-wise examination
    table.json('cardiovascular_system'); // Heart, circulation findings
    table.json('respiratory_system'); // Lungs, breathing findings
    table.json('musculoskeletal_system'); // Bones, joints, muscles
    table.json('neurological_system'); // Nervous system findings
    table.json('skin_examination'); // Skin conditions, rashes
    
    // Vaccinations updated
    table.json('vaccinations_administered'); // Array of vaccines given
    table.boolean('vaccination_schedule_complete').defaultTo(true);
    table.json('pending_vaccinations'); // Array of pending vaccines
    
    // Medical conditions and recommendations
    table.json('diagnosed_conditions'); // New or existing conditions
    table.json('medications_prescribed'); // Prescribed medications
    table.text('treatment_recommendations');
    table.text('lifestyle_recommendations');
    table.json('referrals_made'); // Specialist referrals
    
    // Sports and activities clearance
    table.boolean('cleared_for_physical_activities').defaultTo(true);
    table.json('activity_restrictions'); // Array of restricted activities
    table.text('sports_participation_notes');
    table.boolean('requires_modified_pe').defaultTo(false);
    
    // Follow-up requirements
    table.boolean('follow_up_required').defaultTo(false);
    table.date('next_examination_due');
    table.text('follow_up_instructions');
    table.json('parent_instructions'); // Instructions for parents
    
    // Documentation
    table.json('examination_documents'); // Array of document URLs
    table.boolean('report_sent_to_parents').defaultTo(false);
    table.datetime('report_sent_at');
    table.text('additional_notes');
    
    // Overall assessment
    table.enum('overall_health_status', [
      'excellent', 'good', 'satisfactory', 'needs_attention', 'concerning'
    ]).defaultTo('good');
    
    table.decimal('health_score', 5, 2); // Overall health score out of 100
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'examination_reference']);
    table.index(['school_id', 'student_id', 'examination_date']);
    table.index(['examination_type', 'academic_year_id']);
    table.index(['overall_health_status', 'school_id']);
    table.index(['cleared_for_physical_activities', 'school_id']);
    table.index(['follow_up_required', 'next_examination_due']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('medical_examinations');
};