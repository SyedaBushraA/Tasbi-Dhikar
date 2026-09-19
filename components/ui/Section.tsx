import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export interface SectionProps {
  title?: string;
  children: ReactNode;
  /** Draw the children inside one bordered surface, separated by hairlines. */
  grouped?: boolean;
}

/** A titled block of related content, used on Settings, History and the pickers. */
export function Section({ title, children, grouped = true }: SectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="label" tone="muted" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      <View
        style={
          grouped && [
            styles.group,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]
        }
      >
        {children}
      </View>
    </View>
  );
}

/** Hairline between rows of a grouped section. */
export function RowDivider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.xl },
  title: { marginBottom: SPACING.sm, marginStart: SPACING.xs },
  group: { borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginStart: SPACING.lg },
});
