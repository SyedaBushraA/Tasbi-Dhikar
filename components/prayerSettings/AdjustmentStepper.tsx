import { memo } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { MAX_ADJUSTMENT, MIN_ADJUSTMENT } from '@/constants/prayer';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerName } from '@/types';

import { adjustmentValue, adjustmentValueLabel } from './prayerText';

export interface AdjustmentStepperProps {
  prayer: PrayerName;
  /** Minutes added to the calculated time, between MIN_ADJUSTMENT and MAX_ADJUSTMENT. */
  minutes: number;
  /** Today's resulting time, or null while no location is known. */
  timeText: string | null;
  onChange: (minutes: number) => void;
  testID?: string;
}

/** One prayer time with two large buttons that move it a minute at a time. */
export const AdjustmentStepper = memo(function AdjustmentStepper({
  prayer,
  minutes,
  timeText,
  onChange,
  testID,
}: AdjustmentStepperProps) {
  const { t, tCount, n } = useTranslation();
  const name = t(`prayer.names.${prayer}`);
  const value = adjustmentValue(minutes, t, n);
  const spokenValue = adjustmentValueLabel(minutes, t, tCount);

  function step(next: number): void {
    onChange(next);
    // Android reads the live region below on its own; iOS has to be told.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(
        `${name}, ${adjustmentValueLabel(next, t, tCount)}`,
      );
    }
  }

  return (
    <View style={styles.stepper} testID={testID}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          timeText ? `${name}, ${timeText}, ${spokenValue}` : `${name}, ${spokenValue}`
        }
        style={styles.texts}
      >
        <View style={styles.headline}>
          <AppText variant="heading" style={styles.name}>
            {name}
          </AppText>
          <AppText variant="heading" tone="primary" style={styles.value}>
            {value}
          </AppText>
        </View>
        {timeText ? (
          <AppText variant="caption" tone="muted">
            {t('prayerSettings.adjustments.resultingTime', { time: timeText })}
          </AppText>
        ) : null}
      </View>
      <View style={styles.buttons}>
        <AppButton
          variant="secondary"
          icon="remove"
          label={t('prayerSettings.adjustments.earlier')}
          accessibilityLabel={t('prayerSettings.adjustments.a11y.earlier', { prayer: name })}
          onPress={() => step(minutes - 1)}
          disabled={minutes <= MIN_ADJUSTMENT}
          style={styles.button}
          testID={testID ? `${testID}-earlier` : undefined}
        />
        <AppButton
          variant="secondary"
          icon="add"
          label={t('prayerSettings.adjustments.later')}
          accessibilityLabel={t('prayerSettings.adjustments.a11y.later', { prayer: name })}
          onPress={() => step(minutes + 1)}
          disabled={minutes >= MAX_ADJUSTMENT}
          style={styles.button}
          testID={testID ? `${testID}-later` : undefined}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  stepper: { gap: SPACING.sm },
  texts: { gap: 2 },
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  name: { flexShrink: 1 },
  value: { fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', gap: SPACING.md },
  button: { flex: 1 },
});
