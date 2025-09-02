// backend/src/modules/staff/models/Position.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Position {
  static tableName = 'positions';

  static async create(positionData, schoolId) {
    const [position] = await db(this.tableName)
      .insert({
        ...positionData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return position;
  }

  static async findBySchool(schoolId) {
    return await db(this.tableName)
      .select([
        'positions.*',
        'departments.name as department_name',
        'staff_categories.name as category_name'
      ])
      .join('departments', 'positions.department_id', 'departments.id')
      .join('staff_categories', 'positions.category_id', 'staff_categories.id')
      .where('positions.school_id', schoolId)
      .where('positions.is_active', true)
      .orderBy(['departments.name', 'positions.title']);
  }

  static async findByDepartment(departmentId, schoolId) {
    return await db(this.tableName)
      .where({ department_id: departmentId, school_id: schoolId, is_active: true })
      .orderBy('title', 'asc');
  }

  static async findByCategory(categoryId, schoolId) {
    return await db(this.tableName)
      .where({ category_id: categoryId, school_id: schoolId, is_active: true })
      .orderBy('title', 'asc');
  }

  static async initializeDefaultPositions(schoolId) {
    // Get department and category IDs first
    const departments = await db('departments').where('school_id', schoolId);
    const categories = await db('staff_categories').where('school_id', schoolId);

    const getDeptId = (code) => departments.find(d => d.code === code)?.id;
    const getCatId = (code) => categories.find(c => c.code === code)?.id;

    const defaultPositions = [
      // Academic Positions
      {
        title: 'Principal',
        code: 'PRIN',
        department_id: getDeptId('ADMIN'),
        category_id: getCatId('ACAD'),
        job_description: 'Chief Executive of the school',
        grade_level: 1,
        min_salary: 500000,
        max_salary: 1000000,
        is_management: true,
        max_positions: 1,
        requirements: ['Masters Degree', '10+ years teaching experience', '5+ years management experience'],
        responsibilities: ['Overall school leadership', 'Policy implementation', 'Staff management']
      },
      {
        title: 'Vice Principal',
        code: 'VP',
        department_id: getDeptId('ADMIN'),
        category_id: getCatId('ACAD'),
        job_description: 'Deputy to the Principal',
        grade_level: 2,
        min_salary: 350000,
        max_salary: 600000,
        is_management: true,
        max_positions: 2,
        requirements: ['Bachelors Degree', '8+ years teaching experience', '3+ years management experience'],
        responsibilities: ['Academic supervision', 'Disciplinary matters', 'Support Principal']
      },
      {
        title: 'Head Teacher',
        code: 'HT',
        department_id: getDeptId('ADMIN'),
        category_id: getCatId('ACAD'),
        job_description: 'Head of Primary School Section',
        grade_level: 3,
        min_salary: 250000,
        max_salary: 450000,
        is_management: true,
        max_positions: 1,
        requirements: ['Bachelors Degree', '5+ years teaching experience'],
        responsibilities: ['Primary section management', 'Curriculum oversight', 'Teacher supervision']
      },
      {
        title: 'Subject Teacher',
        code: 'TCH',
        department_id: getDeptId('MATH'), // Will vary by actual department
        category_id: getCatId('ACAD'),
        job_description: 'Classroom teacher',
        grade_level: 5,
        min_salary: 80000,
        max_salary: 200000,
        is_management: false,
        max_positions: 50,
        requirements: ['Teaching qualification', 'NCE/Bachelors Degree'],
        responsibilities: ['Lesson delivery', 'Student assessment', 'Record keeping']
      },
      
      // Administrative Positions
      {
        title: 'School Administrator',
        code: 'SADMIN',
        department_id: getDeptId('ADMIN'),
        category_id: getCatId('ADMIN'),
        job_description: 'Administrative operations manager',
        grade_level: 4,
        min_salary: 150000,
        max_salary: 300000,
        is_management: false,
        max_positions: 3,
        requirements: ['Bachelors Degree', 'Administrative experience'],
        responsibilities: ['Office management', 'Record keeping', 'Communication coordination']
      },
      {
        title: 'Accountant',
        code: 'ACC',
        department_id: getDeptId('FIN'),
        category_id: getCatId('ADMIN'),
        job_description: 'Financial records and accounting',
        grade_level: 4,
        min_salary: 120000,
        max_salary: 250000,
        is_management: false,
        max_positions: 2,
        requirements: ['Accounting degree/certification', 'Financial experience'],
        responsibilities: ['Financial records', 'Budget management', 'Fee collection']
      },
      {
        title: 'Secretary',
        code: 'SEC',
        department_id: getDeptId('ADMIN'),
        category_id: getCatId('ADMIN'),
        job_description: 'Administrative support',
        grade_level: 6,
        min_salary: 60000,
        max_salary: 120000,
        is_management: false,
        max_positions: 5,
        requirements: ['Secondary education', 'Computer literacy'],
        responsibilities: ['Documentation', 'Communication support', 'Data entry']
      },

      // Support Staff Positions
      {
        title: 'Driver',
        code: 'DRV',
        department_id: getDeptId('TRANS'),
        category_id: getCatId('TRANS'),
        job_description: 'School transport driver',
        grade_level: 7,
        min_salary: 50000,
        max_salary: 100000,
        is_management: false,
        max_positions: 10,
        requirements: ['Valid driving license', 'Clean driving record', '3+ years experience'],
        responsibilities: ['Safe student transport', 'Vehicle maintenance', 'Route compliance']
      },
      {
        title: 'Security Guard',
        code: 'GUARD',
        department_id: getDeptId('SEC'),
        category_id: getCatId('SUPP'),
        job_description: 'School security personnel',
        grade_level: 8,
        min_salary: 40000,
        max_salary: 80000,
        is_management: false,
        max_positions: 8,
        requirements: ['Basic education', 'Security training preferred'],
        responsibilities: ['School security', 'Access control', 'Emergency response']
      },
      {
        title: 'Cleaner',
        code: 'CLEAN',
        department_id: getDeptId('CLEAN'),
        category_id: getCatId('SUPP'),
        job_description: 'Cleaning and maintenance',
        grade_level: 9,
        min_salary: 30000,
        max_salary: 60000,
        is_management: false,
        max_positions: 15,
        requirements: ['Basic education'],
        responsibilities: ['Facility cleaning', 'Basic maintenance', 'Hygiene standards']
      },

      // Medical Staff
      {
        title: 'School Nurse',
        code: 'NURSE',
        department_id: getDeptId('MED'),
        category_id: getCatId('MED'),
        job_description: 'Student health and medical care',
        grade_level: 4,
        min_salary: 100000,
        max_salary: 200000,
        is_management: false,
        max_positions: 2,
        requirements: ['Nursing qualification', 'Valid license', 'Pediatric experience'],
        responsibilities: ['Student health care', 'Health records', 'Emergency medical response']
      }
    ];

    const createdPositions = [];
    for (const posData of defaultPositions) {
      if (posData.department_id && posData.category_id) {
        const existing = await db(this.tableName)
          .where({ code: posData.code, school_id: schoolId })
          .first();
        
        if (!existing) {
          const position = await this.create(posData, schoolId);
          createdPositions.push(position);
        }
      }
    }

    return createdPositions;
  }

  static async getCurrentStaffCount(positionId) {
    const result = await db('staff')
      .where({ position_id: positionId, is_active: true })
      .count('* as count')
      .first();
    return parseInt(result.count);
  }

  static async isAvailable(positionId) {
    const position = await db(this.tableName)
      .where({ id: positionId })
      .first();

    if (!position || !position.max_positions) return true;

    const currentCount = await this.getCurrentStaffCount(positionId);
    return currentCount < position.max_positions;
  }

  static async update(id, schoolId, updateData) {
    const [position] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return position;
  }

  static async delete(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ is_active: false, updated_at: new Date() });
  }
}

module.exports = Position;