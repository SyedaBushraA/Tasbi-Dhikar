import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RADIUS } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface ProgressBarProps {
  /** 0 to 1. */
  progress: number;
}

/**
 * Thick progress bar for Easy Mode, where the bead ring would be too fine.
 * Hidden from screen readers: the progress text next to it says the same.
 */
export const ProgressBar = memo(function ProgressBar({ progress }: ProgressBarProps) {
  const { colors } = useTheme();
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.track, { backgroundColor: colors.track }]}
      testID="counter-progress-bar"
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    height: 14,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
});
