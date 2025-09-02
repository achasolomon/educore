
// backend/src/modules/staff/models/StaffAssignment.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StaffAssignment {
  static tableName = 'staff_assignments';

  static async create(assignmentData, schoolId, assignedBy) {
    const [assignment] = await db(this.tableName)
      .insert({
        ...assignmentData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        assigned_by: assignedBy
      })
      .returning('*');
    return assignment;
  }

  static async findByStaff(staffId, schoolId, status = 'active') {
    return await db(this.tableName)
      .select([
        'staff_assignments.*',
        'classes.name as class_name',
        'subjects.name as subject_name'
      ])
      .leftJoin('classes', 'staff_assignments.class_id', 'classes.id')
      .leftJoin('subjects', 'staff_assignments.subject_id', 'subjects.id')
      .where('staff_assignments.staff_id', staffId)
      .where('staff_assignments.school_id', schoolId)
      .where('staff_assignments.status', status)
      .orderBy('staff_assignments.created_at', 'desc');
  }

  static async findByClass(classId, schoolId) {
    return await db(this.tableName)
      .select([
        'staff_assignments.*',
        'staff.first_name',
        'staff.last_name',
        'staff.staff_id',
        'subjects.name as subject_name'
      ])
      .join('staff', 'staff_assignments.staff_id', 'staff.id')
      .leftJoin('subjects', 'staff_assignments.subject_id', 'subjects.id')
      .where('staff_assignments.class_id', classId)
      .where('staff_assignments.school_id', schoolId)
      .where('staff_assignments.status', 'active')
      .orderBy('staff.last_name');
  }

  static async assignTeacherToClass(staffId, classId, termId, assignedBy, schoolId) {
    return await this.create({
      staff_id: staffId,
      class_id: classId,
      term_id: termId,
      assignment_type: 'class',
      start_date: new Date(),
      status: 'active'
    }, schoolId, assignedBy);
  }

  static async assignSubjectTeacher(staffId, subjectId, classId, termId, assignedBy, schoolId) {
    return await this.create({
      staff_id: staffId,
      subject_id: subjectId,
      class_id: classId,
      term_id: termId,
      assignment_type: 'subject',
      start_date: new Date(),
      status: 'active'
    }, schoolId, assignedBy);
  }

  static async updateStatus(id, schoolId, status, updatedBy) {
    const [assignment] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        status,
        updated_at: new Date(),
        ...(status === 'completed' && { end_date: new Date() })
      })
      .returning('*');
    return assignment;
  }
}

module.exports = StaffAssignment;