// backend/src/modules/academics/models/Class.js
const db = require('../../../core/database/connection');

class Class {
  static tableName = 'classes';

  static async create(classData, schoolId) {
    const [classRecord] = await db(this.tableName)
      .insert({ ...classData, school_id: schoolId })
      .returning('*');
    return classRecord;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllBySchool(schoolId, options = {}) {
    const { is_active = true, limit = 50, offset = 0 } = options;

    let query = db(this.tableName)
      .select([
        'classes.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name',
        db.raw('COUNT(students.id) as student_count')
      ])
      .leftJoin('users', 'classes.class_teacher_id', 'users.id')
      .leftJoin('students', function() {
        this.on('classes.id', '=', 'students.class_id')
            .andOn('students.status', '=', db.raw("'active'"));
      })
      .where('classes.school_id', schoolId)
      .groupBy('classes.id', 'users.first_name', 'users.last_name');

    if (is_active !== undefined) {
      query = query.where('classes.is_active', is_active);
    }

    const classes = await query
      .orderBy('classes.level', 'asc')
      .orderBy('classes.section', 'asc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db(this.tableName)
      .count('* as count')
      .where('school_id', schoolId)
      .where('is_active', is_active);

    return { data: classes, total: parseInt(count) };
  }

  static async update(id, updates, schoolId) {
    const [classRecord] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return classRecord;
  }

  static async getStudents(classId, schoolId) {
    return await db('students')
      .select(['id', 'student_id', 'first_name', 'last_name', 'status'])
      .where({ class_id: classId, school_id: schoolId })
      .orderBy('first_name');
  }
}

module.exports = Class;