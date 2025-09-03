// backend/src/modules/finance/models/ExpenseCategory.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class ExpenseCategory {
  static tableName = 'expense_categories';

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

  static async initializeDefaultCategories(schoolId) {
    const defaultCategories = [
      {
        name: 'Staff Salaries',
        code: 'SALARIES',
        description: 'Teaching and non-teaching staff salaries',
        category_type: 'operating',
        requires_approval: false,
        sort_order: 1
      },
      {
        name: 'Utilities',
        code: 'UTILITIES',
        description: 'Electricity, water, internet, and other utilities',
        category_type: 'operating',
        requires_approval: false,
        approval_threshold: 50000,
        sort_order: 2
      },
      {
        name: 'Teaching Materials',
        code: 'TEACHING_MAT',
        description: 'Books, stationery, and teaching aids',
        category_type: 'academic',
        requires_approval: true,
        approval_threshold: 20000,
        sort_order: 3
      },
      {
        name: 'Infrastructure Development',
        code: 'INFRASTRUCTURE',
        description: 'Buildings, classrooms, and facility improvements',
        category_type: 'capital',
        requires_approval: true,
        approval_threshold: 100000,
        sort_order: 4
      },
      {
        name: 'Equipment Purchase',
        code: 'EQUIPMENT',
        description: 'Computers, furniture, and other equipment',
        category_type: 'capital',
        requires_approval: true,
        approval_threshold: 50000,
        sort_order: 5
      },
      {
        name: 'Maintenance & Repairs',
        code: 'MAINTENANCE',
        description: 'Building and equipment maintenance',
        category_type: 'maintenance',
        requires_approval: false,
        approval_threshold: 25000,
        sort_order: 6
      },
      {
        name: 'Administrative Expenses',
        code: 'ADMIN',
        description: 'Office supplies, communication, and admin costs',
        category_type: 'administrative',
        requires_approval: false,
        approval_threshold: 15000,
        sort_order: 7
      },
      {
        name: 'Student Activities',
        code: 'STUDENT_ACT',
        description: 'Sports, excursions, and extracurricular activities',
        category_type: 'academic',
        requires_approval: true,
        approval_threshold: 30000,
        sort_order: 8
      }
    ];

    const createdCategories = [];
    for (const categoryData of defaultCategories) {
      const existing = await db(this.tableName)
        .where({ code: categoryData.code, school_id: schoolId })
        .first();

      if (!existing) {
        const category = await this.create(categoryData, schoolId);
        createdCategories.push(category);
      }
    }

    return createdCategories;
  }

  static async findBySchool(schoolId) {
    return await db(this.tableName)
      .where({ school_id: schoolId, is_active: true })
      .orderBy('sort_order', 'asc');
  }
}

module.exports = ExpenseCategory;