/**
 * Adhan recordings bundled with the app, for playback inside the app (the
 * test button, and at prayer time while the app is open).
 *
 * Bundled recording: "Beautiful adhan" by Adam-synagda, from Wikimedia
 * Commons, released under the Creative Commons CC0 1.0 Universal Public
 * Domain Dedication (no conditions). Source:
 * https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
 * assets/sounds/adhan.mp3 is that recording as mono 96 kbps; adhan_short.wav
 * is its first 29.5 seconds, because iOS plays at most 30 seconds of a
 * notification sound.
 *
 * Only bundle recordings you have the right to distribute. To replace or add one:
 * 1. Put the full recording in assets/sounds as adhan.mp3, and optionally a
 *    separate Fajr Adhan as adhan_fajr.mp3.
 * 2. For iPhone notifications, also add a clip of at most 30 seconds as
 *    adhan_short.wav (and adhan_fajr_short.wav). Without it iPhones use the
 *    normal notification sound.
 * 3. Point the entries below at the full recordings, for example
 *    standard: require('../assets/sounds/adhan.mp3').
 *
 * app.config.ts registers the files in assets/sounds as notification sounds
 * by itself. With no recording, the Adhan settings explain that none is
 * included and prayer notifications use the normal notification sound.
 */
export const ADHAN_AUDIO: { standard: number | null; fajr: number | null } = {
  standard: require('../assets/sounds/adhan.mp3') as number,
  fajr: null,
};
