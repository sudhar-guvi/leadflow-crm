import apiClient from '../lib/api';
import { FollowUp, PaginatedResult } from '../types';

export interface FollowUpFilters {
  page?: number;
  limit?: number;
  status?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}

export const followUpsApi = {
  getAll: async (filters?: FollowUpFilters): Promise<PaginatedResult<FollowUp>> => {
    const response = await apiClient.get('/followups', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<FollowUp> => {
    const response = await apiClient.get(`/followups/${id}`);
    return response.data;
  },

  getToday: async (): Promise<FollowUp[]> => {
    const response = await apiClient.get('/followups/today');
    return response.data;
  },

  getOverdue: async (): Promise<FollowUp[]> => {
    const response = await apiClient.get('/followups/overdue');
    return response.data;
  },

  create: async (data: Partial<FollowUp>): Promise<FollowUp> => {
    const response = await apiClient.post('/followups', data);
    return response.data;
  },

  update: async (id: string, data: Partial<FollowUp>): Promise<FollowUp> => {
    const response = await apiClient.patch(`/followups/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/followups/${id}`);
  },
};

export default followUpsApi;
