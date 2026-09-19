import { Text, type TextProps } from 'react-native';

import { MAX_FONT_SCALE, type TextVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'default' | 'muted' | 'primary' | 'danger' | 'onPrimary' | 'onDanger' | 'accent';
  align?: 'auto' | 'center';
}

/** All text in the app: themed, sized for Easy Mode and following the font size of the phone. */
export function AppText({
  variant = 'body',
  tone = 'default',
  align = 'auto',
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const { colors } = theme;

  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
    onDanger: colors.onDanger,
    accent: colors.accent,
  }[tone];

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE[variant]}
      {...rest}
      style={[
        theme.text(variant),
        { color, textAlign: align },
        variant === 'arabic' && { writingDirection: 'rtl' },
        style,
      ]}
    />
  );
}
