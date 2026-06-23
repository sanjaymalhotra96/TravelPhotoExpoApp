import enTranslations from '@/constants/en.json';

/**
 * Static translation helper — looks up strings by dot-notation path
 * and supports simple {variable} interpolation.
 *
 * Usage:
 *   t('auth.login.title')
 *   t('common.generatedOn', { date: '12 Jun 2025' })
 */
export function t(key: string, variables?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = enTranslations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Fallback: return the key itself if not found
    }
  }

  if (typeof value !== 'string') return key;

  if (variables) {
    return Object.entries(variables).reduce(
      (str, [varKey, varValue]) =>
        str.replace(new RegExp(`{${varKey}}`, 'g'), String(varValue)),
      value
    );
  }

  return value;
}
