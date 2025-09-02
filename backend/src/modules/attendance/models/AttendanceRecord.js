// backend/src/modules/attendance/models/AttendanceRecord.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class AttendanceRecord {
  static tableName = 'attendance_records';

  static async create(attendanceData, schoolId) {
    const [record] = await db(this.tableName)
      .insert({
        ...attendanceData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return record;
  }
 // Enhanced markAttendance method with transaction support
  static async markAttendance(studentId, classId, date, status, markedBy, schoolId, options = {}, trx = null) {
    const { method = 'manual', checkInTime, checkOutTime, remarks, sessionId } = options;
    const dbInstance = trx || db;

    const attendanceData = {
      student_id: studentId,
      class_id: classId,
      attendance_date: date,
      status: status,
      marked_by: markedBy,
      method: method,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      remarks: remarks
    };

    // Check if attendance already exists for this student and date
    const existing = await dbInstance(this.tableName)
      .where({
        student_id: studentId,
        attendance_date: date,
        school_id: schoolId
      })
      .first();

    if (existing) {
      // Update existing record and mark as modified
      const [updated] = await dbInstance(this.tableName)
        .where({ id: existing.id })
        .update({
          ...attendanceData,
          is_modified: true,
          modified_by: markedBy,
          modified_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return updated;
    } else {
      // Create new record
      const [record] = await dbInstance(this.tableName)
        .insert({
          ...attendanceData,
          id: crypto.randomUUID(),
          school_id: schoolId
        })
        .returning('*');
      return record;
    }
  }

  // Enhanced getStudentAttendance with pagination
  static async getStudentAttendance(studentId, startDate, endDate, schoolId, pagination = null) {
    let query = db(this.tableName)
      .where('student_id', studentId)
      .where('school_id', schoolId);

    if (startDate) query = query.where('attendance_date', '>=', startDate);
    if (endDate) query = query.where('attendance_date', '<=', endDate);

    // Add pagination if provided
    if (pagination) {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;
      
      const [records, totalCount] = await Promise.all([
        query
          .clone()
          .orderBy('attendance_date', 'desc')
          .limit(limit)
          .offset(offset),
        query
          .clone()
          .count('* as count')
          .first()
      ]);

      return {
        data: records,
        pagination: {
          current_page: page,
          per_page: limit,
          total: parseInt(totalCount.count),
          total_pages: Math.ceil(totalCount.count / limit)
        }
      };
    }

    return await query.orderBy('attendance_date', 'desc');
  }

  // Bulk operations methods
  static async markAllPresent(classId, date, markedBy, schoolId) {
    // Get all active students in class
    const students = await db('students')
      .select(['id'])
      .where({ class_id: classId, status: 'active' });

    const attendanceRecords = students.map(student => ({
      student_id: student.id,
      class_id: classId,
      attendance_date: date,
      status: 'present'
    }));

    return await this.bulkMarkAttendance(attendanceRecords, markedBy, schoolId);
  }

  static async markAllAbsent(classId, date, markedBy, schoolId) {
    // Get all active students in class
    const students = await db('students')
      .select(['id'])
      .where({ class_id: classId, status: 'active' });

    const attendanceRecords = students.map(student => ({
      student_id: student.id,
      class_id: classId,
      attendance_date: date,
      status: 'absent'
    }));

    return await this.bulkMarkAttendance(attendanceRecords, markedBy, schoolId);
  }

  static async copyPreviousDayAttendance(classId, fromDate, toDate, markedBy, schoolId) {
    // Get previous day's attendance
    const previousAttendance = await db(this.tableName)
      .where({
        class_id: classId,
        attendance_date: fromDate,
        school_id: schoolId
      })
      .select(['student_id', 'status', 'remarks']);

    if (previousAttendance.length === 0) {
      throw new Error('No attendance records found for the specified date');
    }

    const attendanceRecords = previousAttendance.map(record => ({
      student_id: record.student_id,
      class_id: classId,
      attendance_date: toDate,
      status: record.status,
      remarks: record.remarks
    }));

    return await this.bulkMarkAttendance(attendanceRecords, markedBy, schoolId);
  }

  static async bulkMarkAttendance(attendanceRecords, markedBy, schoolId) {
    const results = [];
    
    for (const record of attendanceRecords) {
      const result = await this.markAttendance(
        record.student_id,
        record.class_id,
        record.attendance_date,
        record.status,
        markedBy,
        schoolId,
        {
          method: 'bulk',
          checkInTime: record.check_in_time,
          remarks: record.remarks
        }
      );
      results.push(result);
    }

    return results;
  }

  static async getClassAttendance(classId, date, schoolId) {
    return await db(this.tableName)
      .select([
        'attendance_records.*',
        'students.student_id',
        'students.first_name',
        'students.last_name'
      ])
      .join('students', 'attendance_records.student_id', 'students.id')
      .where('attendance_records.class_id', classId)
      .where('attendance_records.attendance_date', date)
      .where('attendance_records.school_id', schoolId)
      .orderBy('students.first_name');
  }

  static async getStudentAttendance(studentId, startDate, endDate, schoolId) {
    let query = db(this.tableName)
      .where('student_id', studentId)
      .where('school_id', schoolId);

    if (startDate) query = query.where('attendance_date', '>=', startDate);
    if (endDate) query = query.where('attendance_date', '<=', endDate);

    return await query
      .orderBy('attendance_date', 'desc');
  }

  static async getAttendanceSummary(studentId, termId, schoolId) {
    // Get term dates
    const term = await db('terms').where('id', termId).first();
    if (!term) return null;

    const records = await this.getStudentAttendance(
      studentId,
      term.start_date,
      term.end_date,
      schoolId
    );

    // Calculate school days (excluding weekends)
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);
    let totalSchoolDays = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        totalSchoolDays++;
      }
    }

    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;

    return {
      total_school_days: totalSchoolDays,
      days_present: present,
      days_absent: absent,
      days_late: late,
      days_excused: excused,
      attendance_percentage: totalSchoolDays > 0 ? ((present / totalSchoolDays) * 100).toFixed(2) : 0,
      punctuality_percentage: totalSchoolDays > 0 ? (((present - late) / totalSchoolDays) * 100).toFixed(2) : 0
    };
  }

  static async getDailyAttendanceStats(date, schoolId, classId = null) {
    let query = db(this.tableName)
      .select([
        'status',
        db.raw('COUNT(*) as count')
      ])
      .where('attendance_date', date)
      .where('school_id', schoolId);

    if (classId) query = query.where('class_id', classId);

    const stats = await query.groupBy('status');

    const result = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0
    };

    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    return result;
  }
}

module.exports = AttendanceRecord;