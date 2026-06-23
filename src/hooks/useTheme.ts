import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/theme';

export function useTheme() {
  const { colorScheme, setTheme, toggleTheme } = useThemeStore();
  const isDark = colorScheme === 'dark';
  
  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    colorScheme,
    isDark,
    setTheme,
    toggleTheme,
    colors: {
      ...colors,
      primary: COLORS.primary,
      primaryHover: COLORS.primaryHover,
      accent: COLORS.accent,
      success: COLORS.success,
      warning: COLORS.warning,
      danger: COLORS.danger,
    },
  };
}
