import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { CounterState } from '@/types';
import { isComplete, progress } from '@/utils/counter';

/** Beads of a small tasbih. */
export const BEAD_COUNT = 33;

/**
 * How many beads are filled. The first count always shows one bead and the
 * last bead is kept for reaching the target, so the ring never lies.
 */
export function beadsFilled(counter: CounterState): number {
  if (isComplete(counter)) return BEAD_COUNT;
  if (counter.count <= 0) return 0;
  const rounded = Math.round(progress(counter) * BEAD_COUNT);
  return Math.min(BEAD_COUNT - 1, Math.max(1, rounded));
}

interface BeadPosition {
  start: number;
  top: number;
}

/** Bead centres on a circle, starting at the top and going round like a tasbih. */
function beadPositions(size: number, beadSize: number): BeadPosition[] {
  const radius = (size - beadSize) / 2;
  const centre = size / 2 - beadSize / 2;
  return Array.from({ length: BEAD_COUNT }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / BEAD_COUNT;
    return {
      start: centre + radius * Math.cos(angle),
      top: centre + radius * Math.sin(angle),
    };
  });
}

export interface BeadRingProps {
  /** Outer diameter of the ring. */
  size: number;
  beadSize: number;
  filled: number;
  /** Draws the filled beads in a quiet colour, for example while paused. */
  muted: boolean;
}

/**
 * Ring of beads around the counter that fills up like a real tasbih.
 * Purely decorative for screen readers; the progress text carries the numbers.
 */
export const BeadRing = memo(function BeadRing({ size, beadSize, filled, muted }: BeadRingProps) {
  const { colors } = useTheme();
  const positions = useMemo(() => beadPositions(size, beadSize), [size, beadSize]);
  const filledColor = muted ? colors.textMuted : colors.primary;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      {positions.map((position, index) => {
        const isFilled = index < filled;
        return (
          <View
            key={index}
            style={[
              styles.bead,
              {
                width: beadSize,
                height: beadSize,
                borderRadius: beadSize / 2,
                start: position.start,
                top: position.top,
                backgroundColor: isFilled ? filledColor : colors.track,
              },
              isFilled ? null : styles.empty,
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  bead: { position: 'absolute' },
  // Empty beads are also smaller, so the ring does not rely on colour alone.
  empty: { transform: [{ scale: 0.6 }] },
});
