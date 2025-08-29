// backend/src/modules/communication/models/Announcement.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Announcement {
  static tableName = 'announcements';

  static async create(announcementData, schoolId) {
    const [announcement] = await db(this.tableName)
      .insert({
        ...announcementData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return announcement;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getAllBySchool(schoolId, options = {}) {
    const {
      type,
      is_published = true,
      limit = 20,
      offset = 0,
      include_expired = false
    } = options;

    let query = db(this.tableName)
      .select([
        'announcements.*',
        'users.first_name as created_by_first_name',
        'users.last_name as created_by_last_name'
      ])
      .join('users', 'announcements.created_by', 'users.id')
      .where('announcements.school_id', schoolId);

    if (is_published !== undefined) {
      query = query.where('announcements.is_published', is_published);
    }

    if (type) {
      query = query.where('announcements.type', type);
    }

    if (!include_expired) {
      query = query.where(function() {
        this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      });
    }

    return await query
      .orderBy('announcements.is_pinned', 'desc')
      .orderBy('announcements.publish_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async publish(id, schoolId) {
    const [announcement] = await db(this.tableName)
      .where({ id, school_id: schoolId })
      .update({
        is_published: true,
        publish_at: new Date()
      })
      .returning('*');

    return announcement;
  }

  static async incrementViewCount(id) {
    await db(this.tableName)
      .where({ id })
      .increment('view_count', 1);
  }

  static async getPublishedAnnouncements(schoolId, targetRoles = null) {
    let query = db(this.tableName)
      .where('school_id', schoolId)
      .where('is_published', true)
      .where('publish_at', '<=', new Date())
      .where(function() {
        this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      });

    if (targetRoles) {
      query = query.whereRaw('target_audience::jsonb -> \'roles\' ?| array[?]', [targetRoles]);
    }

    return await query
      .orderBy('is_pinned', 'desc')
      .orderBy('publish_at', 'desc');
  }
}

module.exports = Announcement;