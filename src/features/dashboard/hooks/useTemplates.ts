import { useQuery } from '@tanstack/react-query';
import { TravelTemplate } from '@/constants';
import { dashboardRepository } from '@/features/dashboard/services/dashboardRepository';

export const useTemplates = () => {
  return useQuery<TravelTemplate[], Error>({
    queryKey: ['templates'],
    queryFn: async () => {
      return dashboardRepository.getTemplates();
    },
    staleTime: 5 * 60 * 1000,
  });
};
