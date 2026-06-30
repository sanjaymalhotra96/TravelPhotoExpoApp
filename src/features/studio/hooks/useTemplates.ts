import { useQuery } from '@tanstack/react-query';
import { TravelTemplate } from '@/constants';
import { studioRepository } from '../services/studioRepository';

export const useTemplates = () => {
  return useQuery<TravelTemplate[], Error>({
    queryKey: ['templates'],
    queryFn: async () => {
      return studioRepository.getTemplates();
    },
    staleTime: 5 * 60 * 1000,
  });
};
