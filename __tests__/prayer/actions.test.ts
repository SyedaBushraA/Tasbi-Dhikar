import type { LocateResult, PrayerAlertResult } from '@/state/prayerActions';
import type { PrayerLocation } from '@/types';

import {
  HYDERABAD,
  MAKKAH,
  at,
  deferred,
  flush,
  prayerHarness,
  prayerSettings,
} from '../helpers/prayer';

/** A place with no country, so no method can be suggested for it. */
const OPEN_SEA: PrayerLocation = {
  source: 'coordinates',
  name: '10.0000° N, 20.0000° E',
  latitude: 10,
  longitude: 20,
  updatedAt: at(9, 1),
};

const withPlace = { prayer: prayerSettings({ location: HYDERABAD }) };

// Several actions bring the schedule up to date without waiting for it.
afterEach(async () => {
  await flush();
});

describe('setPrayerLocation', () => {
  it('preselects the method and Asr time used where the place is', async () => {
    const harness = await prayerHarness();
    harness.actions.setPrayerLocation(HYDERABAD);

    expect(harness.prayer().location).toEqual(HYDERABAD);
    expect(harness.prayer().method).toBe('Karachi');
    expect(harness.prayer().asrMethod).toBe('hanafi');
    expect(harness.prayer().methodConfirmed).toBe(false);
  });

  it('preselects the method of the Arabian peninsula', async () => {
    const harness = await prayerHarness();
    harness.actions.setPrayerLocation(MAKKAH);

    expect(harness.prayer().method).toBe('UmmAlQura');
    expect(harness.prayer().asrMethod).toBe('standard');
  });

  it('falls back to the default method where no country is known', async () => {
    const harness = await prayerHarness();
    harness.actions.setPrayerLocation(OPEN_SEA);

    expect(harness.prayer().method).toBe('MuslimWorldLeague');
    expect(harness.prayer().asrMethod).toBe('standard');
  });

  it('never overrules a method the user has confirmed', async () => {
    const harness = await prayerHarness();
    harness.actions.confirmCalculation('Egyptian', 'standard');
    expect(harness.prayer().methodConfirmed).toBe(true);

    harness.actions.setPrayerLocation(HYDERABAD);
    expect(harness.prayer().method).toBe('Egyptian');
    expect(harness.prayer().asrMethod).toBe('standard');
    expect(harness.prayer().location).toEqual(HYDERABAD);
  });

  it('brings the scheduled notifications up to date without asking anything', async () => {
    const harness = await prayerHarness();
    harness.actions.setPrayerLocation(HYDERABAD);
    await flush();

    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: false });
    expect(harness.locate).not.toHaveBeenCalled();
  });
});

describe('locateAutomatically', () => {
  it('stores the place the phone reports', async () => {
    const harness = await prayerHarness();
    harness.locate.mockResolvedValue({ status: 'ok', location: HYDERABAD });

    await expect(harness.actions.locateAutomatically()).resolves.toEqual({
      status: 'ok',
      location: HYDERABAD,
    });
    expect(harness.prayer().location).toEqual(HYDERABAD);
    expect(harness.prayer().method).toBe('Karachi');
  });

  const refusals: LocateResult[] = [
    { status: 'denied' },
    { status: 'unavailable' },
    { status: 'failed' },
  ];

  it.each(refusals)('keeps the place empty when locating reports $status', async (refusal) => {
    const harness = await prayerHarness();
    harness.locate.mockResolvedValue(refusal);

    await expect(harness.actions.locateAutomatically()).resolves.toEqual(refusal);
    expect(harness.prayer().location).toBeNull();
    await flush();
    expect(harness.syncAlerts).not.toHaveBeenCalled();
  });

  it('reports a failure when reading the position throws', async () => {
    const harness = await prayerHarness();
    harness.locate.mockRejectedValue(new Error('no position'));

    await expect(harness.actions.locateAutomatically()).resolves.toEqual({ status: 'failed' });
    expect(harness.prayer().location).toBeNull();
  });
});

