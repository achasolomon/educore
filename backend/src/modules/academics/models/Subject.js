// backend/src/modules/academics/models/Subject.js
const db = require('../../../core/database/connection');

class Subject {
  static tableName = 'subjects';

  static async create(subjectData, schoolId) {
    const [subject] = await db(this.tableName)
      .insert({ ...subjectData, school_id: schoolId })
      .returning('*');
    return subject;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllBySchool(schoolId, options = {}) {
    const { is_active = true, category, limit = 50, offset = 0 } = options;

    let query = db(this.tableName)
      .select('*')
      .where('school_id', schoolId);

    if (is_active !== undefined) {
      query = query.where('is_active', is_active);
    }

    if (category) {
      query = query.where('category', category);
    }

    const subjects = await query
      .orderBy('name')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db(this.tableName)
      .count('* as count')
      .where('school_id', schoolId)
      .where('is_active', is_active);

    return { data: subjects, total: parseInt(count) };
  }

  static async update(id, updates, schoolId) {
    const [subject] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return subject;
  }
}

module.exports = Subject;