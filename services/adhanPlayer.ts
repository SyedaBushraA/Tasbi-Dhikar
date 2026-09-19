import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { ADHAN_AUDIO } from '@/constants/adhanAudio';
import type { PrayerSettings } from '@/types';
import type { AdhanChoice } from '@/utils/prayerSchedule';

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

/** Notices the end of the recording, so the test button switches back to "Play". */
function watchUntilFinished(): void {
  stopWatching();
  endTimer = setInterval(() => {
    const current = player;
    if (!current) {
      stopWatching();
      return;
    }
    const finished =
      !current.playing && current.duration > 0 && current.currentTime >= current.duration - 0.25;
    if (finished) {
      stopWatching();
      setState({ playing: false, recording: null });
    }
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
    if (!player || playerSource !== recording) {
      player?.remove();
      // Plays even with the ringer switch off: the user asked for the Adhan.
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
      }).catch(() => undefined);
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
  setState({ playing: false, recording: null });
}

/** Applies a new volume to a recording that is playing now. */
export function setAdhanVolume(volume: number): void {
  if (player) player.volume = Math.min(1, Math.max(0, volume));
}

function adhanOf(data: unknown): AdhanChoice {
  if (typeof data !== 'object' || data === null) return null;
  const adhan = (data as Record<string, unknown>).adhan;
  return adhan === 'standard' || adhan === 'fajr' ? adhan : null;
}

/**
 * Decides what happens when a notification arrives while the app is open.
 * A prayer notification with the Adhan plays the recording here, at the
 * user's volume, instead of the notification sound. Call once at start.
 */
export function configureForegroundAdhan(getPrayerSettings: () => PrayerSettings): void {
  setForegroundPresentation((data) => {
    if (notificationKind(data) !== 'prayer') return { playSound: false };
    const adhan = adhanOf(data);
    const settings = getPrayerSettings();
    if (adhan && settings.adhanEnabled && playAdhan(adhan, settings.adhanVolume)) {
      return { playSound: false };
    }
    return { playSound: true };
  });
}
