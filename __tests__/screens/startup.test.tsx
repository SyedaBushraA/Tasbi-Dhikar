import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import HistoryScreen from '@/app/(tabs)/history';
import CounterScreen from '@/app/(tabs)/index';
import PrayerScreen from '@/app/(tabs)/prayer';
import SettingsScreen from '@/app/(tabs)/settings';
import StatisticsScreen from '@/app/(tabs)/statistics';
import RootLayout from '@/app/_layout';
import CustomDhikrScreen from '@/app/dhikr/custom';
import ChooseDhikrScreen from '@/app/dhikr/index';
import PrayerAdjustmentsScreen from '@/app/prayer-adjustments';
import PrayerLocationScreen from '@/app/prayer-location';
import PrayerMethodScreen from '@/app/prayer-method';
import PrayerSettingsScreen from '@/app/prayer-settings';
import PrivacyScreen from '@/app/privacy';
import ReminderTimeScreen from '@/app/reminder-time';
import TargetScreen from '@/app/target';
import WelcomeScreen from '@/app/welcome';
import { translate } from '@/i18n';
import { appStore } from '@/state/appStore';

const routes = {
  _layout: RootLayout,
  welcome: WelcomeScreen,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': CounterScreen,
  '(tabs)/prayer': PrayerScreen,
  '(tabs)/history': HistoryScreen,
  '(tabs)/statistics': StatisticsScreen,
  '(tabs)/settings': SettingsScreen,
  'dhikr/index': ChooseDhikrScreen,
  'dhikr/custom': CustomDhikrScreen,
  target: TargetScreen,
  'reminder-time': ReminderTimeScreen,
  privacy: PrivacyScreen,
  'prayer-settings': PrayerSettingsScreen,
  'prayer-location': PrayerLocationScreen,
  'prayer-method': PrayerMethodScreen,
  'prayer-adjustments': PrayerAdjustmentsScreen,
};

/** renderRouter runs on fake timers, so screens are let through by hand. */
async function settle(): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
}

describe('app start', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // The app store is one module-wide instance, so this file renders the app once.
  it('shows the welcome screen on first launch and opens the counter after skipping', async () => {
    renderRouter(routes, { initialUrl: '/' });

    await act(async () => {
      await appStore.hydrate();
    });
    await settle();

    expect(screen.getByText(translate('en', 'welcome.title'))).toBeTruthy();
    expect(screen.queryByTestId('counter-screen')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: translate('en', 'welcome.skip') }));
    });
    await settle();

    expect(screen.getByTestId('counter-screen')).toBeTruthy();
    expect(appStore.getState().settings.onboardingCompleted).toBe(true);
  });
});
