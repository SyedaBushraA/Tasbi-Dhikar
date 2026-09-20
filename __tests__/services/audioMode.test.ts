import { setAudioModeAsync } from 'expo-audio';

import { applyAudioMode, releaseAdhanAudioMode } from '@/services/audioMode';

const audioMode = jest.mocked(setAudioModeAsync);

/*
 * The audio mode belongs to the whole app, so the counting sounds and the
 * Adhan have to agree on it. The tests below follow one after another on
 * purpose: the mode that is applied is remembered until it changes.
 */
describe('the shared audio mode', () => {
  it('asks for the polite mode before a counting sound', () => {
    applyAudioMode('quiet');

    expect(audioMode).toHaveBeenCalledTimes(1);
    expect(audioMode.mock.calls[0]?.[0]).toMatchObject({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    });
  });

  it('asks for a mode that is heard before the Adhan', () => {
    applyAudioMode('adhan');

    expect(audioMode.mock.calls[0]?.[0]).toMatchObject({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });
  });

  it('lets no counting sound quiet an Adhan that is playing', () => {
    applyAudioMode('quiet');
    applyAudioMode('quiet');

    expect(audioMode).not.toHaveBeenCalled();
  });

  it('comes back to the polite mode once the Adhan has ended', () => {
    releaseAdhanAudioMode();
    applyAudioMode('quiet');

    expect(audioMode).toHaveBeenCalledTimes(1);
    expect(audioMode.mock.calls[0]?.[0]).toMatchObject({ playsInSilentMode: false });
  });

  it('never asks twice for the mode that is already applied', () => {
    applyAudioMode('quiet');

    expect(audioMode).not.toHaveBeenCalled();
  });
});
