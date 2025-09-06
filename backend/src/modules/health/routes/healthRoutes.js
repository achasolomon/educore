const express = require('express');
const HealthController = require('../controllers/healthController');
const healthValidationRules = require('../validators/healthValidators');
const authMiddleware =require('../../../core/middleware/authMiddleware');
const rbac = require('../../../core/middleware/rbac');
const { handleValidationErrors } = require('../../../core/middleware/validationMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Health profile routes
router.post(
  '/schools/:schoolId/health-profiles',
  rbac.requireRole(['health_staff', 'school_admin', 'teacher']),
  healthValidationRules.createStudentHealthProfile,
  handleValidationErrors,
  HealthController.createStudentHealthProfile
);

router.get(
  '/schools/:schoolId/health-profiles/:studentId',
  rbac.requireRole(['health_staff', 'school_admin', 'teacher', 'parent']),
  healthValidationRules.getStudentHealthProfile,
  handleValidationErrors,
  HealthController.getStudentHealthProfile
);

router.put(
  '/schools/:schoolId/health-profiles/:studentId',
  rbac.requireRole(['health_staff', 'school_admin']),
  healthValidationRules.updateStudentHealthProfile,
  handleValidationErrors,
  HealthController.updateStudentHealthProfile
);

// Health incident routes
router.post(
  '/schools/:schoolId/health-incidents',
  rbac.requireRole(['health_staff', 'school_admin', 'teacher']),
  healthValidationRules.recordHealthIncident,
  handleValidationErrors,
  HealthController.recordHealthIncident
);

router.get(
  '/schools/:schoolId/health-incidents',
  rbac.requireRole(['health_staff', 'school_admin', 'teacher']),
  healthValidationRules.getHealthIncidents,
  handleValidationErrors,
  HealthController.getHealthIncidents
);

// Health dashboard route
router.get(
  '/schools/:schoolId/health-dashboard',
  rbac.requireRole(['health_staff', 'school_admin']),
  healthValidationRules.getHealthDashboard,
  handleValidationErrors,
  HealthController.getHealthDashboard
);

// Health reports route
router.get(
  '/schools/:schoolId/health-reports/:reportType',
  rbac.requireRole(['health_staff', 'school_admin']),
  healthValidationRules.generateHealthReport,
  handleValidationErrors,
  HealthController.generateHealthReport
);

// Health screening route
router.post(
  '/schools/:schoolId/health-screenings',
  rbac.requireRole(['health_staff', 'school_admin']),
  healthValidationRules.scheduleHealthScreening,
  handleValidationErrors,
  HealthController.scheduleHealthScreening
);

module.exports = router;