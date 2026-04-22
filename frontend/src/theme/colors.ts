/**
 * Face Finder — Color Palette
 * ────────────────────────────
 * Warm peach / sandy theme inspired by the welcome screen design.
 * Change ANY color here and it will update across the entire app.
 */

export const palette = {
  // ── Brand ──────────────────────────────────────────────
  primary: '#2D2D2D',          // Dark charcoal (buttons, cards)
  primaryLight: '#3D3D3D',     // Lighter charcoal
  primaryDark: '#1A1A1A',      // Deeper charcoal (pressed states)

  // primary : '#090C08',
  

  accent: '#F2C094',           // Warm peach / sandy (main BG)
  accentLight: '#F7D4B0',      // Lighter peach
  accentDark: '#ffffff',       // Deeper peach
  accentMuted: '#EBB88A',      // Muted peach

  // accent : 'rgb(255, 255, 255)',  

  secondary: '#D4956B',        // Warm terracotta
  secondaryLight: '#E0B08E',   // Lighter terracotta
  secondaryDark: '#B87D57',    // Darker terracotta

  // ── Neutrals ──────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#FAF6F2',           // Very light warm gray
  gray100: '#F0EBE5',
  gray200: '#E0D9D0',
  gray300: '#CFC5B9',
  gray400: '#B5A99B',
  gray500: '#968A7D',
  gray600: '#756A5F',
  gray700: '#524A42',
  gray800: '#3A342E',
  gray900: '#2D2824',
  gray950: '#1E1B18',

  // ── Semantic ──────────────────────────────────────────
  success: '#5CB85C',
  error: '#E74C4C',
  errorLight: '#FFE0E0',
  errorDark: '#CC3333',
  warning: '#F0AD4E',
  info: '#5BC0DE',

  // ── Gold accent (navbar / indicators) ──────────────────
  gold: '#C9A84C',              // Rich gold — active icons & labels
  goldLight: '#E2C878',         // Lighter gold — glow / highlights
  goldMuted: 'rgba(201,168,76,0.12)', // Subtle gold tint — icon bg pill
  goldGlow: 'rgba(201,168,76,0.25)', // Glow ring for active tab

  // ── Dark mode surfaces ────────────────────────────────
  dark: {
    bg: '#0A0A0A',              // True dark background
    surface: '#141414',         // Card / navbar surface
    surfaceLight: '#1E1E1E',    // Elevated surface
    elevated: '#282828',        // Highest elevation
  },
};
