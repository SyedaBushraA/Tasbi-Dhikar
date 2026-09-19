import type { LanguageCode } from '@/types';

import type { PartialTranslations, Translations } from '../types';
import { en } from './en';

export const baseTranslations: Translations = en;

/**
 * Translations that ship with the app. English is complete; every other
 * language may be partial and falls back to English string by string.
 */
export const translations: Partial<Record<LanguageCode, PartialTranslations>> = {
  en,
};
