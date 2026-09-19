/*
 * Offline list of cities, from GeoNames (https://www.geonames.org), licensed
 * under CC BY 4.0: every city with at least 100,000 people plus all capitals
 * and larger regional capitals. The list is loaded on first use only.
 */

export interface City {
  name: string;
  /** State or province. */
  region: string;
  countryCode: string;
  countryName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
}

type CityRow = [
  name: string,
  asciiName: string | 0,
  region: string,
  countryCode: string,
  latitude: number,
  longitude: number,
  timeZoneIndex: number,
  population: number,
  aliases: string | 0,
];

interface PlacesData {
  timeZones: string[];
  countries: Record<string, string>;
  cities: CityRow[];
}

interface IndexedCity {
  city: City;
  /** Lower-case names without accents, to match what people type. */
  searchNames: string[];
}

let index: IndexedCity[] | null = null;

/** Lower case, accents removed, so "Sao Paulo" finds "São Paulo". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function loadIndex(): IndexedCity[] {
  if (index) return index;
  const data = require('./cities.json') as PlacesData;
  index = data.cities.map((row) => {
    const [name, asciiName, region, countryCode, latitude, longitude, timeZoneIndex, population, aliases] = row;
    const names = [name, ...(asciiName ? [asciiName] : []), ...(aliases ? aliases.split('|') : [])];
    return {
      city: {
        name,
        region,
        countryCode,
        countryName: data.countries[countryCode] ?? countryCode,
        latitude,
        longitude,
        timeZone: data.timeZones[timeZoneIndex] ?? '',
        population,
      },
      searchNames: [...new Set(names.map(normalizeForSearch))],
    };
  });
  return index;
}

/**
 * Cities whose name (or a well-known other spelling) matches the query.
 * Names that start with the query come first, then larger cities first.
 */
export function searchCities(query: string, limit = 30): City[] {
  const needle = normalizeForSearch(query);
  if (needle.length === 0) return [];

  const starts: City[] = [];
  const contains: City[] = [];
  // The list is sorted by population, so each group stays largest first.
  for (const entry of loadIndex()) {
    if (entry.searchNames.some((name) => name.startsWith(needle))) starts.push(entry.city);
    else if (needle.length >= 3 && entry.searchNames.some((name) => name.includes(needle))) {
      contains.push(entry.city);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The listed city closest to a position, if one is within `maxKm`. */
export function nearestCity(
  position: { latitude: number; longitude: number },
  maxKm = 100,
): City | null {
  let best: City | null = null;
  let bestDistance = Infinity;
  for (const { city } of loadIndex()) {
    const distance = distanceKm(position, city);
    if (distance < bestDistance) {
      best = city;
      bestDistance = distance;
    }
  }
  return best && bestDistance <= maxKm ? best : null;
}

/** "Hyderabad, Telangana, India" style label. */
export function cityLabel(city: Pick<City, 'name' | 'region' | 'countryName'>): string {
  return [city.name, city.region, city.countryName].filter(Boolean).join(', ');
}
