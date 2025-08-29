// backend/src/modules/assessments/models/Assessment.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Assessment {
  static tableName = 'assessments';

  static async create(assessmentData, schoolId) {
    const [assessment] = await db(this.tableName)
      .insert({
        ...assessmentData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return assessment;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllBySchool(schoolId, options = {}) {
    const {
      class_id,
      subject_id,
      term_id,
      type,
      status = 'published',
      limit = 50,
      offset = 0
    } = options;

    let query = db(this.tableName)
      .select([
        'assessments.*',
        'classes.name as class_name',
        'subjects.name as subject_name',
        'terms.name as term_name',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      ])
      .join('classes', 'assessments.class_id', 'classes.id')
      .join('subjects', 'assessments.subject_id', 'subjects.id')
      .join('terms', 'assessments.term_id', 'terms.id')
      .leftJoin('users', 'assessments.created_by', 'users.id')
      .where('assessments.school_id', schoolId);

    if (class_id) query = query.where('assessments.class_id', class_id);
    if (subject_id) query = query.where('assessments.subject_id', subject_id);
    if (term_id) query = query.where('assessments.term_id', term_id);
    if (type) query = query.where('assessments.type', type);
    if (status) query = query.where('assessments.status', status);

    const assessments = await query
      .orderBy('assessments.assessment_date', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db(this.tableName)
      .count('* as count')
      .where('school_id', schoolId);

    return { data: assessments, total: parseInt(count) };
  }

  static async update(id, updates, schoolId) {
    const [assessment] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return assessment;
  }

  static async getStudentsForAssessment(assessmentId, schoolId) {
    const assessment = await db(this.tableName)
      .where({ id: assessmentId, school_id: schoolId })
      .first();

    if (!assessment) return null;

    const students = await db('students')
      .select([
        'students.id',
        'students.student_id',
        'students.first_name',
        'students.last_name',
        'grades.score',
        'grades.percentage',
        'grades.letter_grade',
        'grades.status as grade_status'
      ])
      .leftJoin('grades', function() {
        this.on('students.id', '=', 'grades.student_id')
            .andOn('grades.assessment_id', '=', assessmentId);
      })
      .where('students.class_id', assessment.class_id)
      .where('students.status', 'active')
      .orderBy('students.first_name');

    return { assessment, students };
  }
}

module.exports = Assessment;