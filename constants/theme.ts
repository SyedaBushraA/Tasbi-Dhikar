export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  accent: string;
  danger: string;
  onDanger: string;
  success: string;
  /** Unfilled beads and progress tracks. */
  track: string;
  pressedOverlay: string;
}

/* Text colours keep a contrast of at least 4.5:1 against background and surface. */
export const LIGHT_COLORS: ThemeColors = {
  background: '#F6F4EE',
  surface: '#FFFFFF',
  surfaceMuted: '#EDEAE1',
  border: '#D9D4C7',
  text: '#1B2925',
  textMuted: '#53635E',
  primary: '#1F6F5C',
  onPrimary: '#FFFFFF',
  primarySoft: '#DCEBE5',
  accent: '#8A6516',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  success: '#1F6F5C',
  track: '#DAD6CA',
  pressedOverlay: 'rgba(0, 0, 0, 0.08)',
};

export const DARK_COLORS: ThemeColors = {
  background: '#0F1815',
  surface: '#18231F',
  surfaceMuted: '#1F2D28',
  border: '#2F4039',
  text: '#E9F0ED',
  textMuted: '#A7B7B1',
  primary: '#6FCFB2',
  onPrimary: '#06281F',
  primarySoft: '#1D3A32',
  accent: '#E2BD6B',
  danger: '#F2B8B5',
  onDanger: '#4A0D09',
  success: '#6FCFB2',
  track: '#2A3A34',
  pressedOverlay: 'rgba(255, 255, 255, 0.10)',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const RADIUS = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

/** Smallest comfortable touch target, in normal and in Easy Mode. */
export const TOUCH_TARGET = { normal: 48, easy: 64 } as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'arabic';

interface TextStyleSpec {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export const TYPOGRAPHY: Record<TextVariant, TextStyleSpec> = {
  display: { fontSize: 88, lineHeight: 100, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  arabic: { fontSize: 30, lineHeight: 52, fontWeight: '400' },
};

/** Everything except the counter number grows by this factor in Easy Mode. */
export const EASY_MODE_TEXT_SCALE = 1.25;
export const EASY_MODE_DISPLAY_SCALE = 1.4;

/**
 * Upper limit for the font scaling of the phone. Text follows the system
 * setting up to this factor; beyond it layouts would no longer fit.
 */
export const MAX_FONT_SCALE: Record<TextVariant, number> = {
  display: 1.15,
  title: 1.4,
  heading: 1.5,
  body: 1.8,
  label: 1.6,
  caption: 1.8,
  arabic: 1.3,
};
