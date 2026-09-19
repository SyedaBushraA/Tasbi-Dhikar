import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/constants/theme';

export interface SectionBlockProps {
  children: ReactNode;
  testID?: string;
}

/** Free content inside a grouped section, padded like the rows around it. */
export function SectionBlock({ children, testID }: SectionBlockProps) {
  return (
    <View style={styles.block} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
});