describe('setPrayerNotification', () => {
  it('turns one prayer on and asks for permission while doing so', async () => {
    const harness = await prayerHarness(withPlace);

    await expect(harness.actions.setPrayerNotification('fajr', true)).resolves.toBe('scheduled');
    expect(harness.prayer().notifications.fajr).toBe(true);
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: true });
    expect(harness.syncAlerts.mock.calls[0]?.[0].prayer.notifications.fajr).toBe(true);
  });

  it('turns one prayer off without asking anything', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true, isha: true } }),
    });

    await harness.actions.setPrayerNotification('fajr', false);
    expect(harness.prayer().notifications.fajr).toBe(false);
    expect(harness.prayer().notifications.isha).toBe(true);
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: false });
  });

  const problems: PrayerAlertResult[] = ['denied', 'failed'];

  it.each(problems)('puts only the refused switch back when the phone says %s', async (problem) => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { dhuhr: true } }),
    });
    harness.syncAlerts.mockResolvedValue(problem);

    await expect(harness.actions.setPrayerNotification('fajr', true)).resolves.toBe(problem);
    expect(harness.prayer().notifications.fajr).toBe(false);
    expect(harness.prayer().notifications.dhuhr).toBe(true);
  });

  it('leaves a prayer off when turning it off ran into a problem', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true } }),
    });
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.setPrayerNotification('fajr', false);
    expect(harness.prayer().notifications.fajr).toBe(false);
  });
});

describe('setAllPrayerNotifications', () => {
  it('turns all five on at once', async () => {
    const harness = await prayerHarness(withPlace);

    await expect(harness.actions.setAllPrayerNotifications(true)).resolves.toBe('scheduled');
    expect(harness.prayer().notifications).toEqual({
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    });
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: true });
  });

  it('turns all five off at once', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({
        location: HYDERABAD,
        notifications: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
      }),
    });

    await harness.actions.setAllPrayerNotifications(false);
    expect(Object.values(harness.prayer().notifications).some(Boolean)).toBe(false);
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: false });
  });

  it('puts every switch back the way it was when permission is refused', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { isha: true } }),
    });
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.setAllPrayerNotifications(true);
    expect(harness.prayer().notifications).toEqual({
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: true,
    });
  });
});

describe('syncPrayerAlerts', () => {
  it('turns every prayer notification off once the permission is gone', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true, isha: true } }),
    });
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.syncPrayerAlerts();
    expect(Object.values(harness.prayer().notifications).some(Boolean)).toBe(false);
    expect(harness.syncAlerts.mock.calls[0]?.[1]).toEqual({ requestPermission: false });
  });

  /* Alerts that vanish without a word leave the user waiting for a prayer
     notification that can no longer arrive. */
  it('marks the alerts it had to turn off, so the settings can explain it', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true } }),
    });
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.syncPrayerAlerts();
    expect(harness.prayer().alertsBlocked).toBe(true);
    expect(harness.storage.written.prayer?.alertsBlocked).toBe(true);
  });

  it('marks nothing when there was no alert to lose', async () => {
    const harness = await prayerHarness(withPlace);
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.syncPrayerAlerts();
    expect(harness.prayer().alertsBlocked).toBe(false);
  });

  it('drops the mark as soon as the user chooses their alerts again', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, alertsBlocked: true }),
    });

    await harness.actions.setPrayerNotification('fajr', true);
    expect(harness.prayer().alertsBlocked).toBe(false);
  });

  const fine: PrayerAlertResult[] = ['scheduled', 'none'];

  it.each(fine)('leaves the switches alone when the sync reports %s', async (result) => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true } }),
    });
    harness.syncAlerts.mockResolvedValue(result);

    await harness.actions.syncPrayerAlerts();
    expect(harness.prayer().notifications.fajr).toBe(true);
  });

  it('has nothing to turn off when every prayer is already off', async () => {
    const harness = await prayerHarness(withPlace);
    harness.syncAlerts.mockResolvedValue('denied');

    await harness.actions.syncPrayerAlerts();
    expect(Object.values(harness.prayer().notifications).some(Boolean)).toBe(false);
  });

  it('plans from the time it is run', async () => {
    const harness = await prayerHarness({ ...withPlace, now: at(9, 20, 6) });
    harness.setNow(at(9, 21, 7, 30));

    await harness.actions.syncPrayerAlerts();
    expect(harness.syncAlerts.mock.calls[0]?.[0].now).toBe(at(9, 21, 7, 30));
  });
});

