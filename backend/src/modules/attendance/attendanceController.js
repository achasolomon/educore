// backend/src/modules/attendance/controllers/attendanceController.js
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceAnalyticsService = require('../services/attendanceAnalyticsService');
const AttendanceRulesService = require('../services/attendanceRulesService');
const NotificationService = require('../../communication/services/notificationService');
const QRCodeService = require('../services/qrCodeService');
const db = require('../../../core/database/connection');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class AttendanceController {
  // Start attendance session for a class
  static async startAttendanceSession(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const schoolId = req.user.schoolId;
      const teacherId = req.user.userId;
      const { classId, sessionDate, sessionType = 'full_day', notes } = req.body;

      // Check if session already exists
      const existingSession = await AttendanceSession.getActiveSession(classId, sessionDate, schoolId);
      if (existingSession) {
        return res.status(409).json({
          success: false,
          message: 'Attendance session already active for this class and date',
          data: { session: existingSession }
        });
      }

      // Verify teacher has permission for this class
      const classPermission = await db('class_teachers')
        .where({ class_id: classId, teacher_id: teacherId, status: 'active' })
        .first();

      if (!classPermission && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage attendance for this class'
        });
      }

      const session = await AttendanceSession.startSession(
        classId,
        teacherId,
        sessionDate,
        sessionType,
        schoolId,
        notes
      );

      // Generate QR code for this session
      const qrCodeData = await QRCodeService.generateSessionQR(session.id, schoolId);

      // Log activity
      logger.info(`Attendance session started`, {
        sessionId: session.id,
        classId,
        teacherId,
        sessionDate,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Attendance session started successfully',
        data: { 
          session,
          qrCode: qrCodeData
        }
      });

    } catch (error) {
      logger.error('Start attendance session error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error starting attendance session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mark attendance for students
  static async markAttendance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const schoolId = req.user.schoolId;
      const markedBy = req.user.userId;
      const { attendanceRecords, sessionId } = req.body;

      if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({
          success: false,
          message: 'Attendance records array is required'
        });
      }

      // Start database transaction
      const trx = await db.transaction();

      try {
        const results = [];
        const notificationPromises = [];

        for (const record of attendanceRecords) {
          const attendanceResult = await AttendanceRecord.markAttendance(
            record.student_id,
            record.class_id,
            record.attendance_date,
            record.status,
            markedBy,
            schoolId,
            {
              method: record.method || 'manual',
              checkInTime: record.check_in_time,
              checkOutTime: record.check_out_time,
              remarks: record.remarks,
              sessionId
            },
            trx
          );

          results.push(attendanceResult);

          // Check attendance rules and trigger notifications
          const student = await trx('students')
            .select(['id', 'first_name', 'last_name', 'class_id'])
            .where('id', record.student_id)
            .first();

          if (student) {
            // Process attendance rules
            const ruleAlerts = await AttendanceRulesService.processAttendanceRules(
              attendanceResult,
              student,
              schoolId,
              trx
            );

            // Queue notifications for parents
            if (record.status === 'absent' || record.status === 'late') {
              notificationPromises.push(
                NotificationService.queueParentNotification(
                  record.student_id,
                  'attendance_alert',
                  {
                    student_name: `${student.first_name} ${student.last_name}`,
                    attendance_date: record.attendance_date,
                    status: record.status,
                    remarks: record.remarks,
                    check_in_time: record.check_in_time
                  },
                  schoolId
                )
              );
            }
          }
        }

        // Update session statistics if sessionId provided
        if (sessionId) {
          await AttendanceSession.updateSessionStats(sessionId, schoolId, trx);
        }

        await trx.commit();

        // Process notifications asynchronously
        Promise.all(notificationPromises).catch(error => {
          logger.error('Attendance notification error:', error);
        });

        // Update real-time analytics
        AttendanceAnalyticsService.updateRealTimeStats(schoolId, attendanceRecords[0]?.class_id);

        logger.info(`Attendance marked for ${results.length} students`, {
          schoolId,
          markedBy,
          sessionId
        });

        res.status(201).json({
          success: true,
          message: `Successfully marked attendance for ${results.length} students`,
          data: { 
            records: results,
            session_id: sessionId
          }
        });

      } catch (error) {
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      logger.error('Mark attendance error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error marking attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // QR Code attendance marking
  static async markAttendanceByQR(req, res) {
    try {
      const { qrData, studentId } = req.body;
      const schoolId = req.user.schoolId;

      // Verify QR code
      const sessionData = await QRCodeService.verifyQRCode(qrData, schoolId);
      if (!sessionData) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired QR code'
        });
      }

      // Get session details
      const session = await AttendanceSession.getById(sessionData.sessionId, schoolId);
      if (!session || session.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Attendance session not active'
        });
      }

      // Mark attendance
      const attendanceResult = await AttendanceRecord.markAttendance(
        studentId,
        session.class_id,
        session.session_date,
        'present',
        session.teacher_id,
        schoolId,
        {
          method: 'qr_code',
          checkInTime: new Date().toTimeString().slice(0, 8),
          sessionId: session.id
        }
      );

      res.json({
        success: true,
        message: 'Attendance marked successfully via QR code',
        data: { attendance: attendanceResult }
      });

    } catch (error) {
      logger.error('QR attendance error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error marking attendance via QR code' 
      });
    }
  }

  // Get class attendance for a specific date
  static async getClassAttendance(req, res) {
    try {
      const { classId } = req.params;
      const { date, include_summary = true } = req.query;
      const schoolId = req.user.schoolId;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const attendance = await AttendanceRecord.getClassAttendance(classId, date, schoolId);
      
      // Get all students in class to show who hasn't been marked
      const allStudents = await db('students')
        .select([
          'id', 
          'student_id', 
          'first_name', 
          'last_name', 
          'photo_url',
          'parent_phone',
          'parent_email'
        ])
        .where({ class_id: classId, status: 'active' })
        .orderBy(['first_name', 'last_name']);

      // Merge attendance with student list
      const attendanceMap = new Map(attendance.map(a => [a.student_id, a]));
      const completeList = allStudents.map(student => {
        const attendanceRecord = attendanceMap.get(student.id);
        return {
          student: {
            id: student.id,
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            full_name: `${student.first_name} ${student.last_name}`,
            photo_url: student.photo_url,
            parent_contact: {
              phone: student.parent_phone,
              email: student.parent_email
            }
          },
          attendance: attendanceRecord || null
        };
      });

      let response = {
        success: true,
        data: { 
          attendance: completeList,
          total_students: allStudents.length,
          marked_count: attendance.length,
          unmarked_count: allStudents.length - attendance.length
        }
      };

      // Include summary statistics if requested
      if (include_summary === 'true') {
        const summary = await AttendanceRecord.getDailyAttendanceStats(date, schoolId, classId);
        response.data.summary = summary;
      }

      res.json(response);

    } catch (error) {
      logger.error('Get class attendance error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching class attendance' 
      });
    }
  }

  // Get student attendance history
  static async getStudentAttendance(req, res) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, termId, page = 1, limit = 50 } = req.query;
      const schoolId = req.user.schoolId;

      let attendance;
      let summary = null;

      if (termId) {
        // Get term-based attendance and summary
        const term = await db('terms').where('id', termId).first();
        if (!term) {
          return res.status(404).json({
            success: false,
            message: 'Term not found'
          });
        }

        attendance = await AttendanceRecord.getStudentAttendance(
          studentId,
          term.start_date,
          term.end_date,
          schoolId,
          { page: parseInt(page), limit: parseInt(limit) }
        );

        summary = await AttendanceRecord.getAttendanceSummary(studentId, termId, schoolId);
      } else {
        attendance = await AttendanceRecord.getStudentAttendance(
          studentId,
          startDate,
          endDate,
          schoolId,
          { page: parseInt(page), limit: parseInt(limit) }
        );
      }

      res.json({
        success: true,
        data: {
          attendance: attendance.data,
          pagination: attendance.pagination,
          summary: summary
        }
      });

    } catch (error) {
      logger.error('Get student attendance error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching student attendance' 
      });
    }
  }

  // Complete attendance session
  static async completeAttendanceSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { notes } = req.body;
      const schoolId = req.user.schoolId;

      const session = await AttendanceSession.completeSession(sessionId, schoolId, notes);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or already completed'
        });
      }

      logger.info(`Attendance session completed`, {
        sessionId,
        schoolId
      });

      res.json({
        success: true,
        message: 'Attendance session completed successfully',
        data: { session }
      });

    } catch (error) {
      logger.error('Complete attendance session error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error completing attendance session' 
      });
    }
  }

  // Get attendance analytics for class
  static async getClassAnalytics(req, res) {
    try {
      const { classId } = req.params;
      const { termId, startDate, endDate } = req.query;
      const schoolId = req.user.schoolId;

      if (!termId && (!startDate || !endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Either termId or both startDate and endDate are required'
        });
      }

      let analytics;
      if (termId) {
        analytics = await AttendanceAnalyticsService.generateClassAnalytics(classId, termId, schoolId);
      } else {
        analytics = await AttendanceAnalyticsService.generateClassAnalytics(
          classId, 
          null, 
          schoolId, 
          { startDate, endDate }
        );
      }

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Get class analytics error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching class analytics' 
      });
    }
  }

  // Get school-wide attendance dashboard
  static async getSchoolDashboard(req, res) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const schoolId = req.user.schoolId;

      // Get today's overall stats
      const todayStats = await AttendanceRecord.getDailyAttendanceStats(date, schoolId);

      // Get class-wise breakdown
      const classStats = await db('attendance_records')
        .select([
          'classes.id as class_id',
          'classes.name as class_name',
          'classes.level',
          db.raw('COUNT(*) as total_marked'),
          db.raw('COUNT(CASE WHEN status = \'present\' THEN 1 END) as present'),
          db.raw('COUNT(CASE WHEN status = \'absent\' THEN 1 END) as absent'),
          db.raw('COUNT(CASE WHEN status = \'late\' THEN 1 END) as late')
        ])
        .join('classes', 'attendance_records.class_id', 'classes.id')
        .where('attendance_records.attendance_date', date)
        .where('attendance_records.school_id', schoolId)
        .groupBy('classes.id', 'classes.name', 'classes.level')
        .orderBy('classes.level');

      // Get attendance trends for the last 7 days
      const trends = await AttendanceAnalyticsService.getAttendanceTrends(schoolId, 7);

      // Get alerts and notifications
      const alerts = await db('attendance_alerts')
        .select(['*'])
        .where('school_id', schoolId)
        .where('status', 'active')
        .orderBy('severity', 'desc')
        .orderBy('created_at', 'desc')
        .limit(10);

      res.json({
        success: true,
        data: {
          today_stats: todayStats,
          class_breakdown: classStats,
          trends: trends,
          recent_alerts: alerts,
          generated_at: new Date()
        }
      });

    } catch (error) {
      logger.error('Get school dashboard error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching school attendance dashboard' 
      });
    }
  }

  // Generate attendance report
  static async generateReport(req, res) {
    try {
      const { 
        type, 
        classId, 
        studentId, 
        startDate, 
        endDate, 
        termId,
        format = 'json'
      } = req.query;

      const schoolId = req.user.schoolId;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Report type is required'
        });
      }

      let reportData;

      switch (type) {
        case 'student_summary':
          if (!studentId || !termId) {
            return res.status(400).json({
              success: false,
              message: 'Student ID and Term ID are required for student summary'
            });
          }
          reportData = await AttendanceAnalyticsService.generateStudentReport(studentId, termId, schoolId);
          break;

        case 'class_summary':
          if (!classId) {
            return res.status(400).json({
              success: false,
              message: 'Class ID is required for class summary'
            });
          }
          reportData = await AttendanceAnalyticsService.generateClassReport(
            classId, 
            termId || { startDate, endDate }, 
            schoolId
          );
          break;

        case 'defaulters':
          reportData = await AttendanceAnalyticsService.generateDefaultersReport(
            schoolId, 
            termId || { startDate, endDate },
            classId
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }

      if (format === 'pdf') {
        // Generate PDF report
        const pdfBuffer = await AttendanceAnalyticsService.generatePDFReport(reportData, type);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${type}-${Date.now()}.pdf`);
        res.send(pdfBuffer);
      } else {
        res.json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      logger.error('Generate report error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error generating attendance report' 
      });
    }
  }

  // Bulk attendance operations
  static async bulkOperations(req, res) {
    try {
      const { operation, data } = req.body;
      const schoolId = req.user.schoolId;
      const userId = req.user.userId;

      if (!operation || !data) {
        return res.status(400).json({
          success: false,
          message: 'Operation and data are required'
        });
      }

      let result;

      switch (operation) {
        case 'mark_all_present':
          result = await AttendanceRecord.markAllPresent(
            data.classId,
            data.date,
            userId,
            schoolId
          );
          break;

        case 'mark_all_absent':
          result = await AttendanceRecord.markAllAbsent(
            data.classId,
            data.date,
            userId,
            schoolId
          );
          break;

        case 'copy_previous_day':
          result = await AttendanceRecord.copyPreviousDayAttendance(
            data.classId,
            data.fromDate,
            data.toDate,
            userId,
            schoolId
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid bulk operation'
          });
      }

      res.json({
        success: true,
        message: `Bulk operation '${operation}' completed successfully`,
        data: result
      });

    } catch (error) {
      logger.error('Bulk operations error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error performing bulk operation' 
      });
    }
  }
}

module.exports = AttendanceController;