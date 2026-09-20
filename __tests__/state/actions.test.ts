import { MIN_TAP_INTERVAL_MS } from '@/constants/defaults';
import { MAX_CUSTOM_DHIKR, MAX_DHIKR_NAME_LENGTH } from '@/constants/dhikr';
import { translate } from '@/i18n';

import { TEST_NOW, createClock, createTestHarness } from '../helpers/render';
import type { SavedState } from '../helpers/storage';

const TAP_GAP = MIN_TAP_INTERVAL_MS + 1;

/** A harness on a frozen clock, so every step of time in a test is deliberate. */
function harness(state?: SavedState) {
  return createTestHarness({ state, clock: createClock(TEST_NOW) });
}

describe('tap', () => {
  it('counts and says so', async () => {
    const { actions, store } = await harness();

    expect(actions.tap()).toBe(true);
    expect(store.getState().counter.count).toBe(1);
  });

  it('treats a second tap within a few milliseconds as one finger bouncing', async () => {
    const { actions, clock, store } = await harness();

    actions.tap();
    clock.advance(MIN_TAP_INTERVAL_MS - 1);

    expect(actions.tap()).toBe(false);
    expect(store.getState().counter.count).toBe(1);
  });

  it('counts again once the finger has settled', async () => {
    const { actions, clock, store } = await harness();

    actions.tap();
    clock.advance(TAP_GAP);

    expect(actions.tap()).toBe(true);
    expect(store.getState().counter.count).toBe(2);
  });

  it('is refused while the round is paused', async () => {
    const { actions, clock, services, store } = await harness();

    actions.togglePause();
    clock.advance(TAP_GAP);

    expect(actions.tap()).toBe(false);
    expect(store.getState().counter.count).toBe(0);
    expect(services.haptics.tap).not.toHaveBeenCalled();
  });

  it('vibrates for a count when haptics are on', async () => {
    const { actions, services } = await harness();

    actions.tap();

    expect(services.haptics.tap).toHaveBeenCalledTimes(1);
    expect(services.sound.tick).not.toHaveBeenCalled();
  });

  it('stays silent and still when both are off', async () => {
    const { actions, services } = await harness({
      settings: { hapticsEnabled: false, soundEnabled: false },
    });

    actions.tap();

    expect(services.haptics.tap).not.toHaveBeenCalled();
    expect(services.sound.tick).not.toHaveBeenCalled();
  });

  it('ticks when sound is on', async () => {
    const { actions, services } = await harness({ settings: { soundEnabled: true } });

    actions.tap();

    expect(services.sound.tick).toHaveBeenCalledTimes(1);
  });

  it('uses the completion feedback for the count that reaches the target', async () => {
    const { actions, clock, services } = await harness({
      settings: { soundEnabled: true },
      counter: { target: 2 },
    });

    actions.tap();
    clock.advance(TAP_GAP);
    actions.tap();

    expect(services.haptics.tap).toHaveBeenCalledTimes(1);
    expect(services.haptics.complete).toHaveBeenCalledTimes(1);
    expect(services.sound.complete).toHaveBeenCalledTimes(1);
  });
});

describe('undo', () => {
  it('takes one count back with a short feedback', async () => {
    const { actions, services, store } = await harness();

    actions.tap();
    actions.undo();

    expect(store.getState().counter.count).toBe(0);
    expect(services.haptics.selection).toHaveBeenCalledTimes(1);
  });

  it('says nothing when there is nothing to take back', async () => {
    const { actions, services } = await harness();

    actions.undo();

    expect(services.haptics.selection).not.toHaveBeenCalled();
  });

  it('stays quiet while haptics are off', async () => {
    const { actions, services } = await harness({ settings: { hapticsEnabled: false } });

    actions.tap();
    actions.undo();

    expect(services.haptics.selection).not.toHaveBeenCalled();
  });
});

describe('setTarget', () => {
  it('accepts a usable target', async () => {
    const { actions, store } = await harness();

    actions.setTarget(99);

    expect(store.getState().counter.target).toBe(99);
  });

  it('refuses a target that cannot be counted', async () => {
    const { actions, store } = await harness();
    const before = store.getState().counter.target;

    actions.setTarget(0);
    actions.setTarget(-10);

    expect(store.getState().counter.target).toBe(before);
  });
});

