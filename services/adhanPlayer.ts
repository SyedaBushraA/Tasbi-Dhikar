import { type AudioPlayer, createAudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

import { ADHAN_AUDIO } from '@/constants/adhanAudio';
import { SALAH_ORDER } from '@/constants/prayer';
import type { PrayerSettings, SalahName } from '@/types';
import { adhanChoiceFor } from '@/utils/prayerSchedule';

import { applyAudioMode, releaseAdhanAudioMode } from './audioMode';
import { notificationKind, setForegroundPresentation } from './notifications';

/*
 * Plays a bundled Adhan recording inside the app: when the user presses the
 * test button, and at prayer time while the app is open. Nothing plays unless
 * the user turned the Adhan on. When the app is closed the Adhan is the
 * notification's sound instead, which the phone controls.
 */

type Recording = 'standard' | 'fajr';

export interface AdhanPlayback {
  playing: boolean;
  recording: Recording | null;
}

let player: AudioPlayer | null = null;
let playerSource: Recording | null = null;
let state: AdhanPlayback = { playing: false, recording: null };
const listeners = new Set<(playback: AdhanPlayback) => void>();
let endTimer: ReturnType<typeof setInterval> | null = null;

/** Which recordings can be played inside the app. */
export function adhanPlaybackAvailable(): { standard: boolean; fajr: boolean } {
  return { standard: ADHAN_AUDIO.standard !== null, fajr: ADHAN_AUDIO.fajr !== null };
}

function setState(next: AdhanPlayback): void {
  if (next.playing === state.playing && next.recording === state.recording) return;
  state = next;
  listeners.forEach((listener) => listener(state));
}

export function getAdhanPlayback(): AdhanPlayback {
  return state;
}

export function subscribeAdhanPlayback(listener: (playback: AdhanPlayback) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function stopWatching(): void {
  if (endTimer !== null) {
    clearInterval(endTimer);
    endTimer = null;
  }
}

/**
 * Notices when the recording stops, so the test button switches back to
 * "Play". Anything that ends playback counts, not only reaching the end: a
 * phone call or another app taking over must not leave the timer running.
 */
function watchUntilFinished(): void {
  stopWatching();
  let started = false;
  endTimer = setInterval(() => {
    const current = player;
    if (!current) {
      stopWatching();
      releaseAdhanAudioMode();
      return;
    }
    // Playback needs a moment to start; only then does "not playing" mean it ended.
    if (current.playing) {
      started = true;
      return;
    }
    if (!started) return;
    stopWatching();
    releaseAdhanAudioMode();
    setState({ playing: false, recording: null });
  }, 500);
}

function resolveRecording(requested: Recording): Recording | null {
  if (requested === 'fajr' && ADHAN_AUDIO.fajr !== null) return 'fajr';
  return ADHAN_AUDIO.standard !== null ? 'standard' : null;
}

/** Plays an Adhan recording at a volume from 0 to 1. Returns false if none is bundled. */
export function playAdhan(requested: Recording, volume: number): boolean {
  const recording = resolveRecording(requested);
  const source = recording ? ADHAN_AUDIO[recording] : null;
  if (!recording || source === null) return false;

  try {
    // Plays even with the ringer switch off: the user asked for the Adhan.
    applyAudioMode('adhan');
    if (!player || playerSource !== recording) {
      player?.remove();
      player = createAudioPlayer(source);
      playerSource = recording;
    }
    const current = player;
    current.volume = Math.min(1, Math.max(0, volume));
    current
      .seekTo(0)
      .then(() => current.play())
      .catch(() => undefined);
    setState({ playing: true, recording });
    watchUntilFinished();
    return true;
  } catch {
    setState({ playing: false, recording: null });
    return false;
  }
}

export function stopAdhan(): void {
  stopWatching();
  try {
    player?.pause();
  } catch {
    // Already stopped.
  }
  // The counting sounds may be polite again.
  releaseAdhanAudioMode();
  setState({ playing: false, recording: null });
}

// The app does not play in the background, so leaving the screen ends the
// recording. Without this the watchdog would keep ticking while the app sleeps
// and the button would still say "Stop" when the user comes back.
AppState.addEventListener('change', (next) => {
  if (next === 'background' && state.playing) stopAdhan();
});

/** Applies a new volume to a recording that is playing now. */
export function setAdhanVolume(volume: number): void {
  if (player) player.volume = Math.min(1, Math.max(0, volume));
}

function prayerOf(data: unknown): SalahName | null {
  if (typeof data !== 'object' || data === null) return null;
  const prayer = (data as Record<string, unknown>).prayer;
  return SALAH_ORDER.find((name) => name === prayer) ?? null;
}

/**
 * Decides what happens when a notification arrives while the app is open.
 * A prayer whose Adhan is on plays the recording here, at the user's volume,
 * instead of the notification sound. What can be played in the app is decided
 * by the recordings in the app, not by the notification sound files, so the
 * Adhan is still heard on a build that carries only the playable recording.
 * Call once at start.
 */
export function configureForegroundAdhan(getPrayerSettings: () => PrayerSettings): void {
  setForegroundPresentation((data) => {
    if (notificationKind(data) !== 'prayer') return { playSound: false };
    const prayer = prayerOf(data);
    if (prayer === null) return { playSound: true };

    const settings = getPrayerSettings();
    const choice = adhanChoiceFor(prayer, settings, adhanPlaybackAvailable());
    if (choice && playAdhan(choice, settings.adhanVolume)) return { playSound: false };
    return { playSound: true };
  });
}
