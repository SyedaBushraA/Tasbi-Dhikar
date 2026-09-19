import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface HistoryEmptyStateProps {
  onStartCounting: () => void;
  testID?: string;
}

/** Shown in place of the session list while no round has been completed. */
export function HistoryEmptyState({ onStartCounting, testID }: HistoryEmptyStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      <Ionicons
        name="leaf-outline"
        size={Math.round(theme.text('display').fontSize / 2)}
        color={theme.colors.primary}
        accessible={false}
        importantForAccessibility="no"
      />
      <AppText variant="heading" align="center" accessibilityRole="header">
        {t('history.emptyTitle')}
      </AppText>
      <AppText variant="body" tone="muted" align="center">
        {t('history.emptyMessage')}
      </AppText>
      <AppButton
        label={t('history.goToCounter')}
        icon="radio-button-on-outline"
        onPress={onStartCounting}
        accessibilityHint={t('history.a11y.goToCounterHint')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  button: { marginTop: SPACING.sm },
});
