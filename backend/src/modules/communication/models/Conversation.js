// backend/src/modules/communication/models/Conversation.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Conversation {
  static tableName = 'conversations';

  static async create(conversationData, schoolId) {
    const [conversation] = await db(this.tableName)
      .insert({
        ...conversationData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return conversation;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getUserConversations(userId, schoolId, limit = 20) {
    return await db(this.tableName)
      .select([
        'conversations.*',
        'users.first_name as initiated_by_first_name',
        'users.last_name as initiated_by_last_name'
      ])
      .join('users', 'conversations.initiated_by', 'users.id')
      .where('conversations.school_id', schoolId)
      .where('conversations.is_active', true)
      .whereRaw('? = ANY(participants::jsonb)', [userId])
      .orderBy('conversations.last_message_at', 'desc')
      .limit(limit);
  }

  static async createDirectConversation(user1Id, user2Id, title, schoolId) {
    // Check if conversation already exists
    const existing = await db(this.tableName)
      .where('school_id', schoolId)
      .where('type', 'direct')
      .whereRaw('participants::jsonb ?& array[?, ?]', [user1Id, user2Id])
      .first();

    if (existing) {
      return existing;
    }

    return await this.create({
      title: title,
      type: 'direct',
      initiated_by: user1Id,
      participants: [user1Id, user2Id],
      last_message_at: new Date()
    }, schoolId);
  }

  static async createGroupConversation(title, participants, metadata, initiatedBy, schoolId) {
    return await this.create({
      title: title,
      type: 'group',
      initiated_by: initiatedBy,
      participants: participants,
      metadata: metadata,
      last_message_at: new Date()
    }, schoolId);
  }
}

module.exports = Conversation;