import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

/** Shown until a place is chosen: what the location is for, and the two ways to set it. */
export function PrayerSetup() {
  const { t } = useTranslation();

  const useMyLocation = useCallback(
    () => router.push({ pathname: '/prayer-location', params: { auto: '1' } }),
    [],
  );
  const chooseCity = useCallback(() => router.push('/prayer-location'), []);

  return (
    <View style={styles.setup} testID="prayer-setup">
      <AppText variant="heading" accessibilityRole="header">
        {t('prayer.setup.title')}
      </AppText>
      <View style={styles.texts}>
        <AppText variant="body">{t('prayer.setup.intro')}</AppText>
        <AppText variant="body">{t('prayer.locationPurpose')}</AppText>
        <AppText variant="body" tone="muted">
          {t('prayer.setup.privacy')}
        </AppText>
      </View>
      <View style={styles.buttons}>
        <AppButton
          label={t('location.useMyLocation')}
          icon="locate-outline"
          fullWidth
          onPress={useMyLocation}
          accessibilityHint={t('prayer.setup.useMyLocationHint')}
          testID="prayer-use-my-location"
        />
        <AppButton
          label={t('location.chooseCity')}
          icon="search-outline"
          variant="secondary"
          fullWidth
          onPress={chooseCity}
          accessibilityHint={t('prayer.setup.chooseCityHint')}
          testID="prayer-choose-city"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  setup: { gap: SPACING.xl, paddingTop: SPACING.lg },
  texts: { gap: SPACING.md },
  buttons: { gap: SPACING.md },
});
