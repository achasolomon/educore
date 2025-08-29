// backend/src/modules/analytics/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

router.get('/dashboard', requirePermission('reports:view'), AnalyticsController.getSchoolDashboard);
router.get('/class/:classId/term/:termId', requirePermission('reports:view'), AnalyticsController.getClassAnalytics);
router.get('/subject/:subjectId/term/:termId', requirePermission('reports:view'), AnalyticsController.getSubjectAnalytics);

module.exports = router;

