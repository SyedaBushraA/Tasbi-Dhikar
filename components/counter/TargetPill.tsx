import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { I18nManager, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface TargetPillProps {
  target: number;
  onPress: () => void;
}

/** Shows the target of the round and opens the target picker. */
export const TargetPill = memo(function TargetPill({ target, onPress }: TargetPillProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t, n } = useTranslation();

  const label = t('counter.target', { target: n(target) });
  const iconSize = theme.text('label').fontSize + 2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t('counter.a11y.changeTargetHint')}
      testID="counter-target-pill"
      style={({ pressed }) => [
        styles.pill,
        {
          minHeight: theme.touchTarget,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { backgroundColor: colors.pressedOverlay },
      ]}
    >
      <Ionicons
        name="flag-outline"
        size={iconSize}
        color={colors.primary}
        accessible={false}
        importantForAccessibility="no"
      />
      <AppText variant="label">{label}</AppText>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={iconSize}
        color={colors.textMuted}
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingStart: SPACING.lg,
    paddingEnd: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
});
