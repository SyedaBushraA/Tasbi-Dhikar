import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import type { CounterState } from '@/types';
import { isComplete } from '@/utils/counter';

import { BeadRing } from './BeadRing';

export type CounterStatus = 'counting' | 'paused' | 'completed';

export function counterStatus(counter: CounterState): CounterStatus {
  if (isComplete(counter)) return 'completed';
  return counter.paused ? 'paused' : 'counting';
}

const LABEL_KEYS: Record<CounterStatus, TranslationKey> = {
  counting: 'counter.a11y.countButton',
  paused: 'counter.a11y.countButtonPaused',
  completed: 'counter.a11y.countButtonCompleted',
};

const PRESSED_SCALE = 0.96;

interface CircleMetrics {
  beadSize: number;
  /** Diameter of the tappable disc inside the bead ring. */
  inner: number;
  numberWidth: number;
  iconSize: number;
}

function circleMetrics(size: number, withBeads: boolean): CircleMetrics {
  const beadSize = withBeads ? Math.min(14, Math.max(8, Math.round(size * 0.04))) : 0;
  // The ring takes one bead plus an equal gap on each side.
  const inner = size - beadSize * 4;
  return {
    beadSize,
    inner,
    numberWidth: Math.round(inner * 0.76),
    iconSize: Math.round(inner * 0.16),
  };
}

/** Font size that keeps the count on one line inside the disc, before the text has to shrink itself. */
function numberFontSize(base: number, metrics: CircleMetrics, label: string): number {
  // Bold digits are roughly 0.62 em wide.
  const byWidth = metrics.numberWidth / (0.62 * Math.max(1, label.length));
  return Math.floor(Math.min(base, metrics.inner * 0.34, byWidth));
}

export interface CountButtonProps {
  /** Outer diameter, including the bead ring. */
  size: number;
  count: number;
  target: number;
  status: CounterStatus;
  /** Filled beads of the ring. Leave out to draw no ring (Easy Mode). */
  beadsFilled?: number;
  onPress: () => void;
}

/** The big circle that counts one Dhikr per tap. */
export function CountButton({ size, count, target, status, beadsFilled, onPress }: CountButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t, n } = useTranslation();

  const [scale] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion, () => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const withBeads = beadsFilled !== undefined;
  const metrics = useMemo(() => circleMetrics(size, withBeads), [size, withBeads]);

  const animateTo = useCallback(
    (value: number) => {
      if (reduceMotion) return;
      Animated.timing(scale, {
        toValue: value,
        duration: value < 1 ? 60 : 140,
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );
  const handlePressIn = useCallback(() => animateTo(PRESSED_SCALE), [animateTo]);
  const handlePressOut = useCallback(() => animateTo(1), [animateTo]);

  const countable = status === 'counting';
  const countLabel = n(count);
  const fontSize = numberFontSize(theme.text('display').fontSize, metrics, countLabel);
  const numbers = { count: countLabel, target: n(target) };

  const disc = {
    counting: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    paused: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
    completed: { backgroundColor: colors.primarySoft, borderColor: colors.success },
  }[status];
  const captionIconSize = theme.text('label').fontSize + 4;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!countable}
      android_disableSound
      accessibilityRole="button"
      accessibilityLabel={t(LABEL_KEYS[status], numbers)}
      accessibilityHint={countable ? t('counter.a11y.countButtonHint') : undefined}
      accessibilityState={{ disabled: !countable }}
      testID="counter-tap"
      style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {beadsFilled !== undefined ? (
        <BeadRing
          size={size}
          beadSize={metrics.beadSize}
          filled={beadsFilled}
          muted={status === 'paused'}
        />
      ) : null}
      <Animated.View
        style={[
          styles.disc,
          disc,
          {
            width: metrics.inner,
            height: metrics.inner,
            borderRadius: metrics.inner / 2,
            borderWidth: theme.easyMode ? 3 : 2,
            paddingHorizontal: Math.round(metrics.inner * 0.12),
            transform: [{ scale }],
          },
        ]}
      >
        {status === 'completed' ? (
          <Ionicons name="checkmark-circle" size={metrics.iconSize} color={colors.success} />
        ) : null}
        <View style={{ width: metrics.numberWidth }}>
          <AppText
            variant="display"
            tone={status === 'paused' ? 'muted' : 'default'}
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize, lineHeight: Math.round(fontSize * 1.15) }}
            testID="counter-count"
          >
            {countLabel}
          </AppText>
        </View>
        {status === 'counting' ? (
          <AppText variant="caption" tone="muted" align="center" numberOfLines={2}>
            {t('counter.tapToCount')}
          </AppText>
        ) : null}
        {status === 'paused' ? (
          <View style={styles.captionRow}>
            <Ionicons name="pause-circle-outline" size={captionIconSize} color={colors.textMuted} />
            <AppText variant="label" tone="muted" align="center">
              {t('counter.paused')}
            </AppText>
          </View>
        ) : null}
        {status === 'completed' ? (
          <AppText variant="label" tone="primary" align="center" numberOfLines={2}>
            {t('counter.completedTitle')}
          </AppText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
