import {
  type City,
  cityLabel,
  distanceKm,
  nearestCity,
  normalizeForSearch,
  searchCities,
} from '@/constants/places';

const LONDON = { latitude: 51.5085, longitude: -0.1257 };
const PARIS = { latitude: 48.8534, longitude: 2.3488 };
/** Point Nemo: the place in the Pacific furthest from any land. */
const MIDDLE_OF_THE_OCEAN = { latitude: -48.8767, longitude: -123.3933 };

function names(cities: readonly City[]): string[] {
  return cities.map((city) => city.name);
}

describe('normalizeForSearch', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeForSearch('  São   Paulo ')).toBe('sao paulo');
    expect(normalizeForSearch('İstanbul')).toBe('istanbul');
    expect(normalizeForSearch('MAKKAH')).toBe('makkah');
    expect(normalizeForSearch('')).toBe('');
  });
});

describe('searchCities', () => {
  it('finds a city that exists twice, largest first', () => {
    const results = searchCities('Hyderabad');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]?.name).toBe('Hyderabad');
    expect(results[0]?.countryCode).toBe('IN');
    expect(results[1]?.countryCode).toBe('PK');
  });

  it('finds the holy cities by either spelling', () => {
    const makkah = searchCities('Mecca')[0];
    expect(makkah?.name).toBe('Makkah');
    expect(makkah?.countryCode).toBe('SA');
    expect(searchCities('Makkah')[0]?.name).toBe('Makkah');

    const madinah = searchCities('Medina')[0];
    expect(madinah?.name).toBe('Madinah');
    expect(madinah?.countryCode).toBe('SA');
  });

  it('finds a city under the name people grew up with', () => {
    const results = searchCities('Bombay');
    expect(results[0]?.name).toBe('Mumbai');
    expect(results[0]?.countryCode).toBe('IN');
  });

  it('finds a city typed without its accents and keeps the real spelling', () => {
    const results = searchCities('sao paulo');
    expect(results[0]?.name).toBe('São Paulo');
    expect(results[0]?.countryCode).toBe('BR');
  });

  it('puts names that start with the query before names that only contain it', () => {
    const results = names(searchCities('london'));
    expect(results.indexOf('East London')).toBeGreaterThan(results.indexOf('London'));
    expect(results.filter((name) => name === 'London')).toHaveLength(2);
  });

  it('never returns more than it was asked for', () => {
    expect(searchCities('a', 5)).toHaveLength(5);
    expect(searchCities('a', 1)).toHaveLength(1);
    expect(searchCities('Hyderabad', 1)).toHaveLength(1);
  });

  it('finds nothing for an empty or unknown query', () => {
    expect(searchCities('')).toEqual([]);
    expect(searchCities('   ')).toEqual([]);
    expect(searchCities('zzzzzzzzzz')).toEqual([]);
  });

  it('describes every city well enough to tell two of the same name apart', () => {
    for (const city of searchCities('Hyderabad')) {
      expect(city.name.length).toBeGreaterThan(0);
      expect(city.countryName.length).toBeGreaterThan(0);
      expect(city.timeZone.length).toBeGreaterThan(0);
      expect(Number.isFinite(city.latitude)).toBe(true);
      expect(Number.isFinite(city.longitude)).toBe(true);
    }
    expect(cityLabel({ name: 'Hyderabad', region: 'Telangana', countryName: 'India' })).toBe(
      'Hyderabad, Telangana, India',
    );
    expect(cityLabel({ name: 'Singapore', region: '', countryName: 'Singapore' })).toBe(
      'Singapore, Singapore',
    );
  });
});

describe('distanceKm', () => {
  it('measures a well known distance', () => {
    const distance = distanceKm(LONDON, PARIS);
    expect(distance).toBeGreaterThan(344 * 0.95);
    expect(distance).toBeLessThan(344 * 1.05);
  });

  it('is zero for the same place and the same in both directions', () => {
    expect(distanceKm(LONDON, LONDON)).toBeCloseTo(0, 6);
    expect(distanceKm(PARIS, LONDON)).toBeCloseTo(distanceKm(LONDON, PARIS), 6);
  });
});

describe('nearestCity', () => {
  it('names the city the coordinates belong to', () => {
    const city = nearestCity({ latitude: 17.384, longitude: 78.4564 });
    expect(city?.name).toBe('Hyderabad');
    expect(city?.countryCode).toBe('IN');
    expect(city?.timeZone).toBe('Asia/Kolkata');
  });

  it('still finds a place a few kilometres away', () => {
    const city = nearestCity({ latitude: 51.52, longitude: -0.09 });
    expect(city?.countryCode).toBe('GB');
    expect(city?.timeZone).toBe('Europe/London');
  });

  it('names nobody in the middle of the ocean', () => {
    expect(nearestCity(MIDDLE_OF_THE_OCEAN)).toBeNull();
    expect(nearestCity(MIDDLE_OF_THE_OCEAN, 50)).toBeNull();
  });

  it('respects how far it may look', () => {
    const faraway = { latitude: 17.384 + 2, longitude: 78.4564 };
    expect(nearestCity(faraway, 10)).toBeNull();
    expect(nearestCity(faraway, 400)?.countryCode).toBe('IN');
  });
});
