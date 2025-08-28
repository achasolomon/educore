// backend/src/modules/students/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

router.get('/', requirePermission('students:read'), StudentController.getStudents);
router.get('/stats', requirePermission('students:read'), StudentController.getStudentStats);
router.get('/:id', requirePermission('students:read'), StudentController.getStudent);
router.post('/', requirePermission('students:create'), StudentController.createStudent);
router.put('/:id', requirePermission('students:update'), StudentController.updateStudent);
router.delete('/:id', requirePermission('students:delete'), StudentController.deleteStudent);

module.exports = router;