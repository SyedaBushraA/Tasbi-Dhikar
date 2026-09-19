import {
  SUPPORTED_LANGUAGES,
  type PluralTranslationKey,
  type TranslationKey,
  formatNumber,
  getLanguageInfo,
  translate,
  translateCount,
} from '@/i18n';
import { en } from '@/i18n/locales/en';

interface Leaf {
  key: string;
  value: unknown;
}

/** Every dot path of the English translations with the value found there. */
function leaves(node: unknown, prefix = ''): Leaf[] {
  if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
    return Object.entries(node as Record<string, unknown>).flatMap(([name, value]) =>
      leaves(value, prefix ? `${prefix}.${name}` : name),
    );
  }
  return [{ key: prefix, value: node }];
}

/** A key an older or damaged translation could still ask for. */
function goneKey(path: string): TranslationKey {
  return path as TranslationKey;
}

function gonePluralKey(path: string): PluralTranslationKey {
  return path as PluralTranslationKey;
}

const ENGLISH_LEAVES = leaves(en);

describe('the English translations', () => {
  it('are not empty', () => {
    expect(ENGLISH_LEAVES.length).toBeGreaterThan(100);
  });

  it('hold a string at every key', () => {
    const others = ENGLISH_LEAVES.filter((leaf) => typeof leaf.value !== 'string');
    expect(others.map((leaf) => leaf.key)).toEqual([]);
  });

  it('have no blank text', () => {
    const blanks = ENGLISH_LEAVES.filter(
      (leaf) => typeof leaf.value === 'string' && leaf.value.trim().length === 0,
    );
    expect(blanks.map((leaf) => leaf.key)).toEqual([]);
  });

  it('can all be looked up by their key', () => {
    for (const leaf of ENGLISH_LEAVES) {
      expect(translate('en', goneKey(leaf.key))).toBe(leaf.value);
    }
  });

  it('give every counted text both an "one" and an "other" form', () => {
    const plurals = new Set(
      ENGLISH_LEAVES.filter((leaf) => leaf.key.endsWith('.other')).map((leaf) =>
        leaf.key.slice(0, -'.other'.length),
      ),
    );
    const keys = new Set(ENGLISH_LEAVES.map((leaf) => leaf.key));

    expect(plurals.size).toBeGreaterThan(0);
    for (const base of plurals) {
      expect(keys.has(`${base}.one`)).toBe(true);
    }
  });
});

describe('translate', () => {
  it('returns the text of a key', () => {
    expect(translate('en', 'counter.undo')).toBe('Undo');
  });

  it('puts the given values into the text', () => {
    expect(translate('en', 'counter.progressOf', { count: 5, target: 33 })).toBe('5 / 33');
  });

  it('accepts numbers as well as text', () => {
    expect(translate('en', 'history.dayTotal', { total: 120 })).toBe('Total: 120');
  });

  it('leaves a placeholder in place when its value is missing', () => {
    expect(translate('en', 'counter.remaining', {})).toBe('Remaining: {remaining}');
  });

  it('ignores values the text does not ask for', () => {
    expect(translate('en', 'counter.undo', { count: 3 })).toBe('Undo');
  });

  it('falls back to English for a language that ships without a translation', () => {
    expect(translate('ar', 'counter.undo')).toBe(translate('en', 'counter.undo'));
    expect(translate('ur', 'welcome.title')).toBe('Welcome to Tasbi');
  });

  it('returns the key itself when there is no text for it', () => {
    expect(translate('en', goneKey('counter.gone'))).toBe('counter.gone');
    expect(translate('ar', goneKey('nothing.here.at.all'))).toBe('nothing.here.at.all');
  });

  it('returns the key when it points at a group instead of a text', () => {
    expect(translate('en', goneKey('counter.a11y'))).toBe('counter.a11y');
  });
});

describe('translateCount', () => {
  it('uses the single form for one', () => {
    expect(translateCount('en', 'statistics.streakDays', 1)).toBe('1 day');
  });

  it('uses the plural form for anything else', () => {
    expect(translateCount('en', 'statistics.streakDays', 3)).toBe('3 days');
    expect(translateCount('en', 'statistics.streakDays', 0)).toBe('0 days');
  });

  it('writes the count with the grouping of the language', () => {
    expect(translateCount('en', 'common.targetPicker.times', 1000)).toBe('1,000 times');
  });

  it('falls back to English for a language that ships without a translation', () => {
    expect(translateCount('hi', 'statistics.streakDays', 2)).toBe('2 days');
  });

  it('returns the key itself when there is no text for it', () => {
    expect(translateCount('en', gonePluralKey('statistics.gone'), 2)).toBe('statistics.gone');
  });
});

describe('formatNumber', () => {
  it('groups long numbers', () => {
    expect(formatNumber('en', 1000)).toBe('1,000');
    expect(formatNumber('en', 100000)).toBe('100,000');
  });

  it('leaves short numbers as they are', () => {
    expect(formatNumber('en', 0)).toBe('0');
    expect(formatNumber('en', 33)).toBe('33');
  });

  it('uses English digits while the other translations are not shipped', () => {
    expect(formatNumber('ar', 1234)).toBe('1,234');
  });
});

describe('getLanguageInfo', () => {
  it('describes the language that ships with the app', () => {
    expect(getLanguageInfo('en')).toMatchObject({ code: 'en', locale: 'en', isRTL: false });
  });

  it('falls back to English for a language that is not available yet', () => {
    expect(getLanguageInfo('te').code).toBe('en');
  });

  it('knows which of the planned languages are written right to left', () => {
    const rtl = SUPPORTED_LANGUAGES.filter((language) => language.isRTL).map(
      (language) => language.code,
    );
    expect(rtl).toEqual(['ar', 'ur']);
  });
});
