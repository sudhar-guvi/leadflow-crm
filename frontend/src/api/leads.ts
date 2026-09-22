import apiClient from '../lib/api';
import { Lead, PaginatedResult } from '../types';

export interface LeadFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  source?: string;
  bdId?: string;
  courseId?: string;
  search?: string;
}

export const leadsApi = {
  getAll: async (filters?: LeadFilters): Promise<PaginatedResult<Lead>> => {
    const response = await apiClient.get('/leads', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Lead> => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.post('/leads', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.patch(`/leads/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },
};

export default leadsApi;
