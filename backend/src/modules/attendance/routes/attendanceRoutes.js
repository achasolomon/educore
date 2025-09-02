// backend/src/modules/attendance/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const auth = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');

// Apply auth middleware to all routes
router.use(auth.authenticate);

// Session management routes
router.post('/sessions', 
  rbac.hasPermission('attendance:create'), 
  AttendanceController.startAttendanceSession
);

router.put('/sessions/:sessionId/complete', 
  rbac.hasPermission('attendance:update'), 
  AttendanceController.completeAttendanceSession
);

// Attendance marking routes
router.post('/mark', 
  rbac.hasPermission('attendance:create'), 
  AttendanceController.markAttendance
);

router.post('/mark/qr', 
  rbac.hasPermission('attendance:create'), 
  AttendanceController.markAttendanceByQR
);

router.post('/bulk', 
  rbac.hasPermission('attendance:create'), 
  AttendanceController.bulkOperations
);

// Data retrieval routes
router.get('/class/:classId', 
  rbac.hasPermission('attendance:read'), 
  AttendanceController.getClassAttendance
);

router.get('/student/:studentId', 
  rbac.hasPermission('attendance:read'), 
  AttendanceController.getStudentAttendance
);

router.get('/dashboard', 
  rbac.hasRole(['admin', 'principal']), 
  AttendanceController.getSchoolDashboard
);

// Analytics routes
router.get('/analytics/class/:classId', 
  rbac.hasPermission('attendance:read'), 
  AttendanceController.getClassAnalytics
);

router.get('/analytics/student/:studentId', 
  rbac.hasPermission('attendance:read'), 
  AttendanceController.getStudentAnalytics
);

// Report generation
router.get('/reports', 
  rbac.hasRole(['admin', 'principal']), 
  AttendanceController.generateReport
);

module.exports = router;