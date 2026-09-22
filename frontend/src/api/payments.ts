import apiClient from '../lib/api';
import { Payment, PaginatedResult } from '../types';

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsApi = {
  getAll: async (filters?: PaymentFilters): Promise<PaginatedResult<Payment>> => {
    const response = await apiClient.get('/payments', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.post('/payments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.patch(`/payments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
  },
};

export default paymentsApi;
