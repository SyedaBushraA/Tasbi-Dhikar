import { Fragment, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RowDivider } from '@/components/ui';
import { RADIUS } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ClockFormat, NextPrayer, PrayerDay } from '@/types';
import { orderedPrayerNames } from '@/utils/prayer';

import { PrayerTimeRow } from './PrayerTimeRow';

export interface PrayerTimesListProps {
  day: PrayerDay;
  /** Marked in the list, with a word when it belongs to the next day. */
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
  // After Isha the next prayer is tomorrow's Fajr. Its row is still the one to
  // look at, so it is marked here and the row says which day it belongs to.
  const nextName = next ? next.name : null;
  const nextTomorrow = next !== null && next.dayKey > day.dayKey;

  return (
    <View
      style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID="prayer-times-list"
    >
      {orderedPrayerNames(day).map((name, index) => {
        const time = day.times[name];
        const isNext = name === nextName;
        return (
          <Fragment key={name}>
            {index > 0 ? <RowDivider /> : null}
            <PrayerTimeRow
              name={name}
              time={time}
              isNext={isNext}
              isTomorrow={isNext && nextTomorrow}
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
