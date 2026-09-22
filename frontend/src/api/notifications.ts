import apiClient from '../lib/api';
import { Notification, PaginatedResult } from '../types';

export const notificationsApi = {
  getAll: async (page = 1, limit = 20, unreadOnly = false): Promise<PaginatedResult<Notification> & { unreadCount: number }> => {
    const response = await apiClient.get('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },
};

export default notificationsApi;
