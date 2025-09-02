// backend/src/modules/staff/models/Department.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Department {
  static tableName = 'departments';

  static async create(departmentData, schoolId) {
    const [department] = await db(this.tableName)
      .insert({
        ...departmentData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return department;
  }

  static async findBySchool(schoolId) {
    return await db(this.tableName)
      .select([
        'departments.*',
        'parent.name as parent_department_name',
        'hod.first_name as hod_first_name',
        'hod.last_name as hod_last_name'
      ])
      .leftJoin('departments as parent', 'departments.parent_department_id', 'parent.id')
      .leftJoin('users as hod', 'departments.head_of_department', 'hod.id')
      .where('departments.school_id', schoolId)
      .where('departments.is_active', true)
      .orderBy('departments.name', 'asc');
  }

  static async findByType(departmentType, schoolId) {
    return await db(this.tableName)
      .where({ department_type: departmentType, school_id: schoolId, is_active: true })
      .orderBy('name', 'asc');
  }

  static async findByCode(code, schoolId) {
    return await db(this.tableName)
      .where({ code, school_id: schoolId })
      .first();
  }

  static async initializeDefaultDepartments(schoolId) {
    const defaultDepartments = [
      // Academic Departments
      { name: 'Mathematics', code: 'MATH', department_type: 'academic', description: 'Mathematics Department' },
      { name: 'English Language', code: 'ENG', department_type: 'academic', description: 'English Language Department' },
      { name: 'Sciences', code: 'SCI', department_type: 'academic', description: 'Science Department' },
      { name: 'Social Studies', code: 'SOC', department_type: 'academic', description: 'Social Studies Department' },
      { name: 'Creative Arts', code: 'ARTS', department_type: 'academic', description: 'Creative Arts Department' },
      { name: 'Physical Education', code: 'PE', department_type: 'academic', description: 'Physical Education Department' },
      
      // Administrative Departments
      { name: 'Administration', code: 'ADMIN', department_type: 'administrative', description: 'School Administration' },
      { name: 'Finance & Accounts', code: 'FIN', department_type: 'administrative', description: 'Finance and Accounts Department' },
      { name: 'Student Affairs', code: 'STUD', department_type: 'administrative', description: 'Student Affairs Department' },
      { name: 'Human Resources', code: 'HR', department_type: 'administrative', description: 'Human Resources Department' },
      
      // Support Departments
      { name: 'Maintenance', code: 'MAINT', department_type: 'support', description: 'Maintenance Department' },
      { name: 'Security', code: 'SEC', department_type: 'support', description: 'Security Department' },
      { name: 'Cleaning Services', code: 'CLEAN', department_type: 'support', description: 'Cleaning Services' },
      { name: 'Transport', code: 'TRANS', department_type: 'support', description: 'Transport Department' },
      { name: 'Medical', code: 'MED', department_type: 'support', description: 'Medical Department' },
    ];

    const createdDepartments = [];
    for (const deptData of defaultDepartments) {
      const existing = await this.findByCode(deptData.code, schoolId);
      if (!existing) {
        const department = await this.create(deptData, schoolId);
        createdDepartments.push(department);
      }
    }

    return createdDepartments;
  }

  static async getStaffCount(departmentId) {
    const result = await db('staff')
      .where({ department_id: departmentId, is_active: true })
      .count('* as count')
      .first();
    return parseInt(result.count);
  }

  static async assignHOD(departmentId, hodUserId, schoolId) {
    const [department] = await db(this.tableName)
      .where({ id: departmentId, school_id: schoolId })
      .update({ 
        head_of_department: hodUserId,
        updated_at: new Date() 
      })
      .returning('*');
    return department;
  }

  static async update(id, schoolId, updateData) {
    const [department] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return department;
  }

  static async delete(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ is_active: false, updated_at: new Date() });
  }
}

module.exports = Department;