// backend/src/modules/staff/models/Staff.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Staff {
  static tableName = 'staff';

  static async create(staffData, schoolId, createdBy) {
    // Generate staff ID
    const staffId = await this.generateStaffId(schoolId, staffData.category_id);

    const [staff] = await db(this.tableName)
      .insert({
        ...staffData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        staff_id: staffId,
        created_by: createdBy,
        updated_by: createdBy
      })
      .returning('*');
    return staff;
  }

  static async generateStaffId(schoolId, categoryId) {
    // Get category code
    const category = await db('staff_categories')
      .where({ id: categoryId, school_id: schoolId })
      .first();

    if (!category) throw new Error('Invalid staff category');

    // Get current year
    const year = new Date().getFullYear().toString().slice(-2);

    // Get next sequence number for this category
    const lastStaff = await db(this.tableName)
      .where({ school_id: schoolId, category_id: categoryId })
      .where('staff_id', 'like', `${category.code}${year}%`)
      .orderBy('staff_id', 'desc')
      .first();

    let sequence = 1;
    if (lastStaff) {
      const lastSequence = parseInt(lastStaff.staff_id.slice(-3));
      sequence = lastSequence + 1;
    }

    return `${category.code}${year}${sequence.toString().padStart(3, '0')}`;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .select([
        'staff.*',
        'staff_categories.name as category_name',
        'departments.name as department_name',
        'positions.title as position_title',
        'users.email as user_email'
      ])
      .leftJoin('staff_categories', 'staff.category_id', 'staff_categories.id')
      .leftJoin('departments', 'staff.department_id', 'departments.id')
      .leftJoin('positions', 'staff.position_id', 'positions.id')
      .leftJoin('users', 'staff.user_id', 'users.id')
      .where('staff.id', id)
      .where('staff.school_id', schoolId)
      .first();
  }

  static async findByStaffId(staffId, schoolId) {
    return await this.findById(
      await db(this.tableName)
        .select('id')
        .where({ staff_id: staffId, school_id: schoolId })
        .first()
        .then(result => result?.id),
      schoolId
    );
  }

  static async findByEmail(email, schoolId) {
    return await db(this.tableName)
      .where({ email, school_id: schoolId })
      .first();
  }

  static async findBySchool(schoolId, filters = {}, pagination = null) {
    let query = db(this.tableName)
      .select([
        'staff.*',
        'staff_categories.name as category_name',
        'departments.name as department_name',
        'positions.title as position_title'
      ])
      .join('staff_categories', 'staff.category_id', 'staff_categories.id')
      .join('departments', 'staff.department_id', 'departments.id')
      .join('positions', 'staff.position_id', 'positions.id')
      .where('staff.school_id', schoolId);

    // Apply filters
    if (filters.category_id) {
      query = query.where('staff.category_id', filters.category_id);
    }

    if (filters.department_id) {
      query = query.where('staff.department_id', filters.department_id);
    }

    if (filters.employment_status) {
      query = query.where('staff.employment_status', filters.employment_status);
    }

    if (filters.employment_type) {
      query = query.where('staff.employment_type', filters.employment_type);
    }

    if (filters.is_active !== undefined) {
      query = query.where('staff.is_active', filters.is_active);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('staff.first_name', 'ilike', `%${filters.search}%`)
          .orWhere('staff.last_name', 'ilike', `%${filters.search}%`)
          .orWhere('staff.staff_id', 'ilike', `%${filters.search}%`)
          .orWhere('staff.email', 'ilike', `%${filters.search}%`);
      });
    }

    // Handle pagination
    if (pagination) {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [staff, totalCount] = await Promise.all([
        query
          .clone()
          .orderBy(['staff.last_name', 'staff.first_name'])
          .limit(limit)
          .offset(offset),
        query
          .clone()
          .count('* as count')
          .first()
      ]);

      return {
        data: staff,
        pagination: {
          current_page: page,
          per_page: limit,
          total: parseInt(totalCount.count),
          total_pages: Math.ceil(totalCount.count / limit)
        }
      };
    }

    return await query.orderBy(['staff.last_name', 'staff.first_name']);
  }

  static async findByDepartment(departmentId, schoolId, activeOnly = true) {
    let query = db(this.tableName)
      .select([
        'staff.*',
        'positions.title as position_title'
      ])
      .join('positions', 'staff.position_id', 'positions.id')
      .where('staff.department_id', departmentId)
      .where('staff.school_id', schoolId);

    if (activeOnly) {
      query = query.where('staff.is_active', true)
        .where('staff.employment_status', 'active');
    }

    return await query.orderBy(['staff.last_name', 'staff.first_name']);
  }

  static async update(id, schoolId, updateData, updatedBy) {
    const [staff] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        ...updateData,
        updated_by: updatedBy,
        updated_at: new Date()
      })
      .returning('*');
    return staff;
  }

  static async updateEmploymentStatus(id, schoolId, status, updatedBy, reason = null) {
    const updateData = {
      employment_status: status,
      updated_by: updatedBy,
      updated_at: new Date()
    };

    // Add metadata for status change
    if (reason) {
      updateData.metadata = db.raw(
        `COALESCE(metadata, '{}')::jsonb || ?::jsonb`,
        [JSON.stringify({
          status_changes: [{
            from_status: 'previous',
            to_status: status,
            changed_at: new Date(),
            changed_by: updatedBy,
            reason: reason
          }]
        })]
      );
    }

    const [staff] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update(updateData)
      .returning('*');
    return staff;
  }

  static async getStaffStatistics(schoolId) {
    const stats = await db(this.tableName)
      .select([
        'staff_categories.name as category',
        'employment_status',
        'employment_type',
        db.raw('COUNT(*) as count')
      ])
      .join('staff_categories', 'staff.category_id', 'staff_categories.id')
      .where('staff.school_id', schoolId)
      .where('staff.is_active', true)
      .groupBy(['staff_categories.name', 'employment_status', 'employment_type'])
      .orderBy('staff_categories.name');

    // Transform to more usable format
    const summary = {
      total_staff: 0,
      by_category: {},
      by_status: {},
      by_type: {}
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      summary.total_staff += count;

      // By category
      if (!summary.by_category[stat.category]) {
        summary.by_category[stat.category] = 0;
      }
      summary.by_category[stat.category] += count;

      // By status
      if (!summary.by_status[stat.employment_status]) {
        summary.by_status[stat.employment_status] = 0;
      }
      summary.by_status[stat.employment_status] += count;

      // By type
      if (!summary.by_type[stat.employment_type]) {
        summary.by_type[stat.employment_type] = 0;
      }
      summary.by_type[stat.employment_type] += count;
    });

    return summary;
  }

  static async deactivate(id, schoolId, updatedBy, reason) {
    return await this.update(id, schoolId, {
      is_active: false,
      employment_status: 'terminated'
    }, updatedBy);
  }

  static async bulkImport(staffList, schoolId, createdBy) {
    const results = [];
    const errors = [];

    for (let i = 0; i < staffList.length; i++) {
      try {
        const staffData = staffList[i];
        
        // Validate required fields
        if (!staffData.first_name || !staffData.last_name || !staffData.category_id) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields: first_name, last_name, category_id'
          });
          continue;
        }

        const staff = await this.create(staffData, schoolId, createdBy);
        results.push(staff);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }
}

module.exports = Staff;