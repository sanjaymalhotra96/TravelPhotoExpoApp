import { useQuery } from '@tanstack/react-query';
import { CONFIG, MOCK_GENERATED_IMAGES, API_CONFIG } from '../constants';
import { mockJobsMap } from './useGenerateImage';


export interface JobStatusDetails {
  id: string;
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;   // Final generated image URL
  templateUrl?: string; // Template background URL (used in mock result preview)
  error?: string;
}

export const useJobStatus = (jobId: string | null) => {
  return useQuery<JobStatusDetails, Error>({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');

      // ── MOCK MODE ────────────────────────────────────────────────────────
      if (CONFIG.USE_MOCK_API) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const job = mockJobsMap[jobId];
        if (!job) throw new Error(`Job ${jobId} not registered in mock store`);

        // Simulate progress across polling calls
        job.calls += 1;

        if (job.calls === 1) {
          job.status = 'pending';
          job.progress = 20;
        } else if (job.calls === 2) {
          job.status = 'processing';
          job.progress = 50;
        } else if (job.calls === 3) {
          job.status = 'processing';
          job.progress = 80;
        } else {
          job.status = 'completed';
          job.progress = 100;
        }

        const details: JobStatusDetails = {
          id: jobId,
          templateId: job.templateId,
          status: job.status,
          progress: job.progress,
          templateUrl: job.templateUrl,
        };

        if (job.status === 'completed') {
          // resultUrl = user's actual uploaded imageUri in mock mode
          // This is shown as the face in the result screen overlay
          details.resultUrl = job.imageUri
            ?? MOCK_GENERATED_IMAGES[job.templateId]
            ?? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800';
        }

        console.log(`[useJobStatus] Mock poll for ${jobId}:`, {
          calls: job.calls,
          status: details.status,
          progress: details.progress,
          resultUrl: details.resultUrl,
        });

        return details;
      }

      // ── REAL AI MODE — job was pre-completed inside useGenerateImage ────
      // When Replicate finishes, the result is registered in mockJobsMap immediately.
      // We just return it here — we never need to call the non-existent backend.
      if (CONFIG.USE_REAL_AI) {
        const completedJob = mockJobsMap[jobId];
        if (completedJob && completedJob.status === 'completed') {
          console.log(`[useJobStatus] Real AI job ${jobId} is pre-completed, returning result.`);
          return {
            id: jobId,
            templateId: completedJob.templateId,
            status: 'completed' as const,
            progress: 100,
            resultUrl: completedJob.imageUri,
            templateUrl: completedJob.templateUrl,
          };
        }
        // Still processing (shouldn't happen since hook blocks until done)
        return {
          id: jobId,
          templateId: '',
          status: 'processing' as const,
          progress: 50,
        };
      }

      // ── Fallback: never reached in current config ────────────────────────
      throw new Error('Unexpected code path in useJobStatus');

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
