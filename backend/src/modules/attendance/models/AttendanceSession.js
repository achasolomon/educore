// backend/src/modules/attendance/models/AttendanceSession.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class AttendanceSession {
  static tableName = 'attendance_sessions';

  static async create(sessionData, schoolId) {
    const [session] = await db(this.tableName)
      .insert({
        ...sessionData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return session;
  }

 static async startSession(classId, teacherId, sessionDate, sessionType, schoolId, notes = null) {
    // Get total students in class
    const studentCount = await db('students')
      .count('id as count')
      .where('class_id', classId)
      .where('status', 'active')
      .first();

    const sessionData = {
      class_id: classId,
      teacher_id: teacherId,
      session_date: sessionDate,
      session_type: sessionType,
      start_time: new Date().toTimeString().slice(0, 8),
      status: 'active',
      total_students: parseInt(studentCount.count),
      notes: notes
    };

    return await this.create(sessionData, schoolId);
  }

  static async completeSession(sessionId, schoolId, notes = null) {
    // Calculate attendance counts
    const session = await db(this.tableName)
      .where({ id: sessionId, school_id: schoolId })
      .first();

    if (!session) {
      return null;
    }

    const attendanceStats = await db('attendance_records')
      .select([
        'status',
        db.raw('COUNT(*) as count')
      ])
      .where('attendance_date', session.session_date)
      .where('class_id', session.class_id)
      .where('school_id', schoolId)
      .groupBy('status');

    const updateData = {
      status: 'completed',
      completed_at: new Date(),
      end_time: new Date().toTimeString().slice(0, 8),
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      notes: notes || session.notes
    };

    attendanceStats.forEach(stat => {
      if (stat.status === 'present') updateData.present_count = parseInt(stat.count);
      if (stat.status === 'absent') updateData.absent_count = parseInt(stat.count);
      if (stat.status === 'late') updateData.late_count = parseInt(stat.count);
    });

    const [updatedSession] = await db(this.tableName)
      .where({ id: sessionId, school_id: schoolId })
      .update(updateData)
      .returning('*');

    return updatedSession;
  }

  // Get session by ID
  static async getById(sessionId, schoolId) {
    return await db(this.tableName)
      .where({ id: sessionId, school_id: schoolId })
      .first();
  }

  // Update session statistics
  static async updateSessionStats(sessionId, schoolId, trx = null) {
    const dbInstance = trx || db;
    
    const session = await dbInstance(this.tableName)
      .where({ id: sessionId, school_id: schoolId })
      .first();

    if (!session) return null;

    const attendanceStats = await dbInstance('attendance_records')
      .select([
        'status',
        dbInstance.raw('COUNT(*) as count')
      ])
      .where('attendance_date', session.session_date)
      .where('class_id', session.class_id)
      .where('school_id', schoolId)
      .groupBy('status');

    const updateData = {
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      updated_at: new Date()
    };

    attendanceStats.forEach(stat => {
      if (stat.status === 'present') updateData.present_count = parseInt(stat.count);
      if (stat.status === 'absent') updateData.absent_count = parseInt(stat.count);
      if (stat.status === 'late') updateData.late_count = parseInt(stat.count);
    });

    await dbInstance(this.tableName)
      .where({ id: sessionId, school_id: schoolId })
      .update(updateData);

    return updateData;
  }

  static async getActiveSession(classId, date, schoolId) {
    return await db(this.tableName)
      .where({
        class_id: classId,
        session_date: date,
        school_id: schoolId,
        status: 'active'
      })
      .first();
  }

  static async getSessionHistory(classId, schoolId, limit = 20) {
    return await db(this.tableName)
      .select([
        'attendance_sessions.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      ])
      .join('users', 'attendance_sessions.teacher_id', 'users.id')
      .where('attendance_sessions.class_id', classId)
      .where('attendance_sessions.school_id', schoolId)
      .orderBy('attendance_sessions.session_date', 'desc')
      .limit(limit);
  }
}

module.exports = AttendanceSession;