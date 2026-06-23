import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { StorageService } from '@/services/storage';

interface ThemeState {
  colorScheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Retrieve persisted theme scheme from MMKV storage
  const savedScheme = StorageService.getString(STORAGE_KEYS.THEME_MODE);
  const initialScheme: 'light' | 'dark' = savedScheme === 'dark' ? 'dark' : 'light';

  return {
    colorScheme: initialScheme,
    setTheme: (theme) => {
      StorageService.setString(STORAGE_KEYS.THEME_MODE, theme);
      set({ colorScheme: theme });
    },
    toggleTheme: () => {
      set((state) => {
        const nextScheme = state.colorScheme === 'dark' ? 'light' : 'dark';
        StorageService.setString(STORAGE_KEYS.THEME_MODE, nextScheme);
        return { colorScheme: nextScheme };
      });
    },
  };
});
