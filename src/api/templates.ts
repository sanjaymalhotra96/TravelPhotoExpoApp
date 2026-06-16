import { CONFIG, MOCK_TEMPLATES, TravelTemplate } from '../constants';
import { apiClient } from '../services/api/client';

export const templatesApi = {
  getTemplates: async (): Promise<TravelTemplate[]> => {
    if (CONFIG.USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_TEMPLATES;
    }
    const response = await apiClient.get<TravelTemplate[]>('/templates');
    return response.data;
  },

  getTemplateById: async (id: string): Promise<TravelTemplate> => {
    if (CONFIG.USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const template = MOCK_TEMPLATES.find((t) => t.id === id);
      if (!template) throw new Error(`Template ${id} not found`);
      return template;
    }
    const response = await apiClient.get<TravelTemplate>(`/templates/${id}`);
    return response.data;
  },
};