describe('updatePrayerSettings', () => {
  it('changes the Adhan volume without touching what is scheduled', async () => {
    const harness = await prayerHarness(withPlace);

    harness.actions.updatePrayerSettings({ adhanVolume: 0.3 });
    await flush();

    expect(harness.prayer().adhanVolume).toBe(0.3);
    expect(harness.syncAlerts).not.toHaveBeenCalled();
  });

  it('brings the scheduled notifications up to date for every other change', async () => {
    const harness = await prayerHarness(withPlace);

    harness.actions.updatePrayerSettings({ adhanEnabled: true });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);

    harness.actions.updatePrayerSettings({ adjustments: { fajr: 3 } });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(2);

    harness.actions.updatePrayerSettings({ adhan: { isha: false } });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(3);
  });

  /* Every scheduled alert carries its time in its identifier, so one tap on a
     minute stepper would otherwise rewrite all sixty of them. */
  it('rewrites the scheduled alerts once for a burst of changes', async () => {
    const harness = await prayerHarness(withPlace);

    harness.actions.updatePrayerSettings({ adjustments: { fajr: 1 } });
    harness.actions.updatePrayerSettings({ adjustments: { fajr: 2 } });
    harness.actions.updatePrayerSettings({ adjustments: { fajr: 3 } });
    await flush();

    expect(harness.prayer().adjustments.fajr).toBe(3);
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);
    expect(harness.syncAlerts.mock.calls[0]?.[0].prayer.adjustments.fajr).toBe(3);
  });

  it('still syncs when the volume changes together with something else', async () => {
    const harness = await prayerHarness(withPlace);

    harness.actions.updatePrayerSettings({ adhanVolume: 0.2, fajrAdhanSeparate: false });
    await flush();

    expect(harness.prayer().adhanVolume).toBe(0.2);
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);
  });

  it('keeps the Adhan settings on the phone', async () => {
    const harness = await prayerHarness();

    harness.actions.updatePrayerSettings({
      adhanEnabled: true,
      adhan: { fajr: false },
      adhanVolume: 0.25,
    });
    await flush();

    expect(harness.storage.written.prayer).toMatchObject({
      adhanEnabled: true,
      adhanVolume: 0.25,
    });
    expect(harness.storage.written.prayer?.adhan.fajr).toBe(false);
  });
});

describe('running syncs', () => {
  it('runs one sync at a time and covers later changes with a single follow-up', async () => {
    const harness = await prayerHarness(withPlace);
    const running = deferred<PrayerAlertResult>();
    harness.syncAlerts.mockReturnValueOnce(running.promise);

    harness.actions.updatePrayerSettings({ method: 'Karachi' });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);

    harness.actions.updatePrayerSettings({ asrMethod: 'hanafi' });
    harness.actions.updatePrayerSettings({ method: 'Egyptian' });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);

    running.resolve('scheduled');
    await flush();

    expect(harness.syncAlerts).toHaveBeenCalledTimes(2);
    expect(harness.syncAlerts.mock.calls[1]?.[0].prayer.method).toBe('Egyptian');
    expect(harness.syncAlerts.mock.calls[1]?.[0].prayer.asrMethod).toBe('hanafi');

    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(2);
  });

  it('asks the permission question only once, not again for the follow-up', async () => {
    const harness = await prayerHarness(withPlace);
    const running = deferred<PrayerAlertResult>();
    harness.syncAlerts.mockReturnValueOnce(running.promise);

    const turningOn = harness.actions.setPrayerNotification('fajr', true);
    await flush();
    harness.actions.updatePrayerSettings({ adhanEnabled: true });
    await flush();

    running.resolve('scheduled');
    await expect(turningOn).resolves.toBe('scheduled');
    await flush();

    expect(harness.syncAlerts.mock.calls.map((call) => call[1].requestPermission)).toEqual([
      true,
      false,
    ]);
  });

  it('survives a sync that throws', async () => {
    const harness = await prayerHarness(withPlace);
    harness.syncAlerts.mockRejectedValue(new Error('no notifications'));

    await expect(harness.actions.setPrayerNotification('fajr', true)).resolves.toBe('failed');
    expect(harness.prayer().notifications.fajr).toBe(false);
  });
});

describe('updateSettings', () => {
  it('re-words the prayer notifications when the clock or the language changes', async () => {
    const harness = await prayerHarness({
      prayer: prayerSettings({ location: HYDERABAD, notifications: { fajr: true } }),
    });

    harness.actions.updateSettings({ clockFormat: '24h' });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(1);
    expect(harness.syncAlerts.mock.calls[0]?.[0].clockFormat).toBe('24h');

    harness.actions.updateSettings({ language: 'ur' });
    await flush();
    expect(harness.syncAlerts).toHaveBeenCalledTimes(2);
    expect(harness.syncAlerts.mock.calls[1]?.[0].language).toBe('ur');
  });

  it('leaves the prayer notifications alone for unrelated settings', async () => {
    const harness = await prayerHarness(withPlace);

    harness.actions.updateSettings({ easyMode: true, theme: 'dark' });
    await flush();

    expect(harness.syncAlerts).not.toHaveBeenCalled();
  });
});
