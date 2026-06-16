import { useQuery } from '@tanstack/react-query';
import { CONFIG, MOCK_TEMPLATES, TravelTemplate } from '../constants';
import { apiClient } from '../services/api/client';

export const useTemplates = () => {
  return useQuery<TravelTemplate[], Error>({
    queryKey: ['templates'],
    queryFn: async () => {
      if (CONFIG.USE_MOCK_API) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return MOCK_TEMPLATES;
      }
      
      const response = await apiClient.get<TravelTemplate[]>('/templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
