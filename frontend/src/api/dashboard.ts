import apiClient from '../lib/api';
import { DashboardSummary } from '../types';

export interface LeadStatusReport {
  status: string;
  count: number;
  amount: number;
}

export interface RevenueReport {
  month: string;
  revenue: number;
  conversions: number;
}

export interface BDPerformanceReport {
  bdId: string;
  bdName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
}

export interface SourceDistributionReport {
  source: string;
  count: number;
  convertedCount: number;
  conversionRate: number;
  revenue: number;
}

export interface CoursePopularityReport {
  courseId: string;
  courseName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },
};

export const reportsApi = {
  getLeadStatusReport: async (): Promise<LeadStatusReport[]> => {
    const response = await apiClient.get('/reports/lead-status');
    return response.data;
  },

  getBDPerformanceReport: async (): Promise<BDPerformanceReport[]> => {
    const response = await apiClient.get('/reports/bd-performance');
    return response.data;
  },

  getRevenueReport: async (): Promise<RevenueReport[]> => {
    const response = await apiClient.get('/reports/revenue');
    return response.data;
  },

  getSourceDistribution: async (): Promise<SourceDistributionReport[]> => {
    const response = await apiClient.get('/reports/source-distribution');
    return response.data;
  },

  getCoursePopularity: async (): Promise<CoursePopularityReport[]> => {
    const response = await apiClient.get('/reports/course-popularity');
    return response.data;
  },
};