describe('updateSettings', () => {
  it('brings the prayer notifications up to date after a change of clock format', async () => {
    const { actions, services } = await harness();

    actions.updateSettings({ clockFormat: '24h' });

    expect(services.prayer.syncAlerts).toHaveBeenCalledTimes(1);
  });

  it('brings them up to date after a change of language', async () => {
    const { actions, services } = await harness();

    actions.updateSettings({ language: 'ar' });

    expect(services.prayer.syncAlerts).toHaveBeenCalledTimes(1);
  });

  it('leaves them alone for a change that does not affect their text', async () => {
    const { actions, services } = await harness();

    actions.updateSettings({ easyMode: true });

    expect(services.prayer.syncAlerts).not.toHaveBeenCalled();
  });

  it('rewrites the daily reminder after a change of language', async () => {
    const { actions, services } = await harness({
      settings: { reminder: { enabled: true, hour: 6, minute: 30 } },
    });

    actions.updateSettings({ language: 'ar' });

    expect(services.reminders.sync).toHaveBeenCalledWith(true, 6, 30, expect.anything());
  });

  it('leaves the daily reminder alone for a change that does not affect its text', async () => {
    const { actions, services } = await harness({
      settings: { reminder: { enabled: true, hour: 6, minute: 30 } },
    });

    actions.updateSettings({ clockFormat: '24h' });

    expect(services.reminders.sync).not.toHaveBeenCalled();
  });
});

describe('completeOnboarding', () => {
  it('marks the first launch as done', async () => {
    const { actions, store } = await harness();

    actions.completeOnboarding();

    expect(store.getState().settings.onboardingCompleted).toBe(true);
  });
});

describe('saveCustomDhikr', () => {
  it('creates a Dhikr with a tidied name', async () => {
    const { actions, store } = await harness();

    const result = actions.saveCustomDhikr({ name: '  Ya   Rahman ', target: '100' });

    expect(result.ok).toBe(true);
    expect(store.getState().customDhikr).toHaveLength(1);
    expect(store.getState().customDhikr[0]).toMatchObject({ name: 'Ya Rahman', target: 100 });
  });

  it('refuses an empty name', async () => {
    const { actions, store } = await harness();

    const result = actions.saveCustomDhikr({ name: '   ', target: 100 });

    expect(result).toEqual({ ok: false, nameError: 'required', targetError: undefined });
    expect(store.getState().customDhikr).toEqual([]);
  });

  it('refuses a name that is too long', async () => {
    const { actions } = await harness();

    const result = actions.saveCustomDhikr({
      name: 'x'.repeat(MAX_DHIKR_NAME_LENGTH + 1),
      target: 100,
    });

    expect(result).toMatchObject({ ok: false, nameError: 'tooLong' });
  });

  it('refuses the name of a built-in Dhikr, however it is written', async () => {
    const { actions } = await harness();

    const result = actions.saveCustomDhikr({ name: ' subhanallah ', target: 100 });

    expect(result).toMatchObject({ ok: false, nameError: 'duplicate' });
  });

  it('refuses a target that is not a whole number', async () => {
    const { actions } = await harness();

    const result = actions.saveCustomDhikr({ name: 'Ya Rahman', target: '12.5' });

    expect(result).toMatchObject({ ok: false, targetError: 'notANumber' });
  });

  it('reports both problems at once', async () => {
    const { actions } = await harness();

    const result = actions.saveCustomDhikr({ name: '', target: '' });

    expect(result).toEqual({ ok: false, nameError: 'required', targetError: 'required' });
  });

  it('changes an existing Dhikr instead of adding another', async () => {
    const { actions, store } = await harness();
    const created = actions.saveCustomDhikr({ name: 'Ya Rahman', target: 100 });
    const id = created.ok ? created.dhikr.id : '';

    const result = actions.saveCustomDhikr({ id, name: 'Ya Kareem', target: 50 });

    expect(result.ok).toBe(true);
    expect(store.getState().customDhikr).toHaveLength(1);
    expect(store.getState().customDhikr[0]).toMatchObject({ name: 'Ya Kareem', target: 50 });
  });

  it('lets a Dhikr keep its own name while being edited', async () => {
    const { actions } = await harness();
    const created = actions.saveCustomDhikr({ name: 'Ya Rahman', target: 100 });
    const id = created.ok ? created.dhikr.id : '';

    expect(actions.saveCustomDhikr({ id, name: 'Ya Rahman', target: 50 }).ok).toBe(true);
  });

  it('refuses a new Dhikr once the list is full', async () => {
    const { actions, store } = await harness({
      customDhikr: Array.from({ length: MAX_CUSTOM_DHIKR }, (_, index) => ({
        id: `custom-${index}`,
        name: `Dhikr ${index}`,
        target: 33,
        createdAt: TEST_NOW,
      })),
    });

    const result = actions.saveCustomDhikr({ name: 'One more', target: 33 });

    expect(result).toEqual({ ok: false, limitReached: true });
    expect(store.getState().customDhikr).toHaveLength(MAX_CUSTOM_DHIKR);
  });

  it('still allows editing when the list is full', async () => {
    const { actions } = await harness({
      customDhikr: Array.from({ length: MAX_CUSTOM_DHIKR }, (_, index) => ({
        id: `custom-${index}`,
        name: `Dhikr ${index}`,
        target: 33,
        createdAt: TEST_NOW,
      })),
    });

    expect(actions.saveCustomDhikr({ id: 'custom-0', name: 'Renamed', target: 33 }).ok).toBe(true);
  });
});

