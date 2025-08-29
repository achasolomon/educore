// backend/src/modules/assessments/routes/assessmentRoutes.js
const express = require('express');
const router = express.Router();
const AssessmentController = require('../controllers/assessmentController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

router.get('/', requirePermission('grades:read'), AssessmentController.getAssessments);
router.post('/', requirePermission('grades:create'), AssessmentController.createAssessment);
router.get('/:id', requirePermission('grades:read'), AssessmentController.getAssessmentDetails);
router.post('/:id/grades', requirePermission('grades:create'), AssessmentController.submitGrades);

module.exports = router;