// backend/src/modules/communication/models/Message.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Message {
  static tableName = 'messages';

  static async create(messageData, schoolId) {
    const [message] = await db(this.tableName)
      .insert({
        ...messageData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        conversation_id: messageData.conversation_id || crypto.randomUUID()
      })
      .returning('*');
    return message;
  }

  static async findById(id, schoolId) {
    return await db(this.tableName)
      .where({ id, school_id: schoolId })
      .first();
  }

  static async getConversation(conversationId, schoolId, limit = 50, offset = 0) {
    const messages = await db(this.tableName)
      .select([
        'messages.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name'
      ])
      .join('users', 'messages.sender_id', 'users.id')
      .where('messages.conversation_id', conversationId)
      .where('messages.school_id', schoolId)
      .orderBy('messages.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return messages.reverse(); // Show oldest first
  }

  static async getUserMessages(userId, schoolId, options = {}) {
    const { limit = 20, offset = 0, message_type } = options;

    let query = db(this.tableName)
      .select([
        'messages.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name',
        'message_recipients.status as recipient_status',
        'message_recipients.read_at'
      ])
      .join('message_recipients', 'messages.id', 'message_recipients.message_id')
      .join('users', 'messages.sender_id', 'users.id')
      .where('message_recipients.recipient_id', userId)
      .where('messages.school_id', schoolId);

    if (message_type) {
      query = query.where('messages.message_type', message_type);
    }

    return await query
      .orderBy('messages.created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async addRecipients(messageId, recipients) {
    const recipientInserts = recipients.map(recipient => ({
      id: crypto.randomUUID(),
      message_id: messageId,
      recipient_id: recipient.user_id,
      recipient_type: recipient.type || 'to'
    }));

    await db('message_recipients').insert(recipientInserts);
  }

  static async markAsRead(messageId, userId) {
    await db('message_recipients')
      .where({ message_id: messageId, recipient_id: userId })
      .update({
        status: 'read',
        read_at: new Date()
      });
  }

  static async sendMessage(messageData, recipients, schoolId) {
    const message = await this.create({
      ...messageData,
      status: 'sent',
      sent_at: new Date()
    }, schoolId);

    await this.addRecipients(message.id, recipients);

    // Update conversation
    if (messageData.conversation_id) {
      await db('conversations')
        .where({ id: messageData.conversation_id })
        .update({ last_message_at: new Date() });
    }

    return message;
  }

  static async broadcastMessage(messageData, targetAudience, schoolId) {
    // Get recipients based on target audience
    let recipients = [];
    
    if (targetAudience.roles) {
      const roleUsers = await db('users')
        .select('users.id')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('users.school_id', schoolId)
        .whereIn('roles.name', targetAudience.roles);
      
      recipients = roleUsers.map(u => ({ user_id: u.id, type: 'to' }));
    }

    if (targetAudience.classes) {
      const classUsers = await db('users')
        .select('users.id')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('users.school_id', schoolId)
        .where('roles.name', 'parent')
        .whereExists(function() {
          this.select('*')
            .from('students')
            .whereRaw('students.user_id = users.id')
            .whereIn('students.class_id', targetAudience.classes);
        });
      
      recipients.push(...classUsers.map(u => ({ user_id: u.id, type: 'to' })));
    }

    return await this.sendMessage({
      ...messageData,
      message_type: 'broadcast'
    }, recipients, schoolId);
  }
}

module.exports = Message;