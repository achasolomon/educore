// backend/src/core/database/migrations/066_create_student_health_profiles_table.js
exports.up = function(knex) {
  return knex.schema.createTable('student_health_profiles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Basic health information
    table.string('blood_group');
    table.string('genotype');
    table.decimal('height_cm', 5, 2); // in centimeters
    table.decimal('weight_kg', 5, 2); // in kilograms
    table.decimal('bmi', 4, 2);
    table.enum('bmi_category', ['underweight', 'normal', 'overweight', 'obese']).defaultTo('normal');
    
    // Medical conditions
    table.json('known_allergies'); // Array of allergy objects
    table.json('chronic_conditions'); // Array of chronic condition objects
    table.json('current_medications'); // Array of medication objects
    table.json('previous_surgeries'); // Array of surgery records
    table.json('family_medical_history'); // Family medical background
    
    // Emergency medical information
    table.text('emergency_medical_notes');
    table.boolean('requires_special_attention').defaultTo(false);
    table.text('special_attention_notes');
    table.json('emergency_procedures'); // Array of emergency procedures
    
    // Vaccination records
    table.json('vaccination_records'); // Comprehensive vaccination history
    table.date('last_vaccination_update');
    table.boolean('vaccination_up_to_date').defaultTo(true);
    
    // Physical fitness assessments
    table.decimal('vision_left_eye', 3, 2); // 6/6, 6/9, etc.
    table.decimal('vision_right_eye', 3, 2);
    table.boolean('wears_glasses').defaultTo(false);
    table.boolean('wears_contact_lenses').defaultTo(false);
    table.enum('hearing_status', ['normal', 'mild_loss', 'moderate_loss', 'severe_loss', 'deaf']).defaultTo('normal');
    
    // Dental health
    table.enum('dental_health_status', ['excellent', 'good', 'fair', 'poor', 'needs_attention']).defaultTo('good');
    table.date('last_dental_checkup');
    table.boolean('has_dental_issues').defaultTo(false);
    table.text('dental_notes');
    
    // Mental health indicators
    table.enum('general_mood', ['very_positive', 'positive', 'neutral', 'concerning', 'needs_attention']).defaultTo('positive');
    table.boolean('requires_counseling_support').defaultTo(false);
    table.text('behavioral_observations');
    table.json('counseling_sessions'); // Array of counseling session records
    
    // Physical activity and sports
    table.boolean('medically_cleared_for_sports').defaultTo(true);
    table.json('sports_restrictions'); // Array of activity restrictions
    table.enum('physical_activity_level', ['sedentary', 'low', 'moderate', 'high', 'very_high']).defaultTo('moderate');
    
    // Health screening dates
    table.date('last_full_physical_exam');
    table.date('last_eye_exam');
    table.date('last_hearing_test');
    table.date('next_recommended_checkup');
    
    // Insurance and healthcare provider information
    table.string('health_insurance_provider');
    table.string('health_insurance_policy_number');
    table.string('primary_healthcare_provider');
    table.string('healthcare_provider_contact');
    table.string('preferred_hospital');
    
    // Parent/Guardian health preferences
    table.json('parent_health_preferences'); // Dietary, religious, cultural considerations
    table.boolean('parent_consent_for_medical_treatment').defaultTo(false);
    table.boolean('parent_consent_for_emergency_treatment').defaultTo(false);
    table.date('consent_form_date');
    
    // System tracking
    table.boolean('profile_complete').defaultTo(false);
    table.decimal('profile_completion_percentage', 5, 2).defaultTo(0);
    table.date('profile_last_reviewed');
    table.uuid('last_reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.json('metadata');
    table.timestamps(true, true);
    
    table.unique(['school_id', 'student_id']);
    table.index(['school_id', 'requires_special_attention']);
    table.index(['blood_group', 'school_id']);
    table.index(['vaccination_up_to_date', 'school_id']);
    table.index(['medically_cleared_for_sports', 'school_id']);
    table.index(['profile_complete', 'school_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_health_profiles');
};