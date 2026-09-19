import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap the content in a vertical scroll view. Use for anything that can outgrow the screen. */
  scroll?: boolean;
  /** Safe-area edges to pad. Screens under a navigation header or tab bar leave those edges out. */
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Themed page background with safe-area handling and the standard page padding. */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  contentStyle,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: colors.background }]}
      testID={testID}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  scrollContent: { paddingBottom: SPACING.xxl, flexGrow: 1 },
});
