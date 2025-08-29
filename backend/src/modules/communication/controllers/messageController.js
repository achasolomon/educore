// backend/src/modules/communication/controllers/messageController.js
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const NotificationService = require('../services/notificationService');
const db = require('../../../core/database/connection');

class MessageController {
  // Get user's conversations
  static async getConversations(req, res) {
    try {
      const userId = req.user.userId;
      const schoolId = req.user.schoolId;
      const { limit = 20 } = req.query;

      const conversations = await Conversation.getUserConversations(userId, schoolId, limit);

      res.json({
        success: true,
        data: { conversations }
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ success: false, message: 'Error fetching conversations' });
    }
  }

  // Get messages in a conversation
  static async getConversationMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const schoolId = req.user.schoolId;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await Message.getConversation(conversationId, schoolId, limit, offset);

      res.json({
        success: true,
        data: { messages }
      });

    } catch (error) {
      console.error('Get conversation messages error:', error);
      res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
  }

  // Send a direct message
  static async sendMessage(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const senderId = req.user.userId;
      const { recipients, subject, content, conversationId } = req.body;

      if (!recipients || !recipients.length || !subject || !content) {
        return res.status(400).json({
          success: false,
          message: 'Recipients, subject, and content are required'
        });
      }

      const messageData = {
        sender_id: senderId,
        conversation_id: conversationId,
        subject,
        content,
        message_type: 'direct'
      };

      const message = await Message.sendMessage(messageData, recipients, schoolId);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ success: false, message: 'Error sending message' });
    }
  }

  // Create a new conversation
  static async createConversation(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.userId;
      const { title, type, participants, metadata } = req.body;

      if (!title || !type || !participants || !participants.length) {
        return res.status(400).json({
          success: false,
          message: 'Title, type, and participants are required'
        });
      }

      // Ensure current user is in participants
      if (!participants.includes(userId)) {
        participants.push(userId);
      }

      const conversation = await Conversation.create({
        title,
        type,
        initiated_by: userId,
        participants,
        metadata: metadata || {},
        last_message_at: new Date()
      }, schoolId);

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: { conversation }
      });

    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ success: false, message: 'Error creating conversation' });
    }
  }

  // Mark message as read
  static async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      await Message.markAsRead(messageId, userId);

      res.json({
        success: true,
        message: 'Message marked as read'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ success: false, message: 'Error marking message as read' });
    }
  }

  // Get user's inbox
  static async getInbox(req, res) {
    try {
      const userId = req.user.userId;
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, message_type } = req.query;
      const offset = (page - 1) * limit;

      const messages = await Message.getUserMessages(userId, schoolId, {
        limit: parseInt(limit),
        offset,
        message_type
      });

      res.json({
        success: true,
        data: { messages }
      });

    } catch (error) {
      console.error('Get inbox error:', error);
      res.status(500).json({ success: false, message: 'Error fetching inbox' });
    }
  }
}

module.exports = MessageController;