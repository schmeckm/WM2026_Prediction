const express = require('express');
const { sendError, translate } = require('../utils/apiResponse');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (error) {
    sendError(res, req, 500, 'errors.notificationsLoadFailed');
  }
});

router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) return sendError(res, req, 404, 'errors.notificationNotFound');
    res.json(notification);
  } catch (error) {
    sendError(res, req, 500, 'errors.notificationMarkFailed');
  }
});

router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'Alle Benachrichtigungen gelesen.' });
  } catch (error) {
    sendError(res, req, 500, 'errors.notificationMarkFailed');
  }
});

router.post('/admin/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { validateNotificationPayload } = require('../utils/notificationValidation');
    const { sendAdminAnnouncement } = require('../services/adminAnnouncementService');
    const { logAudit } = require('../services/auditService');
    const validation = validateNotificationPayload(req.body);
    if (!validation.valid) {
      return sendError(res, req, 400, 'errors.requiredFields');
    }

    const result = await sendAdminAnnouncement(validation.sanitized);
    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_ANNOUNCEMENT_SEND',
      newValue: {
        title: validation.sanitized.title,
        recipientCount: result.recipientCount,
        inAppSent: result.inAppSent,
        emailsSent: result.emailsSent,
        emailsSkipped: result.emailsSkipped,
        userId: validation.sanitized.userId,
      },
      req,
    });

    res.json({
      message: translate(req, 'messages.adminAnnouncementSent', result),
      ...result,
    });
  } catch (error) {
    if (error.code === 'no_delivery_channel') {
      return sendError(res, req, 400, 'errors.announcementNoChannel');
    }
    if (error.code === 'no_recipients') {
      return sendError(res, req, 400, 'errors.announcementNoRecipients');
    }
    sendError(res, req, 500, 'errors.sendFailed');
  }
});

module.exports = router;
