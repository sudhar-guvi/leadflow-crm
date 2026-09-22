import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import coursesApi from '../api/courses';

export const useCourses = (activeOnly = true) => {
  return useQuery({
    queryKey: ['courses', activeOnly],
    queryFn: () => coursesApi.getAll(1, 100, activeOnly),
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getById(id),
    enabled: !!id,
  });
};

export const useCourseCategories = () => {
  return useQuery({
    queryKey: ['courses', 'categories'],
    queryFn: coursesApi.getCategories,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: coursesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
