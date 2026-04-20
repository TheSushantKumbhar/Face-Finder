/**
 * Face Finder — Theme Definitions
 * ────────────────────────────────
 * Maps the color palette into semantic light & dark theme objects.
 * Warm peach / sandy color scheme.
 */

import { palette } from './colors';

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    surfaceLight: string;
    elevated: string;

    // Brand
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    textOnAccent: string;

    // Inputs
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    placeholder: string;

    // Borders & Dividers
    border: string;
    divider: string;

    // Semantic
    success: string;
    error: string;
    warning: string;
    info: string;

    // Misc
    overlay: string;
    shadow: string;
    icon: string;
    iconMuted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    hero: number;
  };
}

const sharedValues = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
};

export const lightTheme: AppTheme = {
  mode: 'light',
  ...sharedValues,
  colors: {
    background: palette.accent,          // Warm peach background
    surface: palette.accentLight,        // Slightly lighter peach
    surfaceLight: palette.accentMuted,
    elevated: palette.white,

    primary: palette.primary,            // Dark charcoal
    primaryLight: palette.primaryLight,
    primaryDark: palette.primaryDark,
    accent: palette.accent,
    accentLight: palette.accentLight,
    accentDark: palette.accentDark,
    secondary: palette.secondary,
    secondaryLight: palette.secondaryLight,
    secondaryDark: palette.secondaryDark,

    text: palette.gray900,
    textSecondary: palette.gray700,
    textMuted: palette.gray600,
    textOnPrimary: palette.white,
    textOnAccent: palette.gray900,

    inputBackground: 'rgba(255, 255, 255, 0.45)',
    inputBorder: palette.gray300,
    inputText: palette.gray900,
    placeholder: palette.gray500,

    border: palette.gray300,
    divider: palette.gray200,

    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,

    overlay: 'rgba(0, 0, 0, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    icon: palette.gray700,
    iconMuted: palette.gray500,
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  ...sharedValues,
  colors: {
    background: palette.dark.bg,
    surface: palette.dark.surface,
    surfaceLight: palette.dark.surfaceLight,
    elevated: palette.dark.elevated,

    primary: palette.accent,             // Peach becomes primary in dark mode
    primaryLight: palette.accentLight,
    primaryDark: palette.accentDark,
    accent: palette.accent,
    accentLight: palette.accentLight,
    accentDark: palette.accentDark,
    secondary: palette.secondary,
    secondaryLight: palette.secondaryLight,
    secondaryDark: palette.secondaryDark,

    text: palette.gray50,
    textSecondary: palette.gray400,
    textMuted: palette.gray600,
    textOnPrimary: palette.gray950,
    textOnAccent: palette.gray900,

    inputBackground: palette.dark.surfaceLight,
    inputBorder: palette.dark.elevated,
    inputText: palette.gray100,
    placeholder: palette.gray600,

    border: palette.dark.elevated,
    divider: palette.dark.surfaceLight,

    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,

    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    icon: palette.gray400,
    iconMuted: palette.gray600,
  },
};
