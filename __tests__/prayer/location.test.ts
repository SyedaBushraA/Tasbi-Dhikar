import { locateDevice, toPrayerLocation } from '@/services/location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 },
}));

interface Position {
  coords: { latitude: number; longitude: number };
}

interface ExpoLocationMock {
  requestForegroundPermissionsAsync: jest.Mock<Promise<{ granted: boolean }>, []>;
  hasServicesEnabledAsync: jest.Mock<Promise<boolean>, []>;
  getLastKnownPositionAsync: jest.Mock<Promise<Position | null>, [unknown]>;
  getCurrentPositionAsync: jest.Mock<Promise<Position>, [unknown]>;
  Accuracy: Record<string, number>;
}

const expoLocation = jest.requireMock<ExpoLocationMock>('expo-location');

const HYDERABAD_POSITION: Position = { coords: { latitude: 17.3841234, longitude: 78.4563999 } };
const MAKKAH_POSITION: Position = { coords: { latitude: 21.4266, longitude: 39.8256 } };

beforeEach(() => {
  expoLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  expoLocation.hasServicesEnabledAsync.mockResolvedValue(true);
  expoLocation.getLastKnownPositionAsync.mockResolvedValue(null);
  expoLocation.getCurrentPositionAsync.mockResolvedValue(MAKKAH_POSITION);
});

describe('toPrayerLocation', () => {
  it('names the place after the nearest city in the offline list', () => {
    expect(toPrayerLocation(17.3841234, 78.4563999, 1_700_000_000_000)).toEqual({
      source: 'automatic',
      name: 'Hyderabad',
      region: 'Telangana',
      countryCode: 'IN',
      timeZone: 'Asia/Kolkata',
      latitude: 17.384,
      longitude: 78.456,
      updatedAt: 1_700_000_000_000,
    });
  });

  it('keeps only three decimals, which is about a hundred metres', () => {
    const place = toPrayerLocation(21.42669999, 39.82561111, 1);
    expect(place.latitude).toBe(21.427);
    expect(place.longitude).toBe(39.826);
  });

  it('falls back to the coordinates where no city is close', () => {
    expect(toPrayerLocation(0, -30, 1_700_000_000_000)).toEqual({
      source: 'automatic',
      name: '0.0000° N, 30.0000° W',
      latitude: 0,
      longitude: -30,
      updatedAt: 1_700_000_000_000,
    });
  });
});

describe('locateDevice', () => {
  it('uses a recent position when the phone already has one', async () => {
    expoLocation.getLastKnownPositionAsync.mockResolvedValue(HYDERABAD_POSITION);

    await expect(locateDevice()).resolves.toEqual({
      status: 'ok',
      location: {
        source: 'automatic',
        name: 'Hyderabad',
        region: 'Telangana',
        countryCode: 'IN',
        timeZone: 'Asia/Kolkata',
        latitude: 17.384,
        longitude: 78.456,
        updatedAt: expect.any(Number),
      },
    });
    expect(expoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('reads the position once when the phone has none stored', async () => {
    const result = await locateDevice();

    expect(result).toEqual({
      status: 'ok',
      location: expect.objectContaining({ name: 'Makkah', countryCode: 'SA' }),
    });
    expect(expoLocation.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
  });

  it('never reads a position after the permission was refused', async () => {
    expoLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(locateDevice()).resolves.toEqual({ status: 'denied' });
    expect(expoLocation.getLastKnownPositionAsync).not.toHaveBeenCalled();
    expect(expoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(expoLocation.hasServicesEnabledAsync).not.toHaveBeenCalled();
  });

  it('reports that no position is available while location services are off', async () => {
    expoLocation.hasServicesEnabledAsync.mockResolvedValue(false);

    await expect(locateDevice()).resolves.toEqual({ status: 'unavailable' });
    expect(expoLocation.getLastKnownPositionAsync).not.toHaveBeenCalled();
    expect(expoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('gives up when the phone never reports a position', async () => {
    jest.useFakeTimers();
    try {
      expoLocation.getCurrentPositionAsync.mockReturnValue(new Promise<Position>(() => undefined));
      const pending = locateDevice();

      await jest.advanceTimersByTimeAsync(20_000);
      await expect(pending).resolves.toEqual({ status: 'unavailable' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('reports a failure when the permission question itself fails', async () => {
    expoLocation.requestForegroundPermissionsAsync.mockRejectedValue(new Error('no provider'));

    await expect(locateDevice()).resolves.toEqual({ status: 'failed' });
  });

  it('reports a failure when reading the position throws', async () => {
    expoLocation.getCurrentPositionAsync.mockRejectedValue(new Error('no signal'));

    await expect(locateDevice()).resolves.toEqual({ status: 'failed' });
  });

  it('only ever asks for the position while the app is in use', async () => {
    await locateDevice();

    expect(expoLocation.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(expoLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: expoLocation.Accuracy.Low,
    });
  });
});
