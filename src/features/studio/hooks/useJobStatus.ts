import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@/constants';
import { studioRepository } from '../services/studioRepository';

export interface JobStatusDetails {
  id: string;
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  templateUrl?: string;
  error?: string;
}

export const useJobStatus = (jobId: string | null) => {
  return useQuery<JobStatusDetails, Error>({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      return studioRepository.getJobStatus(jobId);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'completed' || data.status === 'failed')) {
        return false; // stop polling
      }
      return jobId ? API_CONFIG.POLLING_INTERVAL : false;
    },
  });
};
