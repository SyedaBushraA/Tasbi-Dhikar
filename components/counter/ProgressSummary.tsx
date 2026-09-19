import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface ProgressSummaryProps {
  count: number;
  target: number;
  remaining: number;
}

/** "25 / 33" with the remaining count. Read by screen readers as one sentence. */
export function ProgressSummary({ count, target, remaining }: ProgressSummaryProps) {
  const { easyMode } = useTheme();
  const { t, n } = useTranslation();

  const numbers = { count: n(count), target: n(target), remaining: n(remaining) };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('counter.a11y.progress', numbers)}
      style={styles.block}
      testID="counter-progress"
    >
      <AppText variant="heading" align="center">
        {t('counter.progressOf', numbers)}
      </AppText>
      {easyMode ? null : (
        <AppText variant="caption" tone="muted" align="center">
          {t('counter.remaining', numbers)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', gap: SPACING.xs },
});
