// backend/src/modules/communication/controllers/announcementController.js
const Announcement = require('../models/Announcement');
const NotificationService = require('../services/notificationService');

class AnnouncementController {
  // Get all announcements
  static async getAnnouncements(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        type, 
        page = 1, 
        limit = 20, 
        include_expired = false 
      } = req.query;

      const offset = (page - 1) * limit;

      const announcements = await Announcement.getAllBySchool(schoolId, {
        type,
        limit: parseInt(limit),
        offset,
        include_expired: include_expired === 'true'
      });

      res.json({
        success: true,
        data: { announcements }
      });

    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({ success: false, message: 'Error fetching announcements' });
    }
  }

  // Create announcement
  static async createAnnouncement(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const userId = req.user.userId;
      const {
        title,
        content,
        type,
        priority = 'normal',
        targetAudience,
        publishAt,
        expiresAt,
        isPinned = false
      } = req.body;

      if (!title || !content || !type) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and type are required'
        });
      }

      const announcementData = {
        title,
        content,
        type,
        priority,
        target_audience: targetAudience || { roles: ['parent', 'teacher', 'student'] },
        publish_at: publishAt ? new Date(publishAt) : new Date(),
        expires_at: expiresAt ? new Date(expiresAt) : null,
        is_pinned: isPinned,
        created_by: userId
      };

      const announcement = await Announcement.create(announcementData, schoolId);

      // Auto-publish if publish time is now or in the past
      if (new Date(announcement.publish_at) <= new Date()) {
        await Announcement.publish(announcement.id, schoolId);
        
        // Send notifications
        await NotificationService.notifyAnnouncementPublished(announcement.id, schoolId);
      }

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: { announcement }
      });

    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ success: false, message: 'Error creating announcement' });
    }
  }

  // Get single announcement
  static async getAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const announcement = await Announcement.findById(id, schoolId);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Increment view count
      await Announcement.incrementViewCount(id);

      res.json({
        success: true,
        data: { announcement }
      });

    } catch (error) {
      console.error('Get announcement error:', error);
      res.status(500).json({ success: false, message: 'Error fetching announcement' });
    }
  }

  // Publish announcement
  static async publishAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const announcement = await Announcement.publish(id, schoolId);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Send notifications
      await NotificationService.notifyAnnouncementPublished(id, schoolId);

      res.json({
        success: true,
        message: 'Announcement published successfully',
        data: { announcement }
      });

    } catch (error) {
      console.error('Publish announcement error:', error);
      res.status(500).json({ success: false, message: 'Error publishing announcement' });
    }
  }
}

module.exports = AnnouncementController;
