// backend/src/modules/results/routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const ResultController = require('../controllers/resultController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

router.get('/student/:studentId/term/:termId', requirePermission('grades:read'), ResultController.getStudentResult);
router.post('/process-term/:termId', requirePermission('grades:update'), ResultController.processTermResults);
router.get('/class/:classId/term/:termId', requirePermission('grades:read'), ResultController.getClassResults);

module.exports = router;


