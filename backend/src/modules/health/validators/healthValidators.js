const { body, param, query } = require('express-validator');


// Validation rules
const healthValidationRules = {
  createStudentHealthProfile: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    body('student_id').isUUID().withMessage('Invalid student ID'),
    body('blood_group').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('genotype').optional().isIn(['AA', 'AS', 'SS', 'AC']).withMessage('Invalid genotype'),
    body('height_cm').optional().isFloat({ min: 30, max: 250 }).withMessage('Height must be between 30-250 cm'),
    body('weight_kg').optional().isFloat({ min: 2, max: 200 }).withMessage('Weight must be between 2-200 kg'),
    body('known_allergies').optional().isArray().withMessage('Known allergies must be an array'),
    body('chronic_conditions').optional().isArray().withMessage('Chronic conditions must be an array'),
    body('current_medications').optional().isArray().withMessage('Current medications must be an array'),
    body('vaccination_records').optional().isArray().withMessage('Vaccination records must be an array'),
    body('requires_special_attention').optional().isBoolean().withMessage('Requires special attention must be boolean')
  ],

  getStudentHealthProfile: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    param('studentId').isUUID().withMessage('Invalid student ID')
  ],

  updateStudentHealthProfile: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    param('studentId').isUUID().withMessage('Invalid student ID'),
    body('blood_group').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('genotype').optional().isIn(['AA', 'AS', 'SS', 'AC']).withMessage('Invalid genotype'),
    body('height_cm').optional().isFloat({ min: 30, max: 250 }).withMessage('Height must be between 30-250 cm'),
    body('weight_kg').optional().isFloat({ min: 2, max: 200 }).withMessage('Weight must be between 2-200 kg')
  ],

  recordHealthIncident: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    body('student_id').isUUID().withMessage('Invalid student ID'),
    body('incident_type').isIn([
      'injury', 'illness', 'allergic_reaction', 'seizure', 
      'asthma_attack', 'diabetic_emergency', 'fainting', 
      'fracture', 'cut_wound', 'burn', 'head_injury', 'other'
    ]).withMessage('Invalid incident type'),
    body('severity_level').isIn(['mild', 'moderate', 'severe', 'critical', 'life_threatening']).withMessage('Invalid severity level'),
    body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('incident_datetime').optional().isISO8601().withMessage('Invalid date format'),
    body('location').optional().isLength({ min: 2 }).withMessage('Location must be at least 2 characters'),
    body('emergency_services_called').optional().isBoolean().withMessage('Emergency services called must be boolean'),
    body('requires_follow_up').optional().isBoolean().withMessage('Requires follow up must be boolean'),
    body('notify_parents').optional().isBoolean().withMessage('Notify parents must be boolean')
  ],

  getHealthIncidents: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    query('severity_level').optional().isIn(['mild', 'moderate', 'severe', 'critical', 'life_threatening']).withMessage('Invalid severity level'),
    query('incident_type').optional().isIn([
      'injury', 'illness', 'allergic_reaction', 'seizure', 
      'asthma_attack', 'diabetic_emergency', 'fainting', 
      'fracture', 'cut_wound', 'burn', 'head_injury', 'other'
    ]).withMessage('Invalid incident type'),
    query('date_from').optional().isISO8601().withMessage('Invalid date format'),
    query('date_to').optional().isISO8601().withMessage('Invalid date format'),
    query('requires_follow_up').optional().isBoolean().withMessage('Requires follow up must be boolean')
  ],

  getHealthDashboard: [
    param('schoolId').isUUID().withMessage('Invalid school ID')
  ],

  generateHealthReport: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    param('reportType').isIn([
      'student_health_summary', 
      'incident_analysis', 
      'vaccination_status', 
      'health_screening_results', 
      'medical_clearance_report'
    ]).withMessage('Invalid report type'),
    query('date_from').optional().isISO8601().withMessage('Invalid date format'),
    query('date_to').optional().isISO8601().withMessage('Invalid date format'),
    query('class_id').optional().isUUID().withMessage('Invalid class ID'),
    query('grade_level').optional().isLength({ min: 1 }).withMessage('Grade level is required')
  ],

  scheduleHealthScreening: [
    param('schoolId').isUUID().withMessage('Invalid school ID'),
    body('screening_type').isIn([
      'vision', 'hearing', 'dental', 'height_weight', 
      'bmi', 'blood_pressure', 'general_health', 'sports_physical'
    ]).withMessage('Invalid screening type'),
    body('screening_date').isISO8601().withMessage('Invalid date format'),
    body('students').isArray({ min: 1 }).withMessage('Students array must contain at least one student'),
    body('students.*').isUUID().withMessage('Invalid student ID'),
    body('program_name').optional().isLength({ min: 2 }).withMessage('Program name must be at least 2 characters')
  ]
};

module.exports =  healthValidationRules;