import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { ClockFormat, PrayerName } from '@/types';

import { formatPrayerTime, prayerNameKey } from './labels';

export interface PrayerTimeRowProps {
  name: PrayerName;
  /** Null when the time does not exist at this place on this day. */
  time: number | null;
  /** The prayer that is coming next today. */
  isNext: boolean;
  /** Already passed today. Only dims the row; the time itself still reads normally. */
  isPast: boolean;
  clockFormat: ClockFormat;
  testID?: string;
}

/** One prayer of the day: the name at the start, the time at the end. */
export const PrayerTimeRow = memo(function PrayerTimeRow({
  name,
  time,
  isNext,
  isPast,
  clockFormat,
  testID,
}: PrayerTimeRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const prayerName = t(prayerNameKey(name));
  const timeText = formatPrayerTime(time, clockFormat, t);
  // Sunrise is in the list because it ends the Fajr time, not because it is a prayer.
  const note = name === 'sunrise' ? t('prayer.sunriseNote') : undefined;

  // The dash for a missing time says nothing when it is read out.
  const spokenTime = time === null ? t('prayer.a11y.timeUnavailable') : timeText;
  const parts = [t('prayer.a11y.row', { prayer: prayerName, time: spokenTime })];
  if (note !== undefined) parts.push(note);
  if (isNext) parts.push(t('prayer.a11y.nextTag'));

  const tone = isPast && !isNext ? 'muted' : 'default';
  const emphasis = isNext ? styles.emphasis : undefined;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={parts.join(', ')}
      testID={testID}
      style={[
        styles.row,
        { minHeight: theme.touchTarget },
        isNext && { backgroundColor: colors.primarySoft },
      ]}
    >
      <View style={styles.texts}>
        <AppText variant="body" tone={tone} style={emphasis}>
          {prayerName}
        </AppText>
        {note ? (
          <AppText variant="caption" tone="muted">
            {note}
          </AppText>
        ) : null}
      </View>
      {isNext ? (
        <View style={[styles.tag, { backgroundColor: colors.primary }]}>
          <AppText variant="caption" tone="onPrimary">
            {t('prayer.nextTag')}
          </AppText>
        </View>
      ) : null}
      <AppText variant="body" tone={tone} style={emphasis}>
        {timeText}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  texts: { flex: 1, gap: 2 },
  emphasis: { fontWeight: '700' },
  tag: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
});
