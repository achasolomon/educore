// backend/src/modules/finance/models/FeeCategory.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class FeeCategory {
  static tableName = 'fee_categories';

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
        name: 'Tuition Fee',
        code: 'TUITION',
        description: 'Basic tuition fee for academic instruction',
        category_type: 'mandatory',
        is_recurring: true,
        billing_cycle: 'term',
        default_amount: 0,
        sort_order: 1
      },
      {
        name: 'Development Levy',
        code: 'DEVELOPMENT',
        description: 'School infrastructure development fee',
        category_type: 'mandatory',
        is_recurring: true,
        billing_cycle: 'session',
        default_amount: 0,
        sort_order: 2
      },
      {
        name: 'Transport Fee',
        code: 'TRANSPORT',
        description: 'School bus transportation fee',
        category_type: 'optional',
        is_recurring: true,
        billing_cycle: 'term',
        default_amount: 0,
        sort_order: 3
      },
      {
        name: 'Lunch Fee',
        code: 'LUNCH',
        description: 'School meal program fee',
        category_type: 'optional',
        is_recurring: true,
        billing_cycle: 'term',
        default_amount: 0,
        sort_order: 4
      },
      {
        name: 'Books & Materials',
        code: 'BOOKS',
        description: 'Textbooks and learning materials',
        category_type: 'mandatory',
        is_recurring: true,
        billing_cycle: 'session',
        default_amount: 0,
        sort_order: 5
      },
      {
        name: 'Uniform',
        code: 'UNIFORM',
        description: 'School uniform purchase',
        category_type: 'mandatory',
        is_recurring: false,
        billing_cycle: 'one_time',
        default_amount: 0,
        sort_order: 6
      },
      {
        name: 'Examination Fee',
        code: 'EXAM',
        description: 'External examination registration fees',
        category_type: 'mandatory',
        is_recurring: false,
        billing_cycle: 'one_time',
        default_amount: 0,
        sort_order: 7
      },
      {
        name: 'Excursion Fee',
        code: 'EXCURSION',
        description: 'Educational trips and excursions',
        category_type: 'optional',
        is_recurring: false,
        billing_cycle: 'one_time',
        default_amount: 0,
        sort_order: 8
      },
      {
        name: 'Extra-Curricular Activities',
        code: 'EXTRA',
        description: 'Sports, clubs, and other activities',
        category_type: 'optional',
        is_recurring: true,
        billing_cycle: 'term',
        default_amount: 0,
        sort_order: 9
      },
      {
        name: 'Medical Fee',
        code: 'MEDICAL',
        description: 'School health services and medical care',
        category_type: 'optional',
        is_recurring: true,
        billing_cycle: 'session',
        default_amount: 0,
        sort_order: 10
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

  static async getMandatoryCategories(schoolId) {
    return await db(this.tableName)
      .where({ 
        school_id: schoolId, 
        is_active: true, 
        category_type: 'mandatory' 
      })
      .orderBy('sort_order', 'asc');
  }

  static async getOptionalCategories(schoolId) {
    return await db(this.tableName)
      .where({ 
        school_id: schoolId, 
        is_active: true, 
        category_type: 'optional' 
      })
      .orderBy('sort_order', 'asc');
  }
}

module.exports = FeeCategory;