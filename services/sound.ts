import { type AudioPlayer, createAudioPlayer } from 'expo-audio';

import { applyAudioMode } from './audioMode';

/*
 * Two short sounds that ship inside the app, so they work offline. Players are
 * created the first time a sound is needed: users who keep sound off never
 * load the audio system at all.
 */
const SOURCES = {
  tick: require('../assets/sounds/tick.wav') as number,
  complete: require('../assets/sounds/complete.wav') as number,
};

type SoundName = keyof typeof SOURCES;

const VOLUME: Record<SoundName, number> = { tick: 0.6, complete: 0.8 };

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function getPlayer(name: SoundName): AudioPlayer {
  let player = players[name];
  if (!player) {
    player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUME[name];
    players[name] = player;
  }
  return player;
}

function play(name: SoundName): void {
  try {
    // Before every sound, because the Adhan needs the opposite mode.
    applyAudioMode('quiet');
    const player = getPlayer(name);
    // A finished sound stays at its end, so rewind before every play.
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => undefined);
  } catch {
    // Sound is optional. Counting continues without it.
  }
}

export function playTick(): void {
  play('tick');
}

export function playComplete(): void {
  play('complete');
}

/** Loads the sounds ahead of the first count so that one is not delayed. */
export function prepareSounds(): void {
  try {
    getPlayer('tick');
    getPlayer('complete');
  } catch {
    // See play().
  }
}

export function releaseSounds(): void {
  for (const name of Object.keys(players) as SoundName[]) {
    try {
      players[name]?.remove();
    } catch {
      // Already released.
    }
    delete players[name];
  }
}
