
// backend/src/modules/communication/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const AnnouncementController = require('../controllers/announcementController');
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

router.use(authMiddleware);

// Messages and conversations
router.get('/conversations', MessageController.getConversations);
router.post('/conversations', MessageController.createConversation);
router.get('/conversations/:conversationId/messages', MessageController.getConversationMessages);
router.post('/messages', MessageController.sendMessage);
router.post('/messages/:messageId/read', MessageController.markAsRead);
router.get('/inbox', MessageController.getInbox);

// Announcements
router.get('/announcements', AnnouncementController.getAnnouncements);
router.post('/announcements', requirePermission('school:manage'), AnnouncementController.createAnnouncement);
router.get('/announcements/:id', AnnouncementController.getAnnouncement);
router.post('/announcements/:id/publish', requirePermission('school:manage'), AnnouncementController.publishAnnouncement);

// Notifications
router.get('/notifications', NotificationController.getNotifications);
router.post('/notifications/send', requirePermission('school:manage'), NotificationController.sendNotification);
router.get('/notification-templates', requirePermission('school:view'), NotificationController.getTemplates);

module.exports = router;