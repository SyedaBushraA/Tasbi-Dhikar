import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { StatTileGroup, type StatTileItem } from '@/components/stats/StatTileGroup';
import { WeekOverview } from '@/components/stats/WeekOverview';
import { AppText, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useStatsSummary } from '@/hooks/useStatistics';
import { useToday } from '@/hooks/useToday';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';

export default function StatisticsScreen() {
  const summary = useStatsSummary();
  const daily = useAppSelector((state) => state.stats.daily);
  const today = useToday();
  const { t, tCount, n } = useTranslation();

  const tiles = useMemo<StatTileItem[]>(
    () => [
      { key: 'today', label: t('statistics.today'), value: n(summary.today) },
      { key: 'week', label: t('statistics.thisWeek'), value: n(summary.thisWeek) },
      { key: 'total', label: t('statistics.total'), value: n(summary.total) },
      {
        key: 'sessions',
        label: t('statistics.completedSessions'),
        value: n(summary.completedSessions),
      },
      {
        key: 'streak',
        label: t('statistics.currentStreak'),
        value: tCount('statistics.streakDays', summary.currentStreak),
      },
    ],
    [summary, t, tCount, n],
  );

  const isEmpty = summary.total === 0;

  return (
    <Screen scroll testID="statistics-screen">
      <View style={styles.content}>
        <AppText variant="title" accessibilityRole="header">
          {t('statistics.title')}
        </AppText>
        {isEmpty ? (
          <AppText variant="body" tone="muted">
            {t('statistics.emptyMessage')}
          </AppText>
        ) : null}
        <StatTileGroup tiles={tiles} columns={2} testID="statistics-tiles" />
        <View style={styles.hints}>
          <AppText variant="caption" tone="muted">
            {t('statistics.streakHint')}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('statistics.countsHint')}
          </AppText>
        </View>
        {/* A week of empty bars says nothing; the message above already explains. */}
        {isEmpty ? null : (
          <WeekOverview today={today} daily={daily} testID="statistics-week" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.lg },
  hints: { gap: SPACING.xs },
});
