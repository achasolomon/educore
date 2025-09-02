// backend/src/modules/finance/models/FeeStructure.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class FeeStructure {
  static tableName = 'fee_structures';

  static async create(structureData, schoolId) {
    const [structure] = await db(this.tableName)
      .insert({
        ...structureData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return structure;
  }

  static async findBySchool(schoolId, academicYearId = null) {
    let query = db(this.tableName)
      .select([
        'fee_structures.*',
        'fee_categories.name as category_name',
        'fee_categories.code as category_code',
        'classes.name as class_name',
        'terms.name as term_name'
      ])
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .join('classes', 'fee_structures.class_id', 'classes.id')
      .leftJoin('terms', 'fee_structures.term_id', 'terms.id')
      .where('fee_structures.school_id', schoolId)
      .where('fee_structures.is_active', true);

    if (academicYearId) {
      query = query.where('fee_structures.academic_year_id', academicYearId);
    }

    return await query.orderBy(['classes.name', 'fee_categories.sort_order']);
  }

  static async findByClass(classId, schoolId, academicYearId, termId = null) {
    let query = db(this.tableName)
      .select([
        'fee_structures.*',
        'fee_categories.name as category_name',
        'fee_categories.code as category_code',
        'fee_categories.category_type'
      ])
      .join('fee_categories', 'fee_structures.fee_category_id', 'fee_categories.id')
      .where('fee_structures.class_id', classId)
      .where('fee_structures.school_id', schoolId)
      .where('fee_structures.academic_year_id', academicYearId)
      .where('fee_structures.is_active', true);

    if (termId) {
      query = query.where(function() {
        this.where('fee_structures.term_id', termId)
          .orWhereNull('fee_structures.term_id'); // Include session-based fees
      });
    }

    return await query.orderBy('fee_categories.sort_order');
  }

  static async bulkCreateForClass(classId, academicYearId, feeStructures, schoolId) {
    const createdStructures = [];
    
    for (const structure of feeStructures) {
      // Check if structure already exists
      const existing = await db(this.tableName)
        .where({
          school_id: schoolId,
          academic_year_id: academicYearId,
          class_id: classId,
          fee_category_id: structure.fee_category_id,
          term_id: structure.term_id || null
        })
        .first();

      if (!existing) {
        const created = await this.create({
          ...structure,
          class_id: classId,
          academic_year_id: academicYearId
        }, schoolId);
        createdStructures.push(created);
      }
    }

    return createdStructures;
  }

  static async update(id, schoolId, updateData) {
    const [structure] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return structure;
  }

  static async delete(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ is_active: false, updated_at: new Date() });
  }

  static async getTotalFeeForClass(classId, academicYearId, termId, schoolId) {
    const structures = await this.findByClass(classId, schoolId, academicYearId, termId);
    
    return structures.reduce((total, structure) => {
      return total + parseFloat(structure.amount);
    }, 0);
  }

  static async copyFromPreviousYear(fromAcademicYearId, toAcademicYearId, schoolId, adjustmentPercentage = 0) {
    // Get all fee structures from previous year
    const previousStructures = await db(this.tableName)
      .where({ 
        school_id: schoolId, 
        academic_year_id: fromAcademicYearId,
        is_active: true 
      });

    const newStructures = [];
    
    for (const structure of previousStructures) {
      const adjustedAmount = parseFloat(structure.amount) * (1 + adjustmentPercentage / 100);
      
      const newStructure = {
        ...structure,
        id: crypto.randomUUID(),
        academic_year_id: toAcademicYearId,
        amount: adjustedAmount,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Remove the old ID and timestamps
      delete newStructure.id;
      
      const created = await this.create(newStructure, schoolId);
      newStructures.push(created);
    }

    return newStructures;
  }
}

module.exports = FeeStructure;
