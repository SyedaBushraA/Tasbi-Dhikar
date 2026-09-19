import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { AppText, ChoiceChips, type ChoiceOption } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { type TwelveHourTime, formatReminderTime, to12Hour, to24Hour } from '@/utils/date';

import { StepperControl } from './StepperControl';

const MINUTE_STEP = 5;
/** The chosen time is the one thing on the screen, so it is shown well above title size. */
const TIME_TEXT_SCALE = 1.75;

export type StepDirection = 1 | -1;
type Period = TwelveHourTime['period'];

/** The hour before or after, around the whole day: 11 AM is followed by 12 PM. */
export function stepHour(hour: number, direction: StepDirection): number {
  return (hour + direction + 24) % 24;
}

/**
 * The next or previous multiple of five, wrapping within the hour. A stored
 * minute that is off the grid snaps onto it in the direction of travel.
 */
export function stepMinute(minute: number, direction: StepDirection): number {
  const previous = Math.floor(minute / MINUTE_STEP) * MINUTE_STEP;
  const aligned = previous === minute;
  const next =
    direction === 1 ? previous + MINUTE_STEP : aligned ? previous - MINUTE_STEP : previous;
  return (next + 60) % 60;
}

function padMinute(minute: number): string {
  return minute < 10 ? `0${minute}` : String(minute);
}

export interface TimeStepperProps {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  onChange: (hour: number, minute: number) => void;
  testID?: string;
}

/** Picks a time of day with large buttons instead of a scroll wheel. */
export function TimeStepper({ hour, minute, onChange, testID }: TimeStepperProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const time = to12Hour(hour, minute);

  const periods: ChoiceOption<Period>[] = [
    { value: 'AM', label: t('settings.reminder.am') },
    { value: 'PM', label: t('settings.reminder.pm') },
  ];

  function emit(nextHour: number, nextMinute: number) {
    if (nextHour === hour && nextMinute === minute) return;
    onChange(nextHour, nextMinute);
    // Android reads the live region below on its own; iOS has to be told.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(formatReminderTime(nextHour, nextMinute));
    }
  }

  function changePeriod(period: Period) {
    const next = to24Hour({ ...time, period });
    emit(next.hour, next.minute);
  }

  const titleSpec = theme.text('title');
  const timeSize = {
    fontSize: Math.round(titleSpec.fontSize * TIME_TEXT_SCALE),
    lineHeight: Math.round(titleSpec.lineHeight * TIME_TEXT_SCALE),
  };

  return (
    <View style={styles.root} testID={testID}>
      <AppText
        variant="title"
        tone="primary"
        align="center"
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.time, timeSize]}
        testID={testID ? `${testID}-time` : undefined}
      >
        {formatReminderTime(hour, minute)}
      </AppText>

      <StepperControl
        label={t('settings.reminder.hour')}
        valueText={String(time.hour12)}
        decreaseLabel={t('settings.reminder.a11y.decreaseHour')}
        increaseLabel={t('settings.reminder.a11y.increaseHour')}
        onDecrease={() => emit(stepHour(hour, -1), minute)}
        onIncrease={() => emit(stepHour(hour, 1), minute)}
        testID={testID ? `${testID}-hour` : undefined}
      />

      <StepperControl
        label={t('settings.reminder.minute')}
        valueText={padMinute(minute)}
        decreaseLabel={t('settings.reminder.a11y.decreaseMinute')}
        increaseLabel={t('settings.reminder.a11y.increaseMinute')}
        onDecrease={() => emit(hour, stepMinute(minute, -1))}
        onIncrease={() => emit(hour, stepMinute(minute, 1))}
        testID={testID ? `${testID}-minute` : undefined}
      />

      <View style={styles.period}>
        <AppText variant="heading">{t('settings.reminder.period')}</AppText>
        <ChoiceChips
          options={periods}
          value={time.period}
          onChange={changePeriod}
          accessibilityLabel={t('settings.reminder.period')}
          testID={testID ? `${testID}-period` : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.xl },
  time: { fontVariant: ['tabular-nums'], marginVertical: SPACING.md },
  period: { gap: SPACING.sm },
});
