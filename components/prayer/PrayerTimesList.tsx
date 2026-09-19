import { Fragment, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RowDivider } from '@/components/ui';
import { PRAYER_ORDER } from '@/constants/prayer';
import { RADIUS } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ClockFormat, NextPrayer, PrayerDay } from '@/types';

import { PrayerTimeRow } from './PrayerTimeRow';

export interface PrayerTimesListProps {
  day: PrayerDay;
  /** Marked in the list only while it belongs to the day that is shown. */
  next: NextPrayer | null;
  now: number;
  clockFormat: ClockFormat;
}

/** All six times of one day, from Fajr to Isha. */
export const PrayerTimesList = memo(function PrayerTimesList({
  day,
  next,
  now,
  clockFormat,
}: PrayerTimesListProps) {
  const { colors } = useTheme();
  const nextName = next && next.dayKey === day.dayKey ? next.name : null;

  return (
    <View
      style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID="prayer-times-list"
    >
      {PRAYER_ORDER.map((name, index) => {
        const time = day.times[name];
        return (
          <Fragment key={name}>
            {index > 0 ? <RowDivider /> : null}
            <PrayerTimeRow
              name={name}
              time={time}
              isNext={name === nextName}
              isPast={time !== null && time < now}
              clockFormat={clockFormat}
              testID={`prayer-time-${name}`}
            />
          </Fragment>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden' },
});
