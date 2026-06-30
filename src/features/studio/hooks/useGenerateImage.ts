import { useMutation } from '@tanstack/react-query';
import { studioRepository } from '../services/studioRepository';

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
      return studioRepository.submitGeneration(templateId, imageUri);
    },
  });
};
