import type { en } from './locales/en';

export type Translations = typeof en;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};

export type PartialTranslations = DeepPartial<Translations>;

type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : LeafPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Dot path of every string, for example "counter.undo". */
export type TranslationKey = LeafPaths<Translations>;

type PluralBase<K extends string> = K extends `${infer Base}.other` ? Base : never;

/** Dot path of every group that has "one" and "other" forms, for example "statistics.streakDays". */
export type PluralTranslationKey = PluralBase<TranslationKey>;

export type TranslationParams = Readonly<Record<string, string | number>>;
