import { useMemo } from 'react';

import {
  type PluralTranslationKey,
  type TranslationKey,
  type TranslationParams,
  formatNumber,
  getLanguageInfo,
  translate,
  translateCount,
} from '@/i18n';
import { useAppSelector } from '@/state';
import type { LanguageCode } from '@/types';

export interface Translator {
  language: LanguageCode;
  /** BCP 47 tag for date and time formatting. */
  locale: string;
  isRTL: boolean;
  t(key: TranslationKey, params?: TranslationParams): string;
  /** Text with a plural form, for example tCount('statistics.streakDays', 3). */
  tCount(key: PluralTranslationKey, count: number, params?: TranslationParams): string;
  /** Number with the grouping of the language, for example 1,000. */
  n(value: number): string;
}

export function useTranslation(): Translator {
  const language = useAppSelector((state) => state.settings.language);

  return useMemo<Translator>(() => {
    const info = getLanguageInfo(language);
    return {
      language: info.code,
      locale: info.locale,
      isRTL: info.isRTL,
      t: (key, params) => translate(info.code, key, params),
      tCount: (key, count, params) => translateCount(info.code, key, count, params),
      n: (value) => formatNumber(info.code, value),
    };
  }, [language]);
}
