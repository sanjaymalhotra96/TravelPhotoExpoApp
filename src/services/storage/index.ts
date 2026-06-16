import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// We try to initialize MMKV, falling back to null if the native module is missing (e.g. in Expo Go or web)
let storage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({
    id: 'travel-photo-expo-storage',
    encryptionKey: Platform.OS === 'web' ? undefined : 'expo-supabase-secure-cache-key-encrypt',
  });
} catch (e) {
  console.warn('MMKV initialization failed, falling back to local memory and SecureStore/localStorage adapter.', e);
}

// Memory cache for synchronous native reads/writes when MMKV is unavailable
const memoryCache = new Map<string, string>();

const KEYS_TO_PRELOAD = [
  'theme_mode',
  'custom_api_url',
  'auth_session_data',
];

// Preload the memory cache asynchronously from SecureStore/localStorage
const preloadCache = async () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        KEYS_TO_PRELOAD.forEach(key => {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            memoryCache.set(key, val);
          }
        });
      } catch (err) {
        console.error('Failed to preload localStorage keys:', err);
      }
    }
  } else {
    for (const key of KEYS_TO_PRELOAD) {
      try {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) {
          memoryCache.set(key, val);
        }
      } catch (err) {
        console.error(`Failed to preload key ${key} from SecureStore:`, err);
      }
    }
  }
};

// Kick off preloading immediately if MMKV is not active
if (!storage) {
  preloadCache();
}

export const StorageService = {
  getString: (key: string): string | undefined => {
    try {
      if (storage) {
        return storage.getString(key);
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key) || undefined;
        }
        return undefined;
      }
      return memoryCache.get(key);
    } catch (e) {
      console.error(`StorageService.getString error for key ${key}:`, e);
      return undefined;
    }
  },

  setString: (key: string, value: string): void => {
    try {
      if (storage) {
        storage.set(key, value);
        return;
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        memoryCache.set(key, value);
        SecureStore.setItemAsync(key, value).catch(err => {
          console.error(`Failed to write key ${key} asynchronously to SecureStore:`, err);
        });
      }
    } catch (e) {
      console.error(`StorageService.setString error for key ${key}:`, e);
    }
  },

  getBoolean: (key: string, defaultValue = false): boolean => {
    try {
      if (storage) {
        const val = storage.getBoolean(key);
        return val !== undefined ? val : defaultValue;
      }
      const raw = StorageService.getString(key);
      if (raw === undefined) return defaultValue;
      return raw === 'true';
    } catch (e) {
      console.error(`StorageService.getBoolean error for key ${key}:`, e);
      return defaultValue;
    }
  },

  setBoolean: (key: string, value: boolean): void => {
    try {
      if (storage) {
        storage.set(key, value);
        return;
      }
      StorageService.setString(key, value ? 'true' : 'false');
    } catch (e) {
      console.error(`StorageService.setBoolean error for key ${key}:`, e);
    }
  },

  getNumber: (key: string, defaultValue = 0): number => {
    try {
      if (storage) {
        const val = storage.getNumber(key);
        return val !== undefined ? val : defaultValue;
      }
      const raw = StorageService.getString(key);
      if (raw === undefined) return defaultValue;
      const num = Number(raw);
      return isNaN(num) ? defaultValue : num;
    } catch (e) {
      console.error(`StorageService.getNumber error for key ${key}:`, e);
      return defaultValue;
    }
  },

  setNumber: (key: string, value: number): void => {
    try {
      if (storage) {
        storage.set(key, value);
        return;
      }
      StorageService.setString(key, String(value));
    } catch (e) {
      console.error(`StorageService.setNumber error for key ${key}:`, e);
    }
  },

  getObject: <T>(key: string): T | null => {
    try {
      const json = StorageService.getString(key);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error(`StorageService.getObject error for key ${key}:`, e);
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      StorageService.setString(key, JSON.stringify(value));
    } catch (e) {
      console.error(`StorageService.setObject error for key ${key}:`, e);
    }
  },

  delete: (key: string): void => {
    try {
      if (storage) {
        storage.delete(key);
        return;
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        memoryCache.delete(key);
        SecureStore.deleteItemAsync(key).catch(err => {
          console.error(`Failed to delete key ${key} asynchronously from SecureStore:`, err);
        });
      }
    } catch (e) {
      console.error(`StorageService.delete error for key ${key}:`, e);
    }
  },

  clearAll: (): void => {
    try {
      if (storage) {
        storage.clearAll();
        return;
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      } else {
        memoryCache.clear();
        KEYS_TO_PRELOAD.forEach(key => {
          SecureStore.deleteItemAsync(key).catch(() => {});
        });
      }
    } catch (e) {
      console.error('StorageService.clearAll error:', e);
    }
  },
};

