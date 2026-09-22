import apiClient from '../lib/api';
import { Course, PaginatedResult } from '../types';

export const coursesApi = {
  getAll: async (page = 1, limit = 20, activeOnly = true): Promise<PaginatedResult<Course>> => {
    const response = await apiClient.get('/courses', {
      params: { page, limit, activeOnly },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.patch(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/courses/categories');
    return response.data;
  },
};

export default coursesApi;
