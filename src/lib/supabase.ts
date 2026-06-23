import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_CONFIG } from '@/constants';

import { Platform } from 'react-native';

// Implement custom secure storage adapter using expo-secure-store, fallback to localStorage on web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('SecureStore.getItemAsync error', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('SecureStore.setItemAsync error', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('SecureStore.deleteItemAsync error', e);
    }
  },
};

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Uploads a local file URI to a Supabase Storage bucket and returns its public URL.
 * Used if the generation backend requires a pre-uploaded image URL instead of direct form-data.
 */
export const uploadImageToSupabase = async (
  imageUri: string,
  bucketName = 'portraits'
): Promise<string> => {
  try {
    if (__DEV__) {
      console.log(`[supabase.storage] Uploading image: ${imageUri} to bucket: ${bucketName}`);
    }

    const filename = `${Date.now()}_${imageUri.split('/').pop() || 'photo.jpg'}`;
    
    // Fetch local file URI and convert to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filename, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    if (__DEV__) {
      console.log('[supabase.storage] Upload successful. Public URL:', publicUrlData.publicUrl);
    }

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('[supabase.storage] Upload error:', err);
    throw new Error(`Supabase Storage upload failed: ${err.message || err}`);
  }
};

