import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export interface HistoryDayHeaderProps {
  /** "Today", "Yesterday" or a formatted date. */
  title: string;
  /** Sum of the counts of that day's sessions. */
  total: number;
  testID?: string;
}

/** Heading of one day in the history list, with the day's total at the end. */
function HistoryDayHeaderComponent({ title, total, testID }: HistoryDayHeaderProps) {
  const { t, n } = useTranslation();
  const totalText = t('history.dayTotal', { total: n(total) });

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={t('history.a11y.day', { day: title, total: n(total) })}
      testID={testID}
      style={styles.header}
    >
      <AppText variant="label" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="caption" tone="muted">
        {totalText}
      </AppText>
    </View>
  );
}

export const HistoryDayHeader = memo(HistoryDayHeaderComponent);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  title: { flexShrink: 1 },
});
