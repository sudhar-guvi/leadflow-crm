import { Response } from 'express';
import { NotificationModel } from '../data/models-notification.js';
import { Notification, PaginatedResult } from '../models/index.js';

// Convert to JSON
const notificationToJson = (doc: any): Notification => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  type: doc.type,
  title: doc.title,
  message: doc.message,
  relatedLeadId: doc.relatedLeadId,
  relatedPaymentId: doc.relatedPaymentId,
  relatedFollowUpId: doc.relatedFollowUpId,
  isRead: doc.isRead,
  priority: doc.priority,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
});

// Get all notifications
export const getNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    
    const query: any = {};
    if (unreadOnly === 'true') query.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await NotificationModel.countDocuments(query);
    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get unread count
    const unreadCount = await NotificationModel.countDocuments({ isRead: false });

    res.json({
      data: notifications.map(notificationToJson),
      total,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(notificationToJson(notification));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    await NotificationModel.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Get unread count
export const getUnreadCount = async (req: any, res: Response): Promise<void> => {
  try {
    const count = await NotificationModel.countDocuments({ isRead: false });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
