import { I18nManager, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface StepProgressProps {
  /** 1-based number of the current setup step. */
  step: number;
  total: number;
  onBack: () => void;
}

/** "Step 2 of 3" with a Back button, plus a small bar for a glance at the progress. */
export function StepProgress({ step, total, onBack }: StepProgressProps) {
  const { colors, easyMode } = useTheme();
  const { t, n } = useTranslation();

  const segments = Array.from({ length: total }, (_, index) => index < step);

  return (
    <View style={styles.progress}>
      <View style={styles.row}>
        <AppButton
          variant="ghost"
          icon={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
          label={t('common.back')}
          onPress={onBack}
          accessibilityHint={t('welcome.backHint')}
          style={styles.back}
        />
        <AppText variant="label" tone="muted">
          {t('welcome.stepOf', { step: n(step), total: n(total) })}
        </AppText>
      </View>
      {/* Decorative: the text above already says where the user is. */}
      {easyMode ? null : (
        <View
          style={styles.segments}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {segments.map((done, index) => (
            <View
              key={index}
              style={[styles.segment, { backgroundColor: done ? colors.primary : colors.track }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { gap: SPACING.md, marginBottom: SPACING.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  // Pulls the ghost button's inner padding back so its label lines up with the titles.
  back: { marginStart: -SPACING.lg },
  segments: { flexDirection: 'row', gap: SPACING.sm },
  segment: { flex: 1, height: 4, borderRadius: RADIUS.pill },
});
