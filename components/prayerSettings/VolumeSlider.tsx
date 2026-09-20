import Slider from '@react-native-community/slider';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

/** Twenty steps are easy to hit with a finger and to step through with a screen reader. */
const STEP = 0.05;

export interface VolumeSliderProps {
  /** 0 to 1. */
  value: number;
  /** While the finger moves, so the sound follows at once. */
  onChange: (value: number) => void;
  /** The value to store: at the end of a drag, or at once for every other change. */
  onCommit: (value: number) => void;
  disabled?: boolean;
  testID?: string;
}

/** Volume of the Adhan the app plays itself. */
export function VolumeSlider({
  value,
  onChange,
  onCommit,
  disabled = false,
  testID,
}: VolumeSliderProps) {
  const theme = useTheme();
  const { t, n } = useTranslation();
  const { colors } = theme;
  // A screen reader never lifts a finger, so it never ends a drag either.
  const dragging = useRef(false);

  const label = t('prayerSettings.adhan.volume');
  const percent = Math.round(value * 100);
  const percentText = t('prayerSettings.adhan.volumeValue', { percent: n(percent) });

  function handleChange(next: number): void {
    onChange(next);
    // A drag stores its value once, when the finger is lifted, instead of on
    // every frame; anything else is already the final value.
    if (!dragging.current) onCommit(next);
  }

  return (
    <View style={[styles.root, disabled && styles.disabled]} testID={testID}>
      <View style={styles.header}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <AppText variant="label" tone="primary" style={styles.percent}>
          {percentText}
        </AppText>
      </View>
      <Slider
        value={value}
        minimumValue={0}
        maximumValue={1}
        step={STEP}
        disabled={disabled}
        onValueChange={handleChange}
        onSlidingStart={() => {
          dragging.current = true;
        }}
        onSlidingComplete={(next) => {
          dragging.current = false;
          onCommit(next);
        }}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.track}
        thumbTintColor={colors.primary}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: percentText }}
        style={[styles.slider, { height: theme.touchTarget }]}
        testID={testID ? `${testID}-control` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.xs },
  disabled: { opacity: 0.45 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  label: { flex: 1 },
  percent: { fontVariant: ['tabular-nums'] },
  slider: { width: '100%' },
});
