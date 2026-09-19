import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { MAX_FONT_SCALE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

export interface TextFieldProps
  extends Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'accessibilityLabel'> {
  label: string;
  /** Shown below the field instead of the hint, and announced to screen readers. */
  error?: string | null;
  hint?: string;
}

/** A labelled text input with room for a hint or an error message. */
export function TextField({ label, error, hint, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const { colors } = theme;
  const textStyle = theme.text('body');

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        maxFontSizeMultiplier={MAX_FONT_SCALE.body}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            minHeight: theme.touchTarget + SPACING.xs,
            fontSize: textStyle.fontSize,
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: error ? 2 : 1,
          },
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACING.sm },
  input: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    textAlign: 'auto',
  },
});
