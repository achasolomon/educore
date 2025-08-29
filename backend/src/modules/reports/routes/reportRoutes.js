
// backend/src/modules/reports/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

// Report templates
router.get('/templates', requirePermission('reports:view'), ReportController.getReportTemplates);
router.post('/templates', requirePermission('reports:generate'), ReportController.createReportTemplate);

// Report generation
router.post('/generate/student', requirePermission('reports:generate'), ReportController.generateStudentReport);
router.post('/generate/class', requirePermission('reports:generate'), ReportController.generateClassReport);

// Report management
router.get('/my-reports', requirePermission('reports:view'), ReportController.getMyReports);
router.get('/:reportId/status', requirePermission('reports:view'), ReportController.getReportStatus);
router.get('/:reportId/download', requirePermission('reports:view'), ReportController.downloadReport);

module.exports = router;