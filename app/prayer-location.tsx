import { router, useLocalSearchParams } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';

import { CitySearch } from '@/components/location/CitySearch';
import { CoordinatesForm } from '@/components/location/CoordinatesForm';
import { CurrentLocation } from '@/components/location/CurrentLocation';
import { LocateButton } from '@/components/location/LocateButton';
import { LocateNotice, type LocateProblem } from '@/components/location/LocateNotice';
import { AppText, Screen } from '@/components/ui';
import type { City } from '@/constants/places';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import type { LocateResult } from '@/state/prayerActions';
import type { PrayerLocation } from '@/types';

export default function PrayerLocationScreen() {
  const params = useLocalSearchParams<{ auto?: string }>();
  const location = useAppSelector((state) => state.prayer.location);
  const methodConfirmed = useAppSelector((state) => state.prayer.methodConfirmed);
  const actions = useAppActions();
  const { t } = useTranslation();

  // The header sits above this view, so the keyboard overlap is measured from below it.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<LocateProblem | null>(null);
  const busyRef = useRef(false);
  const leaving = useRef(false);
  const autoStarted = useRef(false);

  const finish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    // Choosing a place never confirms a method, so the method is shown first when it is still assumed.
    if (!methodConfirmed) router.replace('/prayer-method');
    else if (router.canGoBack()) router.back();
    else router.replace('/prayer');
  }, [methodConfirmed]);

  const apply = useCallback(
    (next: PrayerLocation) => {
      actions.setPrayerLocation(next);
      finish();
    },
    [actions, finish],
  );

  const locate = useCallback(async (): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setProblem(null);

    let result: LocateResult;
    try {
      result = await actions.locateAutomatically();
    } catch {
      result = { status: 'failed' };
    }

    // The button stays disabled while the screen is on its way out.
    if (result.status === 'ok') {
      finish();
      return;
    }
    setProblem(result.status);
    busyRef.current = false;
    setBusy(false);
  }, [actions, finish]);

  const auto = params.auto;
  useEffect(() => {
    // Coming from "Use my location" elsewhere: ask straight away, once.
    if (auto !== '1' || autoStarted.current) return;
    autoStarted.current = true;
    void locate();
  }, [auto, locate]);

  const selectCity = useCallback(
    (city: City) => {
      apply({
        source: 'city',
        name: city.name,
        ...(city.region ? { region: city.region } : {}),
        ...(city.countryCode ? { countryCode: city.countryCode } : {}),
        latitude: city.latitude,
        longitude: city.longitude,
        ...(city.timeZone ? { timeZone: city.timeZone } : {}),
        updatedAt: Date.now(),
      });
    },
    [apply],
  );

  const header = (
    <View>
      <View style={styles.intro}>
        <AppText variant="body">{t('prayer.locationPurpose')}</AppText>
        <AppText variant="caption" tone="muted">
          {t('location.privacy')}
        </AppText>
      </View>
      <CurrentLocation location={location} testID="prayer-location-current" />
      <View style={styles.locate}>
        <LocateButton busy={busy} onPress={() => void locate()} testID="prayer-location-locate" />
        {problem ? <LocateNotice problem={problem} testID="prayer-location-notice" /> : null}
      </View>
    </View>
  );

  const footer = <CoordinatesForm onSubmit={apply} testID="prayer-location-coordinates" />;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={styles.fill}
    >
      <Screen edges={['left', 'right', 'bottom']} testID="prayer-location-screen">
        <CitySearch
          onSelect={selectCity}
          header={header}
          footer={footer}
          testID="prayer-location-search"
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  intro: { gap: SPACING.sm, marginBottom: SPACING.xl },
  locate: { gap: SPACING.md, marginBottom: SPACING.xl },
});