describe('deleteCustomDhikr and clearHistory', () => {
  it('removes a Dhikr', async () => {
    const { actions, store } = await harness();
    const created = actions.saveCustomDhikr({ name: 'Ya Rahman', target: 100 });

    if (created.ok) actions.deleteCustomDhikr(created.dhikr.id);

    expect(store.getState().customDhikr).toEqual([]);
  });

  it('empties the history and the statistics', async () => {
    const { actions, clock, store } = await harness({ counter: { target: 1 } });

    actions.tap();
    clock.advance(TAP_GAP);
    expect(store.getState().history).toHaveLength(1);

    actions.clearHistory();

    expect(store.getState().history).toEqual([]);
    expect(store.getState().stats).toEqual({ daily: {}, completedSessions: 0 });
  });
});

describe('the daily reminder', () => {
  it('turns on once the notification is scheduled', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: false, hour: 6, minute: 30 } },
    });

    await expect(actions.enableReminder()).resolves.toBe('scheduled');

    expect(services.reminders.schedule).toHaveBeenCalledWith(6, 30, {
      title: translate('en', 'notifications.reminderTitle'),
      body: translate('en', 'notifications.reminderBody'),
      channelName: translate('en', 'notifications.channelName'),
      channelDescription: translate('en', 'notifications.channelDescription'),
    });
    expect(store.getState().settings.reminder.enabled).toBe(true);
  });

  it('stays off when the notification permission is refused', async () => {
    const { actions, services, store } = await harness();
    services.reminders.schedule.mockResolvedValue('denied');

    await expect(actions.enableReminder()).resolves.toBe('denied');

    expect(store.getState().settings.reminder.enabled).toBe(false);
  });

  it('is cancelled when it is turned off', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: true, hour: 20, minute: 0 } },
    });

    await actions.disableReminder();

    expect(store.getState().settings.reminder.enabled).toBe(false);
    expect(services.reminders.cancel).toHaveBeenCalledTimes(1);
  });

  it('only saves a new time while it is off', async () => {
    const { actions, services, store } = await harness();

    await expect(actions.setReminderTime(7, 15)).resolves.toBe('saved');

    expect(store.getState().settings.reminder).toEqual({ enabled: false, hour: 7, minute: 15 });
    expect(services.reminders.schedule).not.toHaveBeenCalled();
  });

  it('moves the notification to the new time while it is on', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: true, hour: 20, minute: 0 } },
    });

    await expect(actions.setReminderTime(7, 15)).resolves.toBe('scheduled');

    expect(services.reminders.schedule).toHaveBeenCalledWith(7, 15, expect.anything());
    expect(store.getState().settings.reminder).toEqual({ enabled: true, hour: 7, minute: 15 });
  });

  it('turns itself off when the new time cannot be scheduled', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: true, hour: 20, minute: 0 } },
    });
    services.reminders.schedule.mockResolvedValue('failed');

    await expect(actions.setReminderTime(7, 15)).resolves.toBe('failed');

    expect(store.getState().settings.reminder).toEqual({ enabled: false, hour: 7, minute: 15 });
  });

  it('is put back in place on start', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: true, hour: 6, minute: 30 } },
    });

    await actions.syncReminder();

    expect(services.reminders.sync).toHaveBeenCalledWith(true, 6, 30, expect.anything());
    expect(store.getState().settings.reminder.enabled).toBe(true);
  });

  it('turns off when it can no longer be delivered', async () => {
    const { actions, services, store } = await harness({
      settings: { reminder: { enabled: true, hour: 6, minute: 30 } },
    });
    services.reminders.sync.mockResolvedValue(false);

    await actions.syncReminder();

    expect(store.getState().settings.reminder.enabled).toBe(false);
  });

  it('leaves a reminder that is already off alone', async () => {
    const { actions, services, store } = await harness();
    services.reminders.sync.mockResolvedValue(false);

    await actions.syncReminder();

    expect(services.reminders.sync).toHaveBeenCalledWith(false, 20, 0, expect.anything());
    expect(store.getState().settings.reminder.enabled).toBe(false);
  });
});
