import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../controllers/notifications.js';

const router = Router();

router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.get('/:id', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.get('/', getNotifications);

export default router;
