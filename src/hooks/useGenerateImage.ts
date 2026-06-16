import { useMutation } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { CONFIG, REPLICATE_CONFIG, MOCK_TEMPLATES } from '../constants';

export interface GenerateImageParams {
  imageUri: string;   // User's uploaded portrait (local file URI on device)
  templateId: string; // Selected travel template ID
}

export interface GenerateImageResponse {
  jobId: string;
  resultUrl?: string; // Populated immediately in real Replicate mode
}

// ─── Mock Job Store ──────────────────────────────────────────────────────────
// Holds state for the polling screen when running in mock mode
export const mockJobsMap: Record<string, {
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  calls: number;
  imageUri?: string;    // User's original uploaded photo URI
  templateUrl?: string; // Travel template background image URL
}> = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts a local device file URI to a base64 data URL.
 *
 * WHY WE COPY FIRST:
 * Expo ImagePicker returns URIs with special characters (%40, %2F, etc.) in the path.
 * When passed through Expo Router navigation params (URL query strings), these get
 * double-encoded, making the path unresolvable by FileSystem.readAsStringAsync.
 * Copying to cacheDirectory with a clean filename sidesteps this entirely.
 */
const localUriToBase64DataUrl = async (rawUri: string): Promise<string> => {
  console.log('[AI] Converting image to base64. Raw URI:', rawUri);

  // Detect extension for MIME type
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

  // Step 1: Copy the image to a stable, clean path in cacheDirectory
  // This avoids all URL-encoding/decoding issues from navigation params
  const stablePath = `${FileSystem.cacheDirectory}ai_portrait_${Date.now()}.${ext}`;

  // Try decoded URI first (handles double-encoded paths from Expo Router)
  let copySucceeded = false;
  const decodedUri = decodeURIComponent(rawUri);

  try {
    console.log('[AI] Copying from decoded URI:', decodedUri);
    await FileSystem.copyAsync({ from: decodedUri, to: stablePath });
    copySucceeded = true;
  } catch (e1) {
    console.warn('[AI] Decoded URI copy failed, trying original URI...');
    try {
      await FileSystem.copyAsync({ from: rawUri, to: stablePath });
      copySucceeded = true;
    } catch (e2) {
      console.error('[AI] Both URI copies failed:', e1, e2);
      throw new Error(
        `Could not read the selected image file.\n\nPlease try selecting the photo again.\n\nURI: ${rawUri}`
      );
    }
  }

  if (!copySucceeded) {
    throw new Error('Failed to copy image to stable path.');
  }

  // Step 2: Read from the stable clean path
  console.log('[AI] Reading base64 from stable path:', stablePath);
  const base64String = await FileSystem.readAsStringAsync(stablePath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Step 3: Clean up the temp copy
  FileSystem.deleteAsync(stablePath, { idempotent: true }).catch(() => {});

  const dataUrl = `data:${mime};base64,${base64String}`;
  console.log(`[AI] Base64 ready — MIME: ${mime}, size: ${Math.round(dataUrl.length / 1024)}KB`);
  return dataUrl;
};

/**

 * Polls a Replicate prediction until it completes or fails.
 * Replicate models run async — we poll every 2s until succeeded/failed.
 */
const pollReplicatePrediction = async (
  predictionId: string,
  apiKey: string,
  maxAttempts = 40 // 40 × 2s = 80s max
): Promise<string> => {
  console.log(`[AI] Polling Replicate prediction: ${predictionId}`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Replicate poll HTTP ${res.status}: ${await res.text()}`);
    }

    const prediction = await res.json();
    console.log(`[AI] Poll #${i + 1} — status: ${prediction.status}`);

    if (prediction.status === 'succeeded') {
      // Output can be a string or an array of strings
      const output = prediction.output;
      const resultUrl = Array.isArray(output) ? output[0] : output;
      if (!resultUrl) throw new Error('Replicate succeeded but returned no output URL');
      console.log('[AI] Generation complete! Result URL:', resultUrl);
      return resultUrl as string;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(
        `Replicate prediction ${prediction.status}: ${prediction.error ?? 'Unknown error'}`
      );
    }
    // status is 'starting' or 'processing' — continue polling
  }

  throw new Error('AI generation timed out. Please try again.');
};

// ─── Main Hook ───────────────────────────────────────────────────────────────
export const useGenerateImage = () => {
  return useMutation<GenerateImageResponse, Error, GenerateImageParams>({
    mutationFn: async ({ imageUri, templateId }) => {
      const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      console.log('[useGenerateImage] ─────────────────────────────────');
      console.log('[useGenerateImage] templateId :', templateId);
      console.log('[useGenerateImage] imageUri   :', imageUri);
      console.log('[useGenerateImage] mode       :', CONFIG.USE_REAL_AI ? '🤖 REAL AI (Replicate)' : '🎭 MOCK');
      console.log('[useGenerateImage] ─────────────────────────────────');

      // Find template metadata (needed in both modes)
      const template = MOCK_TEMPLATES.find((t) => t.id === templateId);
      if (!template) throw new Error(`Template "${templateId}" not found in MOCK_TEMPLATES.`);

      // ── MOCK MODE ────────────────────────────────────────────────────────
      if (!CONFIG.USE_REAL_AI) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        mockJobsMap[jobId] = {
          templateId,
          status: 'pending',
          progress: 0,
          calls: 0,
          imageUri,                    // user's actual uploaded photo (used in result preview)
          templateUrl: template.coverUrl, // travel scene background
        };

        console.log('[useGenerateImage] Mock job registered:', jobId);
        return { jobId };
      }

      // ── REAL AI MODE (Replicate face-swap) ──────────────────────────────
      const apiKey = REPLICATE_CONFIG.API_KEY;
      if (!apiKey) {
        throw new Error(
          'Replicate API key missing.\n\nAdd EXPO_PUBLIC_REPLICATE_API_KEY=r8_your_key to your .env file, then restart Expo with: npx expo start -c'
        );
      }

      // Step 1: Convert user's local photo to base64 data URL
      // (Replicate accepts data URIs or public URLs — local files must be base64-encoded)
      const userPhotoDataUrl = await localUriToBase64DataUrl(imageUri);

      // Step 2: Create the Replicate face-swap prediction
      // Model: codeplugtech/face-swap
      //   swap_image  = SOURCE face (user's uploaded photo) → identity to transfer
      //   input_image  = TARGET scene (template background) → where the face is placed
      console.log('[AI] Creating Replicate prediction...');
      console.log('[AI]   swap_image  = user photo (base64, local)');
      console.log('[AI]   input_image = template:', template.coverUrl);

      const createRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: REPLICATE_CONFIG.FACE_SWAP_MODEL,
          input: {
            swap_image: userPhotoDataUrl,   // user's face (source identity)
            input_image: template.coverUrl, // travel scene (where face is inserted)
          },
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error('[AI] Create prediction failed:', createRes.status, errText);
        throw new Error(`Replicate API error (${createRes.status}): ${errText}`);
      }

      const prediction = await createRes.json();
      console.log('[AI] Prediction created:', { id: prediction.id, status: prediction.status });

      // Step 3: Poll until the model finishes generating
      const resultUrl = await pollReplicatePrediction(prediction.id, apiKey);

      // Step 4: Register completed job in the map for useJobStatus to pick up
      mockJobsMap[jobId] = {
        templateId,
        status: 'completed',
        progress: 100,
        calls: 99,
        imageUri: resultUrl,         // final AI-generated image URL
        templateUrl: template.coverUrl,
      };

      return { jobId, resultUrl };
    },
  });
};
