import { setAudioModeAsync } from 'expo-audio';

/*
 * The audio mode belongs to the whole app, not to a single player, so the two
 * sounds Tasbi plays have to agree on it. The counting sounds are polite: they
 * respect the silent switch and mix with a recitation playing in another app.
 * The Adhan is the opposite, because the user asked to hear it at that moment.
 * Whichever is about to play sets the mode first, and the Adhan keeps it until
 * it ends so a count cannot quiet it halfway through.
 */

export type AudioUse = 'quiet' | 'adhan';

const MODES = {
  quiet: { playsInSilentMode: false, interruptionMode: 'mixWithOthers' },
  adhan: { playsInSilentMode: true, interruptionMode: 'duckOthers' },
} as const;

let applied: AudioUse | null = null;
let adhanHolds = false;

/** Sets the mode the sound that is about to play needs. */
export function applyAudioMode(use: AudioUse): void {
  if (use === 'adhan') adhanHolds = true;
  else if (adhanHolds) return;

  if (applied === use) return;
  applied = use;
  setAudioModeAsync({ ...MODES[use], shouldPlayInBackground: false }).catch(() => {
    // Only a preference: without it the phone's own default applies. Forgetting
    // it here means the next sound asks for the mode again.
    if (applied === use) applied = null;
  });
}

/** The Adhan has finished, so the quiet mode may come back. */
export function releaseAdhanAudioMode(): void {
  adhanHolds = false;
}
