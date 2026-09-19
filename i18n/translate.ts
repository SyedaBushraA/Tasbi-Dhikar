import type { LanguageCode } from '@/types';

import { getLanguageInfo } from './languages';
import { baseTranslations, translations } from './locales';
import type { PluralTranslationKey, TranslationKey, TranslationParams } from './types';

function lookup(source: unknown, path: string): string | undefined {
  let node: unknown = source;
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}

function resolve(language: LanguageCode, path: string): string | undefined {
  return lookup(translations[language], path) ?? lookup(baseTranslations, path);
}

/** Text for a key in a language, falling back to English and finally to the key itself. */
export function translate(
  language: LanguageCode,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  return interpolate(resolve(language, key) ?? key, params);
}

function pluralCategory(language: LanguageCode, count: number): string {
  try {
    return new Intl.PluralRules(getLanguageInfo(language).locale).select(count);
  } catch {
    return count === 1 ? 'one' : 'other';
  }
}

/**
 * Text for a counted thing. Picks the plural form the language needs
 * ("zero", "one", "two", "few", "many") when it is translated, else "other".
 * The count is available to the text as {count}.
 */
export function translateCount(
  language: LanguageCode,
  key: PluralTranslationKey,
  count: number,
  params?: TranslationParams,
): string {
  const template =
    resolve(language, `${key}.${pluralCategory(language, count)}`) ??
    resolve(language, `${key}.other`) ??
    key;
  return interpolate(template, { ...params, count: formatNumber(language, count) });
}

/** Number with the grouping of the language, for example 1,000. */
export function formatNumber(language: LanguageCode, value: number): string {
  try {
    return new Intl.NumberFormat(getLanguageInfo(language).locale).format(value);
  } catch {
    return String(value);
  }
}
