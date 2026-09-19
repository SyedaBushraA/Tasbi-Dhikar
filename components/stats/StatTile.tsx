import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface StatTileProps {
  label: string;
  /** Already formatted for display, for example "1,000" or "3 days". */
  value: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One number with its label. Screen readers hear it as a single "label: value". */
function StatTileComponent({ label, value, style, testID }: StatTileProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('statistics.a11y.stat', { label, value })}
      testID={testID}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export const StatTile = memo(StatTileComponent);

const styles = StyleSheet.create({
  tile: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
});
