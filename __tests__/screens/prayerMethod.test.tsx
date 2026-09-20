import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import PrayerMethodScreen from '@/app/prayer-method';
import type { PrayerLocation } from '@/types';

import { renderWithStore } from '../helpers/render';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      navigate: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      canDismiss: jest.fn(() => true),
      dismissTo: jest.fn(),
    },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (effect: () => undefined | (() => void)) => useEffect(effect, [effect]),
  };
});

const PLACE: PrayerLocation = {
  source: 'city',
  name: 'Hyderabad',
  region: 'Telangana',
  countryCode: 'IN',
  latitude: 17.384,
  longitude: 78.456,
  timeZone: 'Asia/Kolkata',
  updatedAt: 0,
};

beforeEach(() => {
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

/* The method screen is opened from the prayer settings as well as from the
   prayer times, and confirming must not throw the user out of either. */
describe('confirming the calculation method', () => {
  it('returns the way the user came', async () => {
    const harness = await renderWithStore(<PrayerMethodScreen />, {
      state: { prayer: { location: PLACE } },
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-method-save'));
    });

    expect(harness.store.getState().prayer.methodConfirmed).toBe(true);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.dismissTo).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows the prayer times when there is nothing to go back to', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    await renderWithStore(<PrayerMethodScreen />, { state: { prayer: { location: PLACE } } });

    await act(async () => {
      fireEvent.press(screen.getByTestId('prayer-method-save'));
    });

    expect(router.replace).toHaveBeenCalledWith('/prayer');
    expect(router.back).not.toHaveBeenCalled();
  });
});
