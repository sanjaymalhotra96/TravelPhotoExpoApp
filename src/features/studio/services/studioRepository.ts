import { TravelTemplate, CONFIG, MOCK_TEMPLATES, REPLICATE_CONFIG, MOCK_GENERATED_IMAGES } from '@/constants';
import { apiClient } from '@/shared/services/apiClient';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface IStudioRepository {
  getTemplates(): Promise<TravelTemplate[]>;
  getTemplateById(id: string): Promise<TravelTemplate>;
  submitGeneration(templateId: string, imageUri: string): Promise<{ jobId: string; resultUrl?: string }>;
  getJobStatus(jobId: string): Promise<{
    id: string;
    templateId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    resultUrl?: string;
    templateUrl?: string;
    error?: string;
  }>;
}

// Map for tracking active mock and real generation jobs in background
export const mockJobsMap: Record<string, {
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  calls: number;
  imageUri?: string;
  templateUrl?: string;
}> = {};

// Helper to convert local image uri to base64
const localUriToBase64DataUrl = async (rawUri: string): Promise<string> => {
  console.log('[StudioRepository] Converting image to base64. Raw URI:', rawUri);
  const extMatch = rawUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
  };
  const mime = mimeMap[extMatch] ?? 'image/jpeg';
  const ext = mime === 'image/jpeg' ? 'jpg' : extMatch;

  const stablePath = `${FileSystem.cacheDirectory}ai_portrait_${Date.now()}.${ext}`;
  const decodedUri = decodeURIComponent(rawUri);

  try {
    await FileSystem.copyAsync({ from: decodedUri, to: stablePath });
  } catch (e1) {
    try {
      await FileSystem.copyAsync({ from: rawUri, to: stablePath });
    } catch (e2) {
      throw new Error(`Could not read the selected image file. Stable path: ${stablePath}`);
    }
  }

  const base64String = await FileSystem.readAsStringAsync(stablePath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  FileSystem.deleteAsync(stablePath, { idempotent: true }).catch(() => {});
  return `data:${mime};base64,${base64String}`;
};

// Helper to poll Replicate AI predictions status
const pollReplicatePrediction = async (predictionId: string, apiKey: string, maxAttempts = 40): Promise<string> => {
  console.log(`[StudioRepository] Polling Replicate prediction: ${predictionId}`);
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`Replicate poll HTTP ${res.status}: ${await res.text()}`);
    }
    const prediction = await res.json();
    if (prediction.status === 'succeeded') {
      const output = prediction.output;
      const resultUrl = Array.isArray(output) ? output[0] : output;
      if (!resultUrl) throw new Error('Replicate succeeded but returned no output URL');
      return resultUrl as string;
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error ?? 'Unknown error'}`);
    }
  }
  throw new Error('AI generation timed out. Please try again.');
};

export class StudioRepository implements IStudioRepository {
  async getTemplates(): Promise<TravelTemplate[]> {
    if (CONFIG.USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_TEMPLATES;
    }
    const response = await apiClient.get<TravelTemplate[]>('/templates');
    return response.data;
  }

  async getTemplateById(id: string): Promise<TravelTemplate> {
    if (CONFIG.USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const template = MOCK_TEMPLATES.find((t) => t.id === id);
      if (!template) throw new Error(`Template ${id} not found`);
      return template;
    }
    const response = await apiClient.get<TravelTemplate>(`/templates/${id}`);
    return response.data;
  }

  async submitGeneration(templateId: string, imageUri: string): Promise<{ jobId: string; resultUrl?: string }> {
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const template = MOCK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) throw new Error(`Template "${templateId}" not found in MOCK_TEMPLATES.`);

    if (!CONFIG.USE_REAL_AI) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      mockJobsMap[jobId] = {
        templateId,
        status: 'pending',
        progress: 0,
        calls: 0,
        imageUri,
        templateUrl: template.coverUrl,
      };
      return { jobId };
    }

    const apiKey = REPLICATE_CONFIG.API_KEY;
    if (!apiKey) {
      throw new Error('Replicate API key missing.\n\nAdd EXPO_PUBLIC_REPLICATE_API_KEY=r8_your_key to your .env file, then restart Expo.');
    }

    const userPhotoDataUrl = await localUriToBase64DataUrl(imageUri);
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: REPLICATE_CONFIG.FACE_SWAP_MODEL,
        input: {
          swap_image: userPhotoDataUrl,
          input_image: template.coverUrl,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Replicate API error (${createRes.status}): ${errText}`);
    }

    const prediction = await createRes.json();
    const resultUrl = await pollReplicatePrediction(prediction.id, apiKey);

    mockJobsMap[jobId] = {
      templateId,
      status: 'completed',
      progress: 100,
      calls: 99,
      imageUri: resultUrl,
      templateUrl: template.coverUrl,
    };

    return { jobId, resultUrl };
  }

  async getJobStatus(jobId: string) {
    if (CONFIG.USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const job = mockJobsMap[jobId];
      if (!job) throw new Error(`Job ${jobId} not registered in mock store`);

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

      const resultUrl = job.status === 'completed'
        ? (job.imageUri ?? MOCK_GENERATED_IMAGES[job.templateId] ?? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800')
        : undefined;

      return {
        id: jobId,
        templateId: job.templateId,
        status: job.status,
        progress: job.progress,
        resultUrl,
        templateUrl: job.templateUrl,
      };
    }

    if (CONFIG.USE_REAL_AI) {
      const completedJob = mockJobsMap[jobId];
      if (completedJob && completedJob.status === 'completed') {
        return {
          id: jobId,
          templateId: completedJob.templateId,
          status: 'completed' as const,
          progress: 100,
          resultUrl: completedJob.imageUri,
          templateUrl: completedJob.templateUrl,
        };
      }
      return {
        id: jobId,
        templateId: '',
        status: 'processing' as const,
        progress: 50,
      };
    }

    throw new Error('Unexpected code path in useJobStatus');
  }
}

export const studioRepository = new StudioRepository();
