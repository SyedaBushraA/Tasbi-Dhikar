import type { LanguageCode } from '@/types';

export interface LanguageInfo {
  code: LanguageCode;
  /** Name in English. */
  name: string;
  /** Name as written in the language itself. */
  nativeName: string;
  /** BCP 47 tag used for date, time and number formatting. */
  locale: string;
  isRTL: boolean;
  /** Whether a translation ships with this version. */
  available: boolean;
}

/**
 * To add a language: create `locales/<code>.ts` exporting a
 * `PartialTranslations`, register it in `locales/index.ts` and set
 * `available` to true here. Missing strings fall back to English.
 */
export const SUPPORTED_LANGUAGES: readonly LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en', isRTL: false, available: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', locale: 'ar', isRTL: true, available: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', locale: 'ur', isRTL: true, available: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te', isRTL: false, available: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi', isRTL: false, available: false },
];

export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  const info =
    SUPPORTED_LANGUAGES.find((language) => language.code === code && language.available) ??
    SUPPORTED_LANGUAGES.find((language) => language.code === FALLBACK_LANGUAGE);
  if (!info) throw new Error('The fallback language must be registered');
  return info;
}
