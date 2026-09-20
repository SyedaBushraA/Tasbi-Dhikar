import {
  adhanPlaybackAvailable,
  configureForegroundAdhan,
  getAdhanPlayback,
  stopAdhan,
} from '@/services/adhanPlayer';
import { type ForegroundPresentation, setForegroundPresentation } from '@/services/notifications';
import type { PrayerSettings } from '@/types';

import { prayerSettings } from '../helpers/prayer';

// The decision is registered instead of being handed to the notification
// module, so the test can ask it the questions a prayer notification asks.
jest.mock('@/services/notifications', () => ({
  ...jest.requireActual<typeof import('@/services/notifications')>('@/services/notifications'),
  setForegroundPresentation: jest.fn(),
}));

function decisionFor(settings: PrayerSettings): (data: unknown) => ForegroundPresentation {
  configureForegroundAdhan(() => settings);
  const calls = jest.mocked(setForegroundPresentation).mock.calls;
  const decide = calls[calls.length - 1]?.[0];
  if (!decide) throw new Error('no foreground decision was registered');
  return decide;
}

const withAdhan = prayerSettings({
  notifications: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  adhanEnabled: true,
});

afterEach(() => {
  stopAdhan();
});

/*
 * While the app is open the Adhan is played by the app itself, so what counts
 * is the recordings bundled for playback, not the notification sounds.
 */
describe('the Adhan while a prayer notification arrives', () => {
  it('has a recording to play in this build', () => {
    expect(adhanPlaybackAvailable().standard).toBe(true);
  });

  it('plays the recording itself instead of the notification sound', () => {
    const decide = decisionFor(withAdhan);

    expect(decide({ kind: 'prayer', prayer: 'asr', adhan: null })).toEqual({ playSound: false });
    expect(getAdhanPlayback()).toEqual({ playing: true, recording: 'standard' });
  });

  it('leaves the notification its own sound for a prayer without the Adhan', () => {
    const decide = decisionFor(prayerSettings({ adhanEnabled: true, adhan: { asr: false } }));

    expect(decide({ kind: 'prayer', prayer: 'asr', adhan: null })).toEqual({ playSound: true });
    expect(getAdhanPlayback().playing).toBe(false);
  });

  it('leaves the notification its own sound while the Adhan is off', () => {
    const decide = decisionFor(prayerSettings({ adhanEnabled: false }));

    expect(decide({ kind: 'prayer', prayer: 'fajr', adhan: null })).toEqual({ playSound: true });
    expect(getAdhanPlayback().playing).toBe(false);
  });

  it('plays nothing for a notification that is not a prayer', () => {
    const decide = decisionFor(withAdhan);

    expect(decide({ kind: 'reminder' })).toEqual({ playSound: false });
    expect(getAdhanPlayback().playing).toBe(false);
  });

  it('falls back to the notification sound when the payload names no prayer', () => {
    const decide = decisionFor(withAdhan);

    expect(decide({ kind: 'prayer' })).toEqual({ playSound: true });
    expect(getAdhanPlayback().playing).toBe(false);
  });
});
