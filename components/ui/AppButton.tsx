import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Decorative icon shown before the label. The label always stays visible. */
  icon?: IconName;
  disabled?: boolean;
  /** Stretch to the width of the parent. */
  fullWidth?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** The standard button: always labelled with text and never smaller than the touch target. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
  accessibilityLabel,
  testID,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const { colors } = theme;

  const palette = {
    primary: { background: colors.primary, border: colors.primary, tone: 'onPrimary' as const },
    secondary: { background: colors.surface, border: colors.border, tone: 'default' as const },
    ghost: { background: 'transparent', border: 'transparent', tone: 'primary' as const },
    danger: { background: colors.danger, border: colors.danger, tone: 'onDanger' as const },
  }[variant];

  const iconColor = {
    default: colors.text,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    onDanger: colors.onDanger,
  }[palette.tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: theme.touchTarget,
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Ionicons
            name={icon}
            size={theme.text('label').fontSize + 4}
            color={iconColor}
            accessible={false}
            importantForAccessibility="no"
          />
        ) : null}
        <AppText variant="label" tone={palette.tone} align="center" style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  label: { flexShrink: 1 },
});
