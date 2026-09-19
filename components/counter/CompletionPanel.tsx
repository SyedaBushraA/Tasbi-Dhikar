import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface CompletionPanelProps {
  dhikrName: string;
  target: number;
  onStartNewRound: () => void;
}

/** Calm confirmation under the counter once the target is reached. */
export const CompletionPanel = memo(function CompletionPanel({
  dhikrName,
  target,
  onStartNewRound,
}: CompletionPanelProps) {
  const { easyMode } = useTheme();
  const { t, n } = useTranslation();

  return (
    <View style={styles.panel} testID="counter-completion">
      <View style={styles.texts}>
        <AppText variant="body" align="center">
          {t('counter.completedMessage', { target: n(target), dhikr: dhikrName })}
        </AppText>
        {easyMode ? null : (
          <AppText variant="caption" tone="muted" align="center">
            {t('counter.completedSaved')}
          </AppText>
        )}
      </View>
      <AppButton
        label={t('counter.startAnotherRound')}
        icon="repeat-outline"
        onPress={onStartNewRound}
        fullWidth
        accessibilityHint={t('counter.a11y.startAnotherRoundHint')}
        testID="counter-start-new-round"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  panel: { alignSelf: 'stretch', gap: SPACING.lg },
  texts: { alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md },
});
