// backend/src/modules/transport/models/StudentTransport.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StudentTransport {
  static tableName = 'student_transport';

  static async enrollStudent(studentId, routeId, stopId, schoolId, academicYearId, transportFee = 0) {
    // Check if student is already enrolled for this academic year
    const existing = await db(this.tableName)
      .where({
        student_id: studentId,
        school_id: schoolId,
        academic_year_id: academicYearId,
        status: 'active'
      })
      .first();

    if (existing) {
      throw new Error('Student is already enrolled in transport for this academic year');
    }

    const [enrollment] = await db(this.tableName)
      .insert({
        id: crypto.randomUUID(),
        student_id: studentId,
        route_id: routeId,
        stop_id: stopId,
        school_id: schoolId,
        academic_year_id: academicYearId,
        transport_fee: transportFee,
        status: 'active',
        enrolled_date: new Date()
      })
      .returning('*');

    return enrollment;
  }

  static async getStudentsByRoute(routeId, schoolId, academicYearId) {
    return await db(this.tableName)
      .select([
        'student_transport.*',
        'students.first_name',
        'students.last_name',
        'students.student_id as student_number',
        'classes.name as class_name',
        'guardians.phone as guardian_phone'
      ])
      .join('students', 'student_transport.student_id', 'students.id')
      .join('classes', 'students.current_class_id', 'classes.id')
      .leftJoin('guardians', 'students.primary_guardian_id', 'guardians.id')
      .where({
        'student_transport.route_id': routeId,
        'student_transport.school_id': schoolId,
        'student_transport.academic_year_id': academicYearId,
        'student_transport.status': 'active'
      })
      .orderBy(['student_transport.stop_id', 'students.first_name']);
  }

  static async recordBoardingActivity(studentId, vehicleId, activityType, schoolId, location = null) {
    const [activity] = await db('transport_activities')
      .insert({
        id: crypto.randomUUID(),
        student_id: studentId,
        vehicle_id: vehicleId,
        activity_type: activityType, // 'boarded' or 'alighted'
        school_id: schoolId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        recorded_at: new Date()
      })
      .returning('*');

    // Send notification to parent
    await this.sendParentNotification(studentId, activityType, new Date());

    return activity;
  }

  static async sendParentNotification(studentId, activityType, timestamp) {
    // Get student and guardian details
    const studentInfo = await db('students')
      .select([
        'students.first_name',
        'students.last_name',
        'guardians.phone',
        'guardians.email'
      ])
      .join('guardians', 'students.primary_guardian_id', 'guardians.id')
      .where('students.id', studentId)
      .first();

    if (studentInfo && studentInfo.phone) {
      const message = `${studentInfo.first_name} ${studentInfo.last_name} has ${activityType} the school transport at ${timestamp.toLocaleTimeString()}.`;
      
      // Integration point with notification service
      // await NotificationService.sendSMS(studentInfo.phone, message);
      
      console.log(`Notification: ${message} sent to ${studentInfo.phone}`);
    }
  }

  static async getTransportStatistics(schoolId, academicYearId, dateRange = null) {
    let query = db(this.tableName)
      .select([
        db.raw('COUNT(DISTINCT student_id) as enrolled_students'),
        db.raw('COUNT(DISTINCT route_id) as active_routes'),
        db.raw('SUM(transport_fee) as total_transport_revenue')
      ])
      .where('school_id', schoolId)
      .where('academic_year_id', academicYearId)
      .where('status', 'active');

    if (dateRange) {
      query = query
        .where('enrolled_date', '>=', dateRange.start)
        .where('enrolled_date', '<=', dateRange.end);
    }

    const stats = await query.first();

    // Get activity statistics
    const activityStats = await db('transport_activities')
      .select([
        'activity_type',
        db.raw('COUNT(*) as count')
      ])
      .where('school_id', schoolId)
      .where('recorded_at', '>=', dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .groupBy('activity_type');

    return {
      enrollment_stats: stats,
      activity_stats: activityStats,
      generated_at: new Date()
    };
  }
}

module.exports = StudentTransport;