import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Notice } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { ClockFormat, NextPrayer } from '@/types';
import { toDayKey } from '@/utils/date';

import { countdownLabel, formatPrayerTime, prayerNameKey, spokenCountdown } from './labels';

export interface NextPrayerCardProps {
  next: NextPrayer | null;
  /** Current time, refreshed every minute, for the countdown. */
  now: number;
  clockFormat: ClockFormat;
}

/** The time is the one thing people look for, so it is drawn larger than a title. */
const TIME_SCALE = 1.3;
/** A long time may shrink a little rather than wrap onto a second line. */
const MIN_TIME_SCALE = 0.7;

/** The prayer that is coming: name, time and how long is left. Read as one sentence. */
export const NextPrayerCard = memo(function NextPrayerCard({
  next,
  now,
  clockFormat,
}: NextPrayerCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const translator = useTranslation();
  const { t } = translator;

  // A place where a time cannot be calculated must say so rather than show nothing.
  if (!next) {
    return <Notice message={t('prayer.noNextPrayer')} testID="prayer-no-next" />;
  }

  const name = t(prayerNameKey(next.name));
  const time = formatPrayerTime(next.time, clockFormat, t);
  const countdown = countdownLabel(next.time, now, translator);
  // After Isha the next prayer belongs to the next day, which the time alone does not say.
  const tomorrow = next.dayKey > toDayKey(now);

  const title = theme.text('title');
  const timeStyle = {
    fontSize: Math.round(title.fontSize * TIME_SCALE),
    lineHeight: Math.round(title.lineHeight * TIME_SCALE),
  };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={[
        t('prayer.a11y.nextPrayer', {
          prayer: name,
          time,
          countdown: spokenCountdown(next.time, now, translator),
        }),
        ...(tomorrow ? [t('prayer.tomorrow')] : []),
      ].join(', ')}
      style={[styles.card, { backgroundColor: colors.primarySoft }]}
      testID="prayer-next-card"
    >
      <AppText variant="label" tone="muted" align="center">
        {t('prayer.nextPrayer')}
      </AppText>
      <AppText variant="title" align="center">
        {name}
      </AppText>
      <AppText
        variant="title"
        tone="primary"
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MIN_TIME_SCALE}
        style={timeStyle}
      >
        {time}
      </AppText>
      <AppText variant="body" tone="muted" align="center">
        {countdown}
      </AppText>
      {tomorrow ? (
        <AppText variant="body" tone="muted" align="center" testID="prayer-next-tomorrow">
          {t('prayer.tomorrow')}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
});
