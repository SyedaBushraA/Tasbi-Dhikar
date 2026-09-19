import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';
import type { SessionRecord } from '@/types';
import { formatTimeOfDay } from '@/utils/prayer';

export interface SessionRowProps {
  session: SessionRecord;
  /** Heading of the day the session belongs to, for example "Today". Read out, not shown. */
  dateLabel: string;
  testID?: string;
}

/** One completed round: name and count on the first line, time and target below. */
function SessionRowComponent({ session, dateLabel, testID }: SessionRowProps) {
  const { t, n } = useTranslation();
  const clockFormat = useAppSelector((state) => state.settings.clockFormat);

  const count = n(session.count);
  const target = n(session.target);
  // The same clock format as the prayer times, so the app reads as one app.
  const time = formatTimeOfDay(session.completedAt, clockFormat, {
    am: t('prayer.am'),
    pm: t('prayer.pm'),
  });

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('history.a11y.session', {
        dhikr: session.dhikrName,
        count,
        target,
        date: dateLabel,
        time,
      })}
      testID={testID}
      style={styles.row}
    >
      <View style={styles.line}>
        <AppText variant="body" style={styles.name}>
          {session.dhikrName}
        </AppText>
        <AppText variant="heading" tone="primary">
          {count}
        </AppText>
      </View>
      <View style={[styles.line, styles.details]}>
        <AppText variant="caption" tone="muted">
          {time}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('history.sessionTarget', { target })}
        </AppText>
      </View>
    </View>
  );
}

export const SessionRow = memo(SessionRowComponent);

const styles = StyleSheet.create({
  row: { paddingVertical: SPACING.md, gap: SPACING.xs },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  name: { flex: 1 },
  details: { flexWrap: 'wrap' },
});
