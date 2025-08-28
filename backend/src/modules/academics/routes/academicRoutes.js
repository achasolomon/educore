// backend/src/modules/academics/routes/academicRoutes.js
const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/classController');
const SubjectController = require('../controllers/subjectController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

// Class routes
router.get('/classes', requirePermission('classes:read'), ClassController.getClasses);
router.get('/classes/:id', requirePermission('classes:read'), ClassController.getClass);
router.post('/classes', requirePermission('classes:create'), ClassController.createClass);
router.put('/classes/:id', requirePermission('classes:update'), ClassController.updateClass);

// Subject routes
router.get('/subjects', requirePermission('subjects:read'), SubjectController.getSubjects);
router.post('/subjects', requirePermission('subjects:create'), SubjectController.createSubject);
router.put('/subjects/:id', requirePermission('subjects:update'), SubjectController.updateSubject);

module.exports = router;