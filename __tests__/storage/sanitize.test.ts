import { DEFAULT_COUNTER, DEFAULT_SETTINGS, MAX_HISTORY_RECORDS } from '@/constants/defaults';
import { DEFAULT_DHIKR_ID, MAX_CUSTOM_DHIKR, MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import { DEFAULT_TARGET } from '@/constants/targets';
import {
  sanitizeAppState,
  sanitizeCounter,
  sanitizeCustomDhikr,
  sanitizeHistory,
  sanitizeSettings,
  sanitizeStats,
} from '@/storage/sanitize';

/** Local timestamp in September 2026, so day keys do not depend on the timezone. */
function at(day: number, hour = 10, minute = 0): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

const NOT_OBJECTS: readonly unknown[] = [undefined, null, 0, 'settings', true, []];

describe('sanitizeSettings', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const raw of NOT_OBJECTS) {
      expect(sanitizeSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('returns a reminder of its own, so the defaults cannot be changed by accident', () => {
    const settings = sanitizeSettings(undefined);
    settings.reminder.hour = 3;
    expect(DEFAULT_SETTINGS.reminder.hour).toBe(20);
  });

  it('keeps every valid value', () => {
    const saved = {
      theme: 'dark',
      language: 'en',
      easyMode: true,
      hapticsEnabled: false,
      soundEnabled: true,
      defaultTarget: 99,
      reminder: { enabled: true, hour: 6, minute: 45 },
      onboardingCompleted: true,
      clockFormat: '24h',
    };
    expect(sanitizeSettings(saved)).toEqual(saved);
  });

  it('replaces an unknown theme, language and clock format', () => {
    const settings = sanitizeSettings({ theme: 'sepia', language: 'kl', clockFormat: '48h' });
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(settings.language).toBe(DEFAULT_SETTINGS.language);
    expect(settings.clockFormat).toBe(DEFAULT_SETTINGS.clockFormat);
  });

  it('keeps both clock formats', () => {
    expect(sanitizeSettings({ clockFormat: '12h' }).clockFormat).toBe('12h');
    expect(sanitizeSettings({ clockFormat: '24h' }).clockFormat).toBe('24h');
  });

  it('replaces a target that is not a usable whole number', () => {
    for (const target of [0, -5, 33.5, '33', null]) {
      expect(sanitizeSettings({ defaultTarget: target }).defaultTarget).toBe(
        DEFAULT_SETTINGS.defaultTarget,
      );
    }
  });

  it('keeps a language that ships without a translation, so it can be added later', () => {
    expect(sanitizeSettings({ language: 'ar' }).language).toBe('ar');
  });

  it('replaces switches that are not booleans', () => {
    const settings = sanitizeSettings({ easyMode: 'yes', hapticsEnabled: 1, soundEnabled: null });
    expect(settings.easyMode).toBe(DEFAULT_SETTINGS.easyMode);
    expect(settings.hapticsEnabled).toBe(DEFAULT_SETTINGS.hapticsEnabled);
    expect(settings.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
  });

  it('replaces a reminder time outside the clock', () => {
    const settings = sanitizeSettings({ reminder: { enabled: true, hour: 24, minute: 60 } });
    expect(settings.reminder).toEqual({
      enabled: true,
      hour: DEFAULT_SETTINGS.reminder.hour,
      minute: DEFAULT_SETTINGS.reminder.minute,
    });
  });

  it('accepts the edges of the clock', () => {
    const settings = sanitizeSettings({ reminder: { enabled: false, hour: 0, minute: 59 } });
    expect(settings.reminder).toEqual({ enabled: false, hour: 0, minute: 59 });
  });

  it('replaces a reminder that is not an object', () => {
    expect(sanitizeSettings({ reminder: 'evening' }).reminder).toEqual(DEFAULT_SETTINGS.reminder);
  });
});

describe('sanitizeCustomDhikr', () => {
  const valid = { id: 'custom-1', name: 'Ya Rahman', target: 100, createdAt: at(10) };

  it('returns an empty list for anything that is not an array', () => {
    for (const raw of [undefined, null, {}, 'list']) {
      expect(sanitizeCustomDhikr(raw)).toEqual([]);
    }
  });

  it('keeps a complete entry', () => {
    expect(sanitizeCustomDhikr([valid])).toEqual([valid]);
  });

  it('drops entries without a usable id, name or target', () => {
    const raw = [
      { ...valid, id: '' },
      { ...valid, id: 'a', name: '   ' },
      { ...valid, id: 'b', target: 0 },
      { ...valid, id: 'c', target: '100' },
      'not an object',
      null,
    ];
    expect(sanitizeCustomDhikr(raw)).toEqual([]);
  });

  it('collapses whitespace in a name', () => {
    expect(sanitizeCustomDhikr([{ ...valid, name: '  Ya   Rahman ' }])[0]?.name).toBe('Ya Rahman');
  });

  it('cuts a name that is too long', () => {
    const long = 'x'.repeat(MAX_DHIKR_NAME_LENGTH + 20);
    expect(sanitizeCustomDhikr([{ ...valid, name: long }])[0]?.name).toHaveLength(
      MAX_DHIKR_NAME_LENGTH,
    );
  });

  it('keeps only the first entry of a repeated id', () => {
    const result = sanitizeCustomDhikr([valid, { ...valid, name: 'Ya Kareem' }]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Ya Rahman');
  });

  it('falls back to no creation time when it is missing or damaged', () => {
    expect(sanitizeCustomDhikr([{ ...valid, createdAt: 'yesterday' }])[0]?.createdAt).toBe(0);
    expect(sanitizeCustomDhikr([{ ...valid, createdAt: -1 }])[0]?.createdAt).toBe(0);
  });

  it('stops at the maximum number of own Dhikr', () => {
    const many = Array.from({ length: MAX_CUSTOM_DHIKR + 10 }, (_, index) => ({
      ...valid,
      id: `custom-${index}`,
    }));
    expect(sanitizeCustomDhikr(many)).toHaveLength(MAX_CUSTOM_DHIKR);
  });
});

describe('sanitizeCounter', () => {
  it('returns the default round for anything that is not an object', () => {
    for (const raw of NOT_OBJECTS) {
      expect(sanitizeCounter(raw)).toEqual(DEFAULT_COUNTER);
    }
  });

  it('keeps a round in progress', () => {
    const counter = {
      dhikrId: 'astaghfirullah',
      target: 99,
      count: 12,
      paused: true,
      startedAt: at(14, 9),
      lastTapAt: at(14, 9, 30),
      completedSessionId: null,
    };
    expect(sanitizeCounter(counter)).toEqual(counter);
  });

  it('replaces a target that is not usable and keeps the count inside it', () => {
    const counter = sanitizeCounter({ target: 0, count: 4000 });
    expect(counter.target).toBe(DEFAULT_COUNTER.target);
    expect(counter.count).toBe(0);
  });

  it('drops a count above the target', () => {
    expect(sanitizeCounter({ target: 33, count: 50 }).count).toBe(0);
  });

  it('keeps a completion id only when the target was reached', () => {
    expect(sanitizeCounter({ target: 33, count: 33, completedSessionId: 's1' }).completedSessionId)
      .toBe('s1');
    expect(sanitizeCounter({ target: 33, count: 32, completedSessionId: 's1' }).completedSessionId)
      .toBeNull();
  });

  it('forgets the times of a round that has not started', () => {
    const counter = sanitizeCounter({ count: 0, startedAt: at(14), lastTapAt: at(14) });
    expect(counter.startedAt).toBeNull();
    expect(counter.lastTapAt).toBeNull();
  });

  it('falls back to the default Dhikr when none was saved', () => {
    expect(sanitizeCounter({ dhikrId: 42 }).dhikrId).toBe(DEFAULT_DHIKR_ID);
  });
});

describe('sanitizeStats', () => {
  it('returns empty statistics for anything that is not an object', () => {
    for (const raw of NOT_OBJECTS) {
      expect(sanitizeStats(raw)).toEqual({ daily: {}, completedSessions: 0 });
    }
  });

  it('keeps days that are written as YYYY-MM-DD', () => {
    const stats = sanitizeStats({ daily: { '2026-09-14': 45 }, completedSessions: 3 });
    expect(stats).toEqual({ daily: { '2026-09-14': 45 }, completedSessions: 3 });
  });

  it('drops keys that are not a day', () => {
    const stats = sanitizeStats({ daily: { yesterday: 5, '2026-9-1': 5, '2026-09-14': 5 } });
    expect(stats.daily).toEqual({ '2026-09-14': 5 });
  });

  it('drops counts that are not a positive whole number', () => {
    const stats = sanitizeStats({
      daily: { '2026-09-10': 0, '2026-09-11': -3, '2026-09-12': 2.5, '2026-09-13': '7' },
    });
    expect(stats.daily).toEqual({});
  });

  it('replaces a damaged session count', () => {
    expect(sanitizeStats({ completedSessions: -2 }).completedSessions).toBe(0);
    expect(sanitizeStats({ completedSessions: 'many' }).completedSessions).toBe(0);
  });
});

describe('sanitizeHistory', () => {
  const record = {
    id: 's1',
    dhikrId: 'subhanallah',
    dhikrName: 'SubhanAllah',
    count: 33,
    target: 33,
    completedAt: at(14),
  };

  it('returns an empty history for anything that is not an array', () => {
    for (const raw of [undefined, null, {}, 'history']) {
      expect(sanitizeHistory(raw)).toEqual([]);
    }
  });

  it('keeps a complete record', () => {
    expect(sanitizeHistory([record])).toEqual([record]);
  });

  it('drops records that are missing what makes them readable', () => {
    const raw = [
      { ...record, id: '' },
      { ...record, id: 'a', dhikrName: '' },
      { ...record, id: 'b', completedAt: 0 },
      { ...record, id: 'c', count: 0 },
      { ...record, id: 'd', target: 'many' },
      42,
    ];
    expect(sanitizeHistory(raw)).toEqual([]);
  });

  it('keeps a record whose Dhikr is gone, with an empty id', () => {
    const orphan = sanitizeHistory([{ ...record, dhikrId: undefined }])[0];
    expect(orphan?.dhikrId).toBe('');
    expect(orphan?.dhikrName).toBe('SubhanAllah');
  });

  it('keeps only the first record of a repeated id', () => {
    const result = sanitizeHistory([record, { ...record, count: 99, target: 99 }]);
    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(33);
  });

  it('sorts the newest completion first', () => {
    const result = sanitizeHistory([
      { ...record, id: 'old', completedAt: at(12) },
      { ...record, id: 'new', completedAt: at(15) },
      { ...record, id: 'middle', completedAt: at(14) },
    ]);
    expect(result.map((entry) => entry.id)).toEqual(['new', 'middle', 'old']);
  });

  it('keeps at most the newest records it has room for', () => {
    const many = Array.from({ length: MAX_HISTORY_RECORDS + 5 }, (_, index) => ({
      ...record,
      id: `s${index}`,
      completedAt: at(14) - index * 60_000,
    }));
    const result = sanitizeHistory(many);
    expect(result).toHaveLength(MAX_HISTORY_RECORDS);
    expect(result[0]?.id).toBe('s0');
  });
});

describe('sanitizeAppState', () => {
  it('returns defaults when nothing was saved', () => {
    const state = sanitizeAppState({});
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.customDhikr).toEqual([]);
    expect(state.counter).toEqual(DEFAULT_COUNTER);
    expect(state.stats).toEqual({ daily: {}, completedSessions: 0 });
    expect(state.history).toEqual([]);
    expect(state.prayer.location).toBeNull();
  });

  it('keeps a round on a Dhikr that still exists', () => {
    const state = sanitizeAppState({
      customDhikr: [{ id: 'custom-1', name: 'Ya Rahman', target: 100, createdAt: at(10) }],
      counter: {
        dhikrId: 'custom-1',
        target: 100,
        count: 7,
        paused: false,
        startedAt: at(14),
        lastTapAt: at(14, 10),
        completedSessionId: null,
      },
    });
    expect(state.counter.dhikrId).toBe('custom-1');
    expect(state.counter.count).toBe(7);
  });

  it('starts a clean round when the chosen Dhikr is gone', () => {
    const state = sanitizeAppState({
      settings: { defaultTarget: 99 },
      counter: { dhikrId: 'custom-gone', target: 100, count: 7, startedAt: at(14) },
    });
    expect(state.counter).toEqual({ ...DEFAULT_COUNTER, target: 99 });
  });

  it('restarts a finished round whose history entry disappeared', () => {
    const state = sanitizeAppState({
      counter: {
        dhikrId: DEFAULT_DHIKR_ID,
        target: 33,
        count: 33,
        paused: false,
        startedAt: at(14),
        lastTapAt: at(14, 10),
        completedSessionId: 'gone',
      },
      history: [],
    });
    expect(state.counter.count).toBe(0);
    expect(state.counter.completedSessionId).toBeNull();
    expect(state.counter.startedAt).toBeNull();
  });

  it('keeps a finished round whose history entry is still there', () => {
    const state = sanitizeAppState({
      counter: {
        dhikrId: DEFAULT_DHIKR_ID,
        target: 33,
        count: 33,
        paused: false,
        startedAt: at(14),
        lastTapAt: at(14, 10),
        completedSessionId: 's1',
      },
      history: [
        {
          id: 's1',
          dhikrId: DEFAULT_DHIKR_ID,
          dhikrName: 'SubhanAllah',
          count: 33,
          target: 33,
          completedAt: at(14, 10),
        },
      ],
    });
    expect(state.counter.count).toBe(33);
    expect(state.counter.completedSessionId).toBe('s1');
  });

  it('steps a count that reached the target back when no completion was recorded', () => {
    const state = sanitizeAppState({
      counter: { dhikrId: DEFAULT_DHIKR_ID, target: 33, count: 33, completedSessionId: null },
    });
    expect(state.counter.count).toBe(32);
    expect(state.counter.completedSessionId).toBeNull();
  });

  it('repairs every slice at once and leaves the app usable', () => {
    const state = sanitizeAppState({
      settings: 'broken',
      customDhikr: 'broken',
      counter: 'broken',
      stats: 'broken',
      history: 'broken',
      prayer: 'broken',
    });
    expect(state.settings.defaultTarget).toBe(DEFAULT_TARGET);
    expect(state.counter.dhikrId).toBe(DEFAULT_DHIKR_ID);
    expect(state.history).toEqual([]);
  });
});
