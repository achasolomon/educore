// backend/src/modules/auth/models/School.js
const db = require('../../../core/database/connection');

class School {
  static tableName = 'schools';

  static async create(schoolData) {
    const [school] = await db(this.tableName)
      .insert(schoolData)
      .returning('*');

    return school;
  }

  static async findById(id) {
    return await db(this.tableName)
      .where({ id })
      .first();
  }

  static async findByCode(code) {
    return await db(this.tableName)
      .where({ code })
      .first();
  }

  static async update(id, updates) {
    const [school] = await db(this.tableName)
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');

    return school;
  }

  static async getAllActive() {
    return await db(this.tableName)
      .where({ status: 'active' })
      .orderBy('name');
  }

  static async getStudentCount(schoolId) {
    const result = await db('students')
      .count('id as count')
      .where({ school_id: schoolId, status: 'active' })
      .first();

    return parseInt(result.count) || 0;
  }

  static async getStaffCount(schoolId) {
    const result = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .count('users.id as count')
      .where('users.school_id', schoolId)
      .where('users.status', 'active')
      .whereIn('roles.name', ['teacher', 'school_admin'])
      .first();

    return parseInt(result.count) || 0;
  }
}

module.exports = School;