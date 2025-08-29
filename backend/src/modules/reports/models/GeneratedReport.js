// backend/src/modules/reports/models/GeneratedReport.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class GeneratedReport {
  static tableName = 'generated_reports';

  static async create(reportData, schoolId) {
    const [report] = await db(this.tableName)
      .insert({
        ...reportData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days
      })
      .returning('*');
    return report;
  }

  static async updateStatus(id, status, filePath = null, errorMessage = null) {
    const updateData = { status, updated_at: new Date() };
    
    if (filePath) updateData.file_path = filePath;
    if (errorMessage) updateData.error_message = errorMessage;
    
    const [report] = await db(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return report;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllByUser(userId, schoolId, limit = 20) {
    return await db(this.tableName)
      .where({ generated_by: userId, school_id: schoolId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  static async incrementDownloadCount(id) {
    await db(this.tableName)
      .where({ id })
      .update({
        download_count: db.raw('download_count + 1'),
        last_downloaded_at: new Date()
      });
  }

  static async cleanupExpired() {
    const expiredReports = await db(this.tableName)
      .where('expires_at', '<', new Date())
      .where('status', 'completed');
    
    // TODO: Delete actual files from filesystem
    
    await db(this.tableName)
      .where('expires_at', '<', new Date())
      .update({ status: 'expired' });
    
    return expiredReports.length;
  }
}

module.exports = GeneratedReport;