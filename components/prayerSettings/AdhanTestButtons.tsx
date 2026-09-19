import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  type AdhanPlayback,
  getAdhanPlayback,
  playAdhan,
  stopAdhan,
  subscribeAdhanPlayback,
} from '@/services/adhanPlayer';

export interface AdhanTestButtonsProps {
  /** 0 to 1, the volume the test is played at. */
  volume: number;
  /** Which recordings are bundled for playback inside the app. */
  available: { standard: boolean; fajr: boolean };
  /** Offer the Fajr recording separately. Easy Mode keeps to the one button. */
  showFajr: boolean;
  testID?: string;
}

/** Hears what the Adhan sounds like, at the chosen volume, without waiting for a prayer. */
export function AdhanTestButtons({ volume, available, showFajr, testID }: AdhanTestButtonsProps) {
  const { t } = useTranslation();
  const [playback, setPlayback] = useState<AdhanPlayback>(getAdhanPlayback);

  useEffect(() => subscribeAdhanPlayback(setPlayback), []);

  // Nothing keeps playing once the user leaves this screen.
  useFocusEffect(
    useCallback(() => {
      return () => stopAdhan();
    }, []),
  );

  const anyAvailable = available.standard || available.fajr;

  if (playback.playing) {
    return (
      <AppButton
        icon="stop"
        label={t('prayerSettings.adhan.stop')}
        onPress={stopAdhan}
        fullWidth
        testID={testID ? `${testID}-stop` : undefined}
      />
    );
  }

  return (
    <View style={styles.buttons}>
      <AppButton
        icon="play"
        label={t('prayerSettings.adhan.test')}
        onPress={() => {
          playAdhan(available.standard ? 'standard' : 'fajr', volume);
        }}
        disabled={!anyAvailable}
        fullWidth
        testID={testID ? `${testID}-play` : undefined}
      />
      {showFajr && available.fajr && available.standard ? (
        <AppButton
          variant="secondary"
          icon="play-outline"
          label={t('prayerSettings.adhan.testFajr')}
          onPress={() => {
            playAdhan('fajr', volume);
          }}
          fullWidth
          testID={testID ? `${testID}-play-fajr` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: SPACING.sm },
});
