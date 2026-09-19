import { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { SPACING } from '@/constants/theme';

export interface StepHeaderProps {
  title: string;
  hint?: string;
  /** Move the screen reader to the title as soon as the step appears. */
  focusOnMount?: boolean;
  align?: 'auto' | 'center';
}

/** A short pause so the new step is on screen before the reader jumps to it. */
const FOCUS_DELAY_MS = 120;

/** Title and hint of one step. The title is a heading and can receive screen-reader focus. */
export function StepHeader({ title, hint, focusOnMount = false, align = 'auto' }: StepHeaderProps) {
  const titleRef = useRef<View>(null);

  useEffect(() => {
    if (!focusOnMount) return undefined;
    const timer = setTimeout(() => {
      if (titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
    }, FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focusOnMount]);

  return (
    <View style={styles.header}>
      <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={title}>
        <AppText variant="title" align={align}>
          {title}
        </AppText>
      </View>
      {hint ? (
        <AppText variant="body" tone="muted" align={align}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.sm, marginBottom: SPACING.xl },
});
