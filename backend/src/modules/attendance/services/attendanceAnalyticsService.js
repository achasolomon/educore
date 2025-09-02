// backend/src/modules/attendance/services/attendanceAnalyticsService.js
const db = require('../../../core/database/connection');
const AttendanceRecord = require('../models/AttendanceRecord');
const cache = require('../../../core/utils/cache');
const logger = require('../../../core/utils/logger');
const crypto = require('crypto');

class AttendanceAnalyticsService {
  static CACHE_PREFIX = 'attendance_analytics:';
  static CACHE_TTL = 300; // 5 minutes for most analytics

  /**
   * Calculate comprehensive student analytics
   */
  static async calculateStudentAnalytics(studentId, termId, schoolId) {
    const cacheKey = `${this.CACHE_PREFIX}student:${studentId}:${termId}:${schoolId}`;
    
    try {
      // Check cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const summary = await AttendanceRecord.getAttendanceSummary(studentId, termId, schoolId);
      if (!summary) return null;

      // Get attendance records for trend analysis
      const term = await db('terms').where('id', termId).first();
      const records = await AttendanceRecord.getStudentAttendance(
        studentId,
        term.start_date,
        term.end_date,
        schoolId
      );

      // Calculate consecutive absences
      let consecutiveAbsences = 0;
      let maxConsecutiveAbsences = 0;
      let tempConsecutive = 0;

      records.reverse().forEach(record => {
        if (record.status === 'absent') {
          tempConsecutive++;
          maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, tempConsecutive);
        } else {
          tempConsecutive = 0;
        }
      });

      // Check for current consecutive absences (from most recent)
      for (const record of records.slice(0, 10)) {
        if (record.status === 'absent') {
          consecutiveAbsences++;
        } else {
          break;
        }
      }

      // Determine attendance trend (compare last 2 weeks vs previous 2 weeks)
      const lastTwoWeeks = records.slice(0, 10);
      const previousTwoWeeks = records.slice(10, 20);

      const recentAttendance = lastTwoWeeks.filter(r => r.status === 'present').length / Math.max(lastTwoWeeks.length, 1);
      const previousAttendance = previousTwoWeeks.filter(r => r.status === 'present').length / Math.max(previousTwoWeeks.length, 1);

      let trend = 'stable';
      if (recentAttendance > previousAttendance + 0.1) trend = 'improving';
      else if (recentAttendance < previousAttendance - 0.1) trend = 'declining';

      // Monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyBreakdown(records);

      const analytics = {
        student_id: studentId,
        term_id: termId,
        school_id: schoolId,
        ...summary,
        consecutive_absences: consecutiveAbsences,
        max_consecutive_absences: maxConsecutiveAbsences,
        attendance_trend: trend,
        monthly_breakdown: JSON.stringify(monthlyBreakdown),
        last_attendance_date: records.length > 0 ? records[0].attendance_date : null
      };

      // Upsert analytics record
      const existing = await db('attendance_analytics')
        .where({ student_id: studentId, term_id: termId })
        .first();

      if (existing) {
        await db('attendance_analytics')
          .where({ id: existing.id })
          .update({ ...analytics, updated_at: new Date() });
      } else {
        await db('attendance_analytics')
          .insert({ ...analytics, id: crypto.randomUUID() });
      }

      // Cache for 5 minutes
      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));

      return analytics;

    } catch (error) {
      logger.error('Calculate student analytics error:', error);
      throw error;
    }
  }

  static calculateMonthlyBreakdown(records) {
    const breakdown = {};

    records.forEach(record => {
      const month = new Date(record.attendance_date).toISOString().slice(0, 7); // YYYY-MM
      
      if (!breakdown[month]) {
        breakdown[month] = { present: 0, absent: 0, late: 0, total: 0 };
      }

      breakdown[month][record.status] = (breakdown[month][record.status] || 0) + 1;
      breakdown[month].total++;
    });

    return breakdown;
  }

  static async generateClassAnalytics(classId, termId, schoolId, dateRange = null) {
    const cacheKey = `${this.CACHE_PREFIX}class:${classId}:${termId || 'custom'}:${schoolId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get all students in class
      const students = await db('students')
        .where({ class_id: classId, status: 'active' });

      const analytics = [];
      for (const student of students) {
        let studentAnalytics;
        if (termId) {
          studentAnalytics = await this.calculateStudentAnalytics(student.id, termId, schoolId);
        } else {
          // Custom date range analytics
          studentAnalytics = await this.calculateCustomRangeAnalytics(
            student.id, 
            dateRange.startDate, 
            dateRange.endDate, 
            schoolId
          );
        }
        
        if (studentAnalytics) {
          analytics.push({
            ...studentAnalytics,
            student_name: `${student.first_name} ${student.last_name}`,
            student_number: student.student_id
          });
        }
      }

      // Calculate class averages
      const classStats = {
        total_students: analytics.length,
        average_attendance: analytics.reduce((sum, a) => sum + parseFloat(a.attendance_percentage), 0) / analytics.length,
        perfect_attendance: analytics.filter(a => parseFloat(a.attendance_percentage) === 100).length,
        low_attendance: analytics.filter(a => parseFloat(a.attendance_percentage) < 75).length,
        chronic_absentees: analytics.filter(a => a.consecutive_absences >= 3).length,
        improving_trend: analytics.filter(a => a.attendance_trend === 'improving').length,
        declining_trend: analytics.filter(a => a.attendance_trend === 'declining').length
      };

      const result = {
        class_statistics: classStats,
        student_analytics: analytics.sort((a, b) => parseFloat(b.attendance_percentage) - parseFloat(a.attendance_percentage))
      };

      // Cache for 5 minutes
      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      return result;

    } catch (error) {
      logger.error('Generate class analytics error:', error);
      throw error;
    }
  }

  static async generateSchoolAnalytics(schoolId, termId) {
    const cacheKey = `${this.CACHE_PREFIX}school:${schoolId}:${termId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const analytics = await db('attendance_analytics')
        .select([
          db.raw('AVG(attendance_percentage) as school_average'),
          db.raw('COUNT(CASE WHEN attendance_percentage = 100 THEN 1 END) as perfect_attendance_count'),
          db.raw('COUNT(CASE WHEN attendance_percentage < 75 THEN 1 END) as low_attendance_count'),
          db.raw('COUNT(CASE WHEN consecutive_absences >= 3 THEN 1 END) as chronic_absentees'),
          db.raw('COUNT(*) as total_students')
        ])
        .where({ school_id: schoolId, term_id: termId })
        .first();

      const result = {
        ...analytics,
        school_average: parseFloat(analytics.school_average || 0).toFixed(2)
      };

      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      
      return result;

    } catch (error) {
      logger.error('Generate school analytics error:', error);
      throw error;
    }
  }

  /**
   * Get attendance trends over time
   */
  static async getAttendanceTrends(schoolId, days = 30, classId = null) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      let query = db('attendance_records')
        .select([
          'attendance_date',
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN status = \'present\' THEN 1 END) as present'),
          db.raw('COUNT(CASE WHEN status = \'absent\' THEN 1 END) as absent'),
          db.raw('COUNT(CASE WHEN status = \'late\' THEN 1 END) as late')
        ])
        .where('school_id', schoolId)
        .whereBetween('attendance_date', [
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0]
        ]);

      if (classId) {
        query = query.where('class_id', classId);
      }

      const trends = await query
        .groupBy('attendance_date')
        .orderBy('attendance_date', 'asc');

      // Calculate daily attendance percentages
      const trendData = trends.map(day => ({
        date: day.attendance_date,
        total_students: parseInt(day.total),
        present_count: parseInt(day.present),
        absent_count: parseInt(day.absent),
        late_count: parseInt(day.late),
        attendance_percentage: day.total > 0 ? ((day.present / day.total) * 100).toFixed(2) : 0
      }));

      return {
        period_days: days,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        class_id: classId,
        trends: trendData
      };

    } catch (error) {
      logger.error('Get attendance trends error:', error);
      throw error;
    }
  }

  /**
   * Update real-time statistics
   */
  static async updateRealTimeStats(schoolId, classId = null) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsKey = `${this.CACHE_PREFIX}realtime:${schoolId}:${classId || 'all'}:${today}`;

      // Calculate fresh stats
      const stats = await AttendanceRecord.getDailyAttendanceStats(today, schoolId, classId);
      
      // Cache for 1 minute (real-time updates)
      await cache.setex(statsKey, 60, JSON.stringify({
        ...stats,
        last_updated: new Date(),
        class_id: classId
      }));

      return stats;

    } catch (error) {
      logger.error('Update real-time stats error:', error);
      return null;
    }
  }

  /**
   * Generate defaulters report
   */
  static async generateDefaultersReport(schoolId, termIdOrDateRange, classId = null, threshold = 75) {
    try {
      let query = db('attendance_analytics')
        .select([
          'attendance_analytics.*',
          'students.first_name',
          'students.last_name',
          'students.student_id',
          'classes.name as class_name',
          'classes.level as class_level'
        ])
        .join('students', 'attendance_analytics.student_id', 'students.id')
        .join('classes', 'students.class_id', 'classes.id')
        .where('attendance_analytics.school_id', schoolId)
        .where('attendance_analytics.attendance_percentage', '<', threshold);

      if (typeof termIdOrDateRange === 'string') {
        // Term-based query
        query = query.where('attendance_analytics.term_id', termIdOrDateRange);
      }

      if (classId) {
        query = query.where('students.class_id', classId);
      }

      const defaulters = await query
        .orderBy('attendance_analytics.attendance_percentage', 'asc');

      // Group by severity
      const categorized = {
        critical: defaulters.filter(d => d.attendance_percentage < 50), // Below 50%
        warning: defaulters.filter(d => d.attendance_percentage >= 50 && d.attendance_percentage < 65), // 50-65%
        moderate: defaulters.filter(d => d.attendance_percentage >= 65 && d.attendance_percentage < threshold) // 65-75%
      };

      return {
        threshold,
        total_defaulters: defaulters.length,
        categorized,
        summary: {
          critical_count: categorized.critical.length,
          warning_count: categorized.warning.length,
          moderate_count: categorized.moderate.length
        },
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Generate defaulters report error:', error);
      throw error;
    }
  }

  /**
   * Generate student performance report
   */
  static async generateStudentReport(studentId, termId, schoolId) {
    try {
      const analytics = await this.calculateStudentAnalytics(studentId, termId, schoolId);
      if (!analytics) return null;

      // Get student details
      const student = await db('students')
        .select([
          'students.*',
          'classes.name as class_name',
          'classes.level as class_level'
        ])
        .join('classes', 'students.class_id', 'classes.id')
        .where('students.id', studentId)
        .first();

      // Get recent attendance records
      const recentRecords = await AttendanceRecord.getStudentAttendance(
        studentId,
        null,
        null,
        schoolId,
        { page: 1, limit: 30 }
      );

      // Get class comparison
      const classAnalytics = await this.generateClassAnalytics(
        student.class_id,
        termId,
        schoolId
      );

      const classAverage = classAnalytics.class_statistics.average_attendance;
      const classRank = classAnalytics.student_analytics
        .findIndex(s => s.student_id === studentId) + 1;

      return {
        student: {
          ...student,
          full_name: `${student.first_name} ${student.last_name}`
        },
        analytics,
        recent_records: recentRecords.data || recentRecords,
        class_comparison: {
          class_average: classAverage.toFixed(2),
          student_rank: classRank,
          total_students: classAnalytics.class_statistics.total_students,
          percentile: ((classAnalytics.class_statistics.total_students - classRank + 1) / classAnalytics.class_statistics.total_students * 100).toFixed(1)
        },
        recommendations: this.generateRecommendations(analytics, classAverage)
      };

    } catch (error) {
      logger.error('Generate student report error:', error);
      throw error;
    }
  }

  /**
   * Generate attendance recommendations
   */
  static generateRecommendations(analytics, classAverage) {
    const recommendations = [];
    const attendanceRate = parseFloat(analytics.attendance_percentage);

    if (attendanceRate < 70) {
      recommendations.push({
        type: 'critical',
        title: 'Immediate Intervention Required',
        message: 'Student attendance is critically low. Consider parent meeting and support plan.'
      });
    } else if (attendanceRate < 85) {
      recommendations.push({
        type: 'warning',
        title: 'Attendance Improvement Needed',
        message: 'Monitor closely and implement attendance improvement strategies.'
      });
    }

    if (analytics.consecutive_absences >= 3) {
      recommendations.push({
        type: 'urgent',
        title: 'Consecutive Absences Alert',
        message: `Student has been absent for ${analytics.consecutive_absences} consecutive days. Immediate follow-up required.`
      });
    }

    if (analytics.attendance_trend === 'declining') {
      recommendations.push({
        type: 'monitoring',
        title: 'Declining Trend Detected',
        message: 'Student attendance is showing a declining pattern. Early intervention recommended.'
      });
    }

    if (attendanceRate > classAverage + 10) {
      recommendations.push({
        type: 'positive',
        title: 'Above Average Performance',
        message: 'Student is performing well above class average. Consider recognition.'
      });
    }

    return recommendations;
  }

  /**
   * Calculate custom date range analytics
   */
  static async calculateCustomRangeAnalytics(studentId, startDate, endDate, schoolId) {
    try {
      const records = await AttendanceRecord.getStudentAttendance(
        studentId,
        startDate,
        endDate,
        schoolId
      );

      if (!records.length) return null;

      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const excused = records.filter(r => r.status === 'excused').length;

      const totalDays = records.length;
      const attendancePercentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : 0;
      const punctualityPercentage = totalDays > 0 ? (((present - late) / totalDays) * 100).toFixed(2) : 0;

      return {
        student_id: studentId,
        school_id: schoolId,
        start_date: startDate,
        end_date: endDate,
        total_school_days: totalDays,
        days_present: present,
        days_absent: absent,
        days_late: late,
        days_excused: excused,
        attendance_percentage: attendancePercentage,
        punctuality_percentage: punctualityPercentage,
        period_type: 'custom_range'
      };

    } catch (error) {
      logger.error('Calculate custom range analytics error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF report (placeholder for future PDF service)
   */
  static async generatePDFReport(reportData, reportType) {
    try {
      // This would integrate with a PDF service like Puppeteer
      // For now, return a mock response
      return {
        success: true,
        message: 'PDF generation would be implemented here',
        data: reportData,
        type: reportType
      };
    } catch (error) {
      logger.error('Generate PDF report error:', error);
      throw error;
    }
  }
}

module.exports = AttendanceAnalyticsService;