import * as Location from 'expo-location';

import { nearestCity } from '@/constants/places';
import type { LocateResult } from '@/state/prayerActions';
import type { PrayerLocation } from '@/types';
import { formatCoordinate, roundCoordinate } from '@/utils/prayer';

/*
 * The position is read once, when the user asks for it, only to calculate
 * prayer times. It is never tracked, never sent anywhere and only the rounded
 * coordinates are stored on the phone. The place name comes from the offline
 * city list, so no geocoding service is contacted either.
 */

/** A recent position is good enough: prayer times barely change within a few kilometres. */
const LAST_KNOWN_MAX_AGE_MS = 30 * 60 * 1000;
const LAST_KNOWN_ACCURACY_M = 5000;
const POSITION_TIMEOUT_MS = 20000;
const NEAREST_CITY_MAX_KM = 50;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function toPrayerLocation(latitude: number, longitude: number, now: number): PrayerLocation {
  const position = { latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) };
  const city = nearestCity(position, NEAREST_CITY_MAX_KM);
  if (city) {
    return {
      source: 'automatic',
      name: city.name,
      region: city.region || undefined,
      countryCode: city.countryCode,
      timeZone: city.timeZone || undefined,
      ...position,
      updatedAt: now,
    };
  }
  return {
    source: 'automatic',
    name: `${formatCoordinate(position.latitude, 'latitude')}, ${formatCoordinate(position.longitude, 'longitude')}`,
    ...position,
    updatedAt: now,
  };
}

/** Reads the position of the phone once. Asks for the location permission when needed. */
export async function locateDevice(): Promise<LocateResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
    if (!(await Location.hasServicesEnabledAsync())) return { status: 'unavailable' };

    const position =
      (await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
        requiredAccuracy: LAST_KNOWN_ACCURACY_M,
      })) ??
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        POSITION_TIMEOUT_MS,
      ));
    if (!position) return { status: 'unavailable' };

    return {
      status: 'ok',
      location: toPrayerLocation(position.coords.latitude, position.coords.longitude, Date.now()),
    };
  } catch {
    return { status: 'failed' };
  }
}
