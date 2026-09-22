import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import followUpsApi from '../api/followups';

export const useFollowUps = (filters?: any) => {
  return useQuery({
    queryKey: ['followups', filters],
    queryFn: () => followUpsApi.getAll(filters),
  });
};

export const useFollowUp = (id: string) => {
  return useQuery({
    queryKey: ['followup', id],
    queryFn: () => followUpsApi.getById(id),
    enabled: !!id,
  });
};

export const useTodayFollowUps = () => {
  return useQuery({
    queryKey: ['followups', 'today'],
    queryFn: followUpsApi.getToday,
  });
};

export const useOverdueeFollowUps = () => {
  return useQuery({
    queryKey: ['followups', 'overdue'],
    queryFn: followUpsApi.getOverdue,
  });
};

export const useCreateFollowUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: followUpsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });
};

export const useUpdateFollowUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      followUpsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });
};

export const useDeleteFolloUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: followUpsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });
};
