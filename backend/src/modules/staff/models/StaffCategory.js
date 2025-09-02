// backend/src/modules/staff/models/StaffCategory.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StaffCategory {
  static tableName = 'staff_categories';

  static async create(categoryData, schoolId) {
    const [category] = await db(this.tableName)
      .insert({
        ...categoryData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return category;
  }

  static async findBySchool(schoolId) {
    return await db(this.tableName)
      .where({ school_id: schoolId, is_active: true })
      .orderBy('sort_order', 'asc');
  }

  static async findByCode(code, schoolId) {
    return await db(this.tableName)
      .where({ code, school_id: schoolId })
      .first();
  }

  static async initializeDefaultCategories(schoolId) {
    const defaultCategories = [
      {
        name: 'Academic Staff',
        code: 'ACAD',
        description: 'Teachers and academic personnel',
        is_academic: true,
        required_fields: ['qualifications', 'subjects', 'teaching_experience'],
        optional_fields: ['research_interests', 'publications'],
        sort_order: 1
      },
      {
        name: 'Administrative Staff',
        code: 'ADMIN',
        description: 'Office and administrative personnel',
        is_academic: false,
        required_fields: ['qualifications', 'administrative_experience'],
        optional_fields: ['computer_skills', 'languages'],
        sort_order: 2
      },
      {
        name: 'Support Staff',
        code: 'SUPP',
        description: 'Cleaners, security, maintenance staff',
        is_academic: false,
        required_fields: ['work_experience'],
        optional_fields: ['special_skills'],
        sort_order: 3
      },
      {
        name: 'Medical Staff',
        code: 'MED',
        description: 'Nurses, doctors, health personnel',
        is_academic: false,
        required_fields: ['medical_qualifications', 'license_number', 'medical_experience'],
        optional_fields: ['specializations'],
        sort_order: 4
      },
      {
        name: 'Transport Staff',
        code: 'TRANS',
        description: 'Drivers, conductors, mechanics',
        is_academic: false,
        required_fields: ['driving_license', 'driving_experience'],
        optional_fields: ['mechanical_skills', 'first_aid_certificate'],
        sort_order: 5
      }
    ];

    const createdCategories = [];
    for (const categoryData of defaultCategories) {
      const existing = await this.findByCode(categoryData.code, schoolId);
      if (!existing) {
        const category = await this.create(categoryData, schoolId);
        createdCategories.push(category);
      }
    }

    return createdCategories;
  }

  static async update(id, schoolId, updateData) {
    const [category] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return category;
  }

  static async delete(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ is_active: false, updated_at: new Date() });
  }
}

module.exports = StaffCategory;