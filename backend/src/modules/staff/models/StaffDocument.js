// backend/src/modules/staff/models/StaffDocument.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StaffDocument {
  static tableName = 'staff_documents';

  static async create(documentData, staffId, schoolId, uploadedBy) {
    const [document] = await db(this.tableName)
      .insert({
        ...documentData,
        id: crypto.randomUUID(),
        staff_id: staffId,
        school_id: schoolId,
        uploaded_by: uploadedBy
      })
      .returning('*');
    return document;
  }

  static async findByStaff(staffId, schoolId) {
    return await db(this.tableName)
      .where({
        staff_id: staffId,
        school_id: schoolId,
        is_active: true
      })
      .orderBy('created_at', 'desc');
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async update(id, schoolId, updateData) {
    const [document] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return document;
  }

  static async verify(id, schoolId, verifiedBy, verificationNotes) {
    const [document] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        is_verified: true,
        verified_by: verifiedBy,
        verified_at: new Date(),
        verification_notes: verificationNotes,
        updated_at: new Date()
      })
      .returning('*');
    return document;
  }

  static async delete(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({ is_active: false, updated_at: new Date() });
  }

  static async getExpiringDocuments(schoolId, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await db(this.tableName)
      .select([
        'staff_documents.*',
        'staff.first_name',
        'staff.last_name',
        'staff.staff_id'
      ])
      .join('staff', 'staff_documents.staff_id', 'staff.id')
      .where('staff_documents.school_id', schoolId)
      .where('staff_documents.is_active', true)
      .whereNotNull('staff_documents.expiry_date')
      .where('staff_documents.expiry_date', '<=', futureDate.toISOString().split('T')[0])
      .orderBy('staff_documents.expiry_date', 'asc');
  }
}

module.exports = StaffDocument;