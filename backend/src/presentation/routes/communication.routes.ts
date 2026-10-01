import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { communicationService } from '../../application/services/settings.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get('/announcements', authorize(...STAFF_ROLES, UserRole.PARENT, UserRole.STUDENT), asyncHandler(async (req, res) => {
  const announcements = await communicationService.getAnnouncements(req.user!.schoolId!);
  res.json({ success: true, data: announcements });
}));

router.post(
  '/announcements',
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  [body('title').notEmpty(), body('content').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const announcement = await communicationService.createAnnouncement(
      req.user!.schoolId!,
      req.user!.userId,
      req.body
    );
    res.status(201).json({ success: true, data: announcement });
  })
);

router.put(
  '/announcements/:id',
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const announcement = await communicationService.updateAnnouncement(
      getRouteParam(req.params.id),
      req.user!.schoolId!,
      req.body
    );
    res.json({ success: true, data: announcement });
  })
);

router.delete(
  '/announcements/:id',
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const result = await communicationService.deleteAnnouncement(getRouteParam(req.params.id), req.user!.schoolId!);
    res.json({ success: true, ...result });
  })
);

router.get('/messages', asyncHandler(async (req, res) => {
  const type = (req.query.type as 'inbox' | 'sent') || 'inbox';
  const messages = await communicationService.getMessages(req.user!.userId, type);
  res.json({ success: true, data: messages });
}));

router.post(
  '/messages',
  [body('receiverId').notEmpty(), body('content').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const message = await communicationService.sendMessage(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: message });
  })
);

router.get('/notifications', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await communicationService.getNotifications(req.user!.userId, unreadOnly);
  res.json({ success: true, data: notifications });
}));

router.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  await communicationService.markNotificationRead(getRouteParam(req.params.id), req.user!.userId);
  res.json({ success: true, message: 'Notification marked as read' });
}));

export default router;
