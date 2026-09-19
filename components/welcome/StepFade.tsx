import { type ReactNode, useEffect } from 'react';
import { Animated, StyleSheet, useAnimatedValue } from 'react-native';

const FADE_MS = 200;

/** Fades a step in when it appears, so switching steps feels calm instead of abrupt. */
export function StepFade({ children }: { children: ReactNode }) {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
});
