import { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { dayKeyToDate, shiftDayKey } from '@/utils/date';

export interface WeekOverviewProps {
  /** Day key of the current local day. */
  today: string;
  /** Counts per day key, from the stats slice of the state. */
  daily: Readonly<Record<string, number>>;
  testID?: string;
}

interface DayColumn {
  dayKey: string;
  count: number;
  weekday: string;
  weekdayLong: string;
  isToday: boolean;
}

const DAYS_SHOWN = 7;
const BAR_AREA_HEIGHT = 120;
const BAR_MAX_WIDTH = 28;
/** A day with any count shows at least this much bar, so it is never mistaken for zero. */
const MIN_BAR_HEIGHT = 6;
/** Seven columns share the width, so their labels cannot grow as far as other text. */
const LABEL_MAX_FONT_SCALE = 1.3;

function weekdayName(dayKey: string, locale: string, width: 'short' | 'long'): string {
  const date = dayKeyToDate(dayKey);
  try {
    return date.toLocaleDateString(locale, { weekday: width });
  } catch {
    return String(date.getDate());
  }
}

function buildColumns(
  today: string,
  daily: Readonly<Record<string, number>>,
  locale: string,
): DayColumn[] {
  const columns: DayColumn[] = [];
  for (let offset = DAYS_SHOWN - 1; offset >= 0; offset -= 1) {
    const dayKey = shiftDayKey(today, -offset);
    columns.push({
      dayKey,
      count: daily[dayKey] ?? 0,
      weekday: weekdayName(dayKey, locale, 'short'),
      weekdayLong: weekdayName(dayKey, locale, 'long'),
      isToday: offset === 0,
    });
  }
  return columns;
}

interface DayBarProps {
  column: DayColumn;
  /** Highest count of the week; the bar of that day fills the whole area. */
  highest: number;
  /** Space kept above the tallest bar for its number. */
  numberHeight: number;
  testID?: string;
}

/** One column: the number, the bar and the weekday. Read out as one element. */
function DayBar({ column, highest, numberHeight, testID }: DayBarProps) {
  const { colors } = useTheme();
  const { t, n } = useTranslation();

  const value = n(column.count);
  const barHeight =
    column.count === 0
      ? 0
      : Math.max(MIN_BAR_HEIGHT, Math.round((column.count / highest) * BAR_AREA_HEIGHT));
  const a11yKey = column.isToday ? 'statistics.a11y.dayToday' : 'statistics.a11y.day';

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t(a11yKey, { day: column.weekdayLong, value })}
      style={styles.column}
      testID={testID}
    >
      <View
        style={[
          styles.barArea,
          { height: BAR_AREA_HEIGHT + numberHeight, borderBottomColor: colors.border },
        ]}
      >
        <AppText
          variant="caption"
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
          style={styles.label}
        >
          {value}
        </AppText>
        {barHeight > 0 ? (
          <View
            style={[
              styles.bar,
              {
                height: barHeight,
                // Today is filled, other days are outlined: told apart without relying on colour.
                backgroundColor: column.isToday ? colors.primary : colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          />
        ) : null}
      </View>
      <AppText
        variant="caption"
        tone={column.isToday ? 'primary' : 'muted'}
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
        style={[styles.label, styles.weekday, column.isToday && styles.today]}
      >
        {column.isToday ? t('common.today') : column.weekday}
      </AppText>
    </View>
  );
}

/** One bar per day for the last seven days, drawn with plain views. */
function WeekOverviewComponent({ today, daily, testID }: WeekOverviewProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { fontScale } = useWindowDimensions();

  const columns = useMemo(() => buildColumns(today, daily, locale), [today, daily, locale]);
  const highest = columns.reduce((max, column) => Math.max(max, column.count), 0);

  // Room for the number above the tallest bar, whatever the font setting.
  const numberHeight = Math.ceil(
    theme.text('caption').lineHeight * Math.min(fontScale, LABEL_MAX_FONT_SCALE),
  );

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="heading" accessibilityRole="header">
        {t('statistics.lastSevenDays')}
      </AppText>
      <View style={styles.chart}>
        {columns.map((column) => (
          <DayBar
            key={column.dayKey}
            column={column}
            highest={highest}
            numberHeight={numberHeight}
            testID={testID ? `${testID}-${column.dayKey}` : undefined}
          />
        ))}
      </View>
    </View>
  );
}

export const WeekOverview = memo(WeekOverviewComponent);

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center' },
  barArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    width: '70%',
    maxWidth: BAR_MAX_WIDTH,
    borderWidth: 1,
    borderTopStartRadius: RADIUS.sm,
    borderTopEndRadius: RADIUS.sm,
  },
  label: { alignSelf: 'stretch', paddingHorizontal: 2 },
  weekday: { marginTop: SPACING.xs },
  today: { fontWeight: '700' },
});
