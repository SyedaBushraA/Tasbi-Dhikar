import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  DARK_COLORS,
  EASY_MODE_DISPLAY_SCALE,
  EASY_MODE_TEXT_SCALE,
  LIGHT_COLORS,
  TOUCH_TARGET,
  TYPOGRAPHY,
  type TextVariant,
  type ThemeColors,
} from '@/constants/theme';
import { useAppSelector } from '@/state';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  easyMode: boolean;
  /** Minimum height and width of anything that can be tapped. */
  touchTarget: number;
  /** Font size, line height and weight of a text variant, adjusted for Easy Mode. */
  text(variant: TextVariant): { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' };
}

export function useTheme(): Theme {
  const preference = useAppSelector((state) => state.settings.theme);
  const easyMode = useAppSelector((state) => state.settings.easyMode);
  const systemScheme = useColorScheme();

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  return useMemo<Theme>(
    () => ({
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      isDark,
      easyMode,
      touchTarget: easyMode ? TOUCH_TARGET.easy : TOUCH_TARGET.normal,
      text(variant) {
        const spec = TYPOGRAPHY[variant];
        if (!easyMode) return spec;
        const scale = variant === 'display' ? EASY_MODE_DISPLAY_SCALE : EASY_MODE_TEXT_SCALE;
        return {
          fontSize: Math.round(spec.fontSize * scale),
          lineHeight: Math.round(spec.lineHeight * scale),
          fontWeight: spec.fontWeight,
        };
      },
    }),
    [isDark, easyMode],
  );
}
