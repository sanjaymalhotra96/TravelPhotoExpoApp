import { useMutation } from '@tanstack/react-query';
import { dashboardRepository } from '@/features/dashboard/services/dashboardRepository';

export interface GenerateImageParams {
  imageUri: string;
  templateId: string;
}

export interface GenerateImageResponse {
  jobId: string;
  resultUrl?: string;
}

export const useGenerateImage = () => {
  return useMutation<GenerateImageResponse, Error, GenerateImageParams>({
    mutationFn: async ({ imageUri, templateId }) => {
      return dashboardRepository.submitGeneration(templateId, imageUri);
    },
  });
};
