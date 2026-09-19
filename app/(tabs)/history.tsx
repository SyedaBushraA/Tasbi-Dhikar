import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { HistoryDayHeader } from '@/components/stats/HistoryDayHeader';
import { HistoryEmptyState } from '@/components/stats/HistoryEmptyState';
import { SessionRow } from '@/components/stats/SessionRow';
import { StatTileGroup, type StatTileItem } from '@/components/stats/StatTileGroup';
import { AppText, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useHistorySections, useStatsSummary } from '@/hooks/useStatistics';
import { useTheme } from '@/hooks/useTheme';
import { useToday } from '@/hooks/useToday';
import { type Translator, useTranslation } from '@/hooks/useTranslation';
import type { SessionRecord } from '@/types';
import { dayKeyToDate, formatDayKey, relativeDay } from '@/utils/date';

interface DaySection {
  dayKey: string;
  /** "Today", "Yesterday" or a formatted date. */
  title: string;
  total: number;
  data: readonly SessionRecord[];
}

const NOON_MS = 12 * 60 * 60 * 1000;

function dayTitle(dayKey: string, now: number, locale: string, t: Translator['t']): string {
  switch (relativeDay(dayKey, now)) {
    case 'today':
      return t('common.today');
    case 'yesterday':
      return t('common.yesterday');
    default:
      return formatDayKey(dayKey, locale);
  }
}

function keyExtractor(record: SessionRecord): string {
  return record.id;
}

function ItemSeparator() {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export default function HistoryScreen() {
  const history = useHistorySections();
  const summary = useStatsSummary();
  const today = useToday();
  const { t, n, locale } = useTranslation();

  const sections = useMemo<DaySection[]>(() => {
    // Noon of the current day: safely inside the day whatever the clock change.
    const now = dayKeyToDate(today).getTime() + NOON_MS;
    return history.map((section) => ({
      dayKey: section.dayKey,
      title: dayTitle(section.dayKey, now, locale, t),
      total: section.total,
      data: section.sessions,
    }));
  }, [history, today, locale, t]);

  const tiles = useMemo<StatTileItem[]>(
    () => [
      { key: 'today', label: t('history.todayTotal'), value: n(summary.today) },
      { key: 'total', label: t('history.totalDhikr'), value: n(summary.total) },
      {
        key: 'sessions',
        label: t('history.completedSessions'),
        value: n(summary.completedSessions),
      },
    ],
    [summary.today, summary.total, summary.completedSessions, t, n],
  );

  const goToCounter = useCallback(() => router.navigate('/'), []);

  // Header and callbacks keep their identity so the list does not re-render its rows.
  const header = useMemo(
    () => (
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('history.title')}
        </AppText>
        <StatTileGroup tiles={tiles} columns={3} testID="history-summary" />
      </View>
    ),
    [t, tiles],
  );

  const renderItem = useCallback(
    ({ item, section }: { item: SessionRecord; section: DaySection }) => (
      <SessionRow session={item} dateLabel={section.title} />
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DaySection }) => (
      <HistoryDayHeader title={section.title} total={section.total} />
    ),
    [],
  );

  return (
    <Screen testID="history-screen">
      <SectionList<SessionRecord, DaySection>
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={header}
        ListEmptyComponent={<HistoryEmptyState onStartCounting={goToCounter} />}
        stickySectionHeadersEnabled={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: SPACING.xxl },
  header: { gap: SPACING.lg },
  separator: { height: StyleSheet.hairlineWidth },
});
