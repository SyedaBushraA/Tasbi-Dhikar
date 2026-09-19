import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface CounterControlsProps {
  canUndo: boolean;
  paused: boolean;
  completed: boolean;
  onUndo: () => void;
  onTogglePause: () => void;
  /** Asks for confirmation before resetting. */
  onReset: () => void;
}

/**
 * Undo, Pause/Resume and Reset. Easy Mode keeps only Undo and Reset, plus a
 * large Resume button whenever the round is paused so nobody gets stuck.
 */
export const CounterControls = memo(function CounterControls({
  canUndo,
  paused,
  completed,
  onUndo,
  onTogglePause,
  onReset,
}: CounterControlsProps) {
  const { easyMode } = useTheme();
  const { t } = useTranslation();

  const undoButton = (
    <AppButton
      label={t('counter.undo')}
      icon="arrow-undo-outline"
      variant="secondary"
      onPress={onUndo}
      disabled={!canUndo}
      accessibilityHint={t('counter.a11y.undoHint')}
      style={styles.button}
      testID="counter-undo"
    />
  );

  const resetButton = (
    <AppButton
      label={t('counter.reset')}
      icon="refresh-outline"
      variant="secondary"
      onPress={onReset}
      disabled={!canUndo}
      accessibilityHint={t('counter.a11y.resetHint')}
      style={styles.button}
      testID="counter-reset"
    />
  );

  if (easyMode) {
    return (
      <View style={styles.stack}>
        {paused ? (
          <AppButton
            label={t('counter.resume')}
            icon="play-outline"
            onPress={onTogglePause}
            fullWidth
            accessibilityHint={t('counter.a11y.resumeHint')}
            testID="counter-resume"
          />
        ) : null}
        <View style={styles.row}>
          {undoButton}
          {resetButton}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {undoButton}
      <AppButton
        label={paused ? t('counter.resume') : t('counter.pause')}
        icon={paused ? 'play-outline' : 'pause-outline'}
        variant="secondary"
        onPress={onTogglePause}
        // Nothing is left to pause once the target is reached.
        disabled={completed && !paused}
        accessibilityHint={paused ? t('counter.a11y.resumeHint') : t('counter.a11y.pauseHint')}
        style={styles.button}
        testID="counter-pause"
      />
      {resetButton}
    </View>
  );
});

const styles = StyleSheet.create({
  stack: { alignSelf: 'stretch', gap: SPACING.md },
  // Buttons keep their natural width and wrap to a second line at large font sizes.
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  button: { flexGrow: 1, flexBasis: 'auto', paddingHorizontal: SPACING.md },
});
