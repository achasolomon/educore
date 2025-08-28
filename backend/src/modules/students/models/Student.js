// backend/src/modules/students/models/Student.js
const db = require('../../../core/database/connection');

class Student {
  static tableName = 'students';

  static async create(studentData, schoolId) {
    const [student] = await db(this.tableName)
      .insert({
        ...studentData,
        school_id: schoolId
      })
      .returning('*');

    return student;
  }

  static async findById(id, schoolId = null) {
    const query = db(this.tableName).where({ id });
    
    if (schoolId) {
      query.where({ school_id: schoolId });
    }
    
    return await query.first();
  }

  static async findByStudentId(studentId, schoolId) {
    return await db(this.tableName)
      .where({ student_id: studentId, school_id: schoolId })
      .first();
  }

  static async findWithGuardians(id, schoolId) {
    const student = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();

    if (!student) return null;

    const guardians = await db('guardians')
      .select([
        'guardians.*',
        'student_guardians.relationship',
        'student_guardians.is_primary',
        'student_guardians.can_pickup',
        'student_guardians.emergency_contact'
      ])
      .join('student_guardians', 'guardians.id', 'student_guardians.guardian_id')
      .where('student_guardians.student_id', id);

    return {
      ...student,
      guardians
    };
  }

  static async getAllBySchool(schoolId, options = {}) {
    const {
      status = 'active',
      limit = 50,
      offset = 0,
      search,
      class_id
    } = options;

    let query = db(this.tableName)
      .where({ school_id: schoolId });

    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('student_id', 'ilike', `%${search}%`);
      });
    }

    if (class_id) {
      query = query.where({ class_id });
    }

    const students = await query
      .orderBy('first_name')
      .limit(limit)
      .offset(offset);

    const total = await db(this.tableName)
      .count('id as count')
      .where({ school_id: schoolId, status })
      .first();

    return {
      data: students,
      total: parseInt(total.count),
      limit,
      offset
    };
  }

  static async update(id, updates, schoolId) {
    const [student] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');

    return student;
  }

  static async generateStudentId(schoolId) {
    const year = new Date().getFullYear();
    const school = await db('schools').where({ id: schoolId }).first();
    
    // Get the count of students for this year
    const count = await db(this.tableName)
      .count('id as count')
      .where({ school_id: schoolId })
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .first();

    const sequence = String(parseInt(count.count) + 1).padStart(3, '0');
    return `${school.code}/${year}/${sequence}`;
  }

  static async addGuardian(studentId, guardianData, relationship, options = {}) {
    const { is_primary = false, can_pickup = true, emergency_contact = true } = options;

    // Create or find guardian
    let guardian;
    if (guardianData.id) {
      guardian = await db('guardians').where({ id: guardianData.id }).first();
    } else {
      [guardian] = await db('guardians')
        .insert(guardianData)
        .returning('*');
    }

    // Link student and guardian
    await db('student_guardians')
      .insert({
        student_id: studentId,
        guardian_id: guardian.id,
        relationship,
        is_primary,
        can_pickup,
        emergency_contact
      })
      .onConflict(['student_id', 'guardian_id'])
      .merge();

    return guardian;
  }
}

module.exports = Student;
