import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerLocation } from '@/types';
import { dayKeyToDate, formatDayKey } from '@/utils/date';

import { locationLabel } from './labels';

export interface PrayerDayHeaderProps {
  /** The day the times belong to, YYYY-MM-DD. */
  dayKey: string;
  location: PrayerLocation;
}

/** "Friday, 20 September 2026", falling back to the shorter format of the app. */
function formatLongDay(dayKey: string, locale: string): string {
  const date = dayKeyToDate(dayKey);
  try {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return formatDayKey(dayKey, locale);
  }
}

/** The day the times are for and the place they are calculated for. */
export const PrayerDayHeader = memo(function PrayerDayHeader({
  dayKey,
  location,
}: PrayerDayHeaderProps) {
  const { t, locale } = useTranslation();
  const changeLocation = useCallback(() => router.push('/prayer-location'), []);

  const date = formatLongDay(dayKey, locale);
  const place = locationLabel(location, locale);

  return (
    <View style={styles.header}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${date}, ${place}`}
        style={styles.texts}
      >
        <AppText variant="heading">{date}</AppText>
        <AppText variant="body" tone="muted">
          {place}
        </AppText>
      </View>
      <AppButton
        label={t('prayer.changeLocation')}
        variant="ghost"
        onPress={changeLocation}
        accessibilityLabel={t('prayer.a11y.changeLocation')}
        accessibilityHint={t('prayer.a11y.changeLocationHint')}
        style={styles.change}
        testID="prayer-change-location"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  texts: { flex: 1, gap: SPACING.xs },
  change: { paddingHorizontal: SPACING.sm },
});
