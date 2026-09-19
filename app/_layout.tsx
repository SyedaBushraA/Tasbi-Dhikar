import { DarkTheme, DefaultTheme, Stack, type Theme as NavigationTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { configureForegroundAdhan } from '@/services/adhanPlayer';
import { configureNotificationHandler } from '@/services/notifications';
import { prepareSounds } from '@/services/sound';
import { StoreProvider, useAppSelector, useStoreStatus } from '@/state';
import { appActions, appStore } from '@/state/appStore';

// Keep the splash screen up until saved data is loaded, so the right screen shows first.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureNotificationHandler();
configureForegroundAdhan(() => appStore.getState().prayer);

export default function RootLayout() {
  useEffect(() => {
    void appStore.hydrate().then(() => {
      void appActions.syncReminder();
      // Prayer notifications are planned days ahead; top them up on every start.
      void appActions.syncPrayerAlerts();
    });

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        if (appStore.getStatus().hydrated) void appActions.syncPrayerAlerts();
      } else {
        // Counts are written after a short pause; make sure nothing is pending when the app is left.
        void appStore.flush();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <StoreProvider store={appStore} actions={appActions}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </StoreProvider>
  );
}

function RootNavigator() {
  const { hydrated } = useStoreStatus();
  const onboardingCompleted = useAppSelector((state) => state.settings.onboardingCompleted);
  const soundEnabled = useAppSelector((state) => state.settings.soundEnabled);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, isDark]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  useEffect(() => {
    // Matches the area behind the screens (visible during transitions and with the keyboard open).
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  useEffect(() => {
    if (hydrated && soundEnabled) prepareSounds();
  }, [hydrated, soundEnabled]);

  if (!hydrated) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!onboardingCompleted}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingCompleted}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="dhikr/index" options={{ title: t('dhikr.selectTitle') }} />
          <Stack.Screen name="dhikr/custom" options={{ title: t('dhikr.createTitle') }} />
          <Stack.Screen name="target" options={{ title: t('dhikr.targetTitle') }} />
          <Stack.Screen name="reminder-time" options={{ title: t('settings.reminder.timeLabel') }} />
          <Stack.Screen name="privacy" options={{ title: t('settings.privacy.title') }} />
          <Stack.Screen name="prayer-settings" options={{ title: t('prayerSettings.title') }} />
          <Stack.Screen name="prayer-location" options={{ title: t('location.title') }} />
          <Stack.Screen name="prayer-method" options={{ title: t('prayerSettings.methodTitle') }} />
          <Stack.Screen
            name="prayer-adjustments"
            options={{ title: t('prayerSettings.adjustmentsTitle') }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
