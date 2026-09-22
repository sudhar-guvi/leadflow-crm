import { useQuery } from '@tanstack/react-query';
import { dashboardApi, reportsApi } from '../api/dashboard';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useReports = () => {
  const leadStatusReport = useQuery({
    queryKey: ['reports', 'lead-status'],
    queryFn: reportsApi.getLeadStatusReport,
  });

  const bdPerformanceReport = useQuery({
    queryKey: ['reports', 'bd-performance'],
    queryFn: reportsApi.getBDPerformanceReport,
  });

  const revenueReport = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: reportsApi.getRevenueReport,
  });

  const sourceDistribution = useQuery({
    queryKey: ['reports', 'source-distribution'],
    queryFn: reportsApi.getSourceDistribution,
  });

  const coursePopularity = useQuery({
    queryKey: ['reports', 'course-popularity'],
    queryFn: reportsApi.getCoursePopularity,
  });

  return {
    leadStatusReport,
    bdPerformanceReport,
    revenueReport,
    sourceDistribution,
    coursePopularity,
  };
};
