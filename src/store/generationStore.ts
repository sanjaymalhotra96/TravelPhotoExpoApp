/**
 * generationStore.ts
 *
 * A simple module-level singleton to pass generation parameters between screens
 * WITHOUT going through Expo Router navigation params.
 *
 * WHY: ImagePicker URIs contain path separators (/ from %2F decoding) that Expo Router
 * misinterprets as route path segments, truncating the URI and causing FileSystem errors.
 * Storing in JS module memory bypasses URL encoding entirely.
 */

interface GenerationParams {
  imageUri: string;   // User's uploaded photo — full local file URI, never truncated
  templateId: string; // Selected travel template ID
}

let _params: GenerationParams | null = null;

/** Call this before navigating to /generate/polling */
export const setGenerationParams = (params: GenerationParams): void => {
  _params = { ...params };
  if (__DEV__) {
    console.log('[generationStore] Params stored:', {
      templateId: params.templateId,
      imageUri: params.imageUri,
    });
  }
};

/** Call this in the polling screen to retrieve the stored params */
export const getGenerationParams = (): GenerationParams | null => {
  return _params;
};

/** Call this after generation completes to free memory */
export const clearGenerationParams = (): void => {
  _params = null;
};
