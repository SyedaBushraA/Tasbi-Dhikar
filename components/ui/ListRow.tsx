import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';

import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Text shown at the end of the row, for example the current value of a setting. */
  value?: string;
  /** Marks the row as the chosen option: a check mark is shown and announced. */
  selected?: boolean;
  /** Shows an arrow at the end, for rows that open another screen. */
  showChevron?: boolean;
  /** Custom content at the end of the row, for example a switch. */
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'radio' | 'link';
  testID?: string;
}

/** One row of a list or of a grouped section. Tappable when onPress is given. */
export function ListRow({
  title,
  subtitle,
  value,
  selected,
  showChevron = false,
  trailing,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}: ListRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const iconSize = theme.text('body').fontSize + 5;

  const content = (
    <>
      <View style={styles.texts}>
        <AppText variant="body" style={selected ? styles.selectedTitle : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="muted" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {selected ? (
        <Ionicons name="checkmark-circle" size={iconSize + 3} color={colors.primary} />
      ) : null}
      {showChevron ? (
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          size={iconSize}
          color={colors.textMuted}
        />
      ) : null}
    </>
  );

  const rowStyle = [styles.row, { minHeight: theme.touchTarget + SPACING.sm }];

  if (!onPress) {
    return (
      <View style={rowStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      accessibilityHint={accessibilityHint}
      accessibilityState={selected === undefined ? undefined : { selected, checked: selected }}
      testID={testID}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.pressedOverlay }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  texts: { flex: 1, gap: 2 },
  selectedTitle: { fontWeight: '700' },
  value: { flexShrink: 0 },
});
