/**
 * Home Screen — Constants & Shared Data
 * ──────────────────────────────────────
 */
import { Dimensions } from 'react-native';

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ── Monochrome palette ─────────────────────────────────── */
export const mono = {
  black: '#000000',
  bg: '#050505',
  surface: '#0A0A0A',
  card: '#0E0E0E',
  cardAlt: '#121212',
  border: '#1A1A1A',
  borderLight: '#242424',
  borderMid: '#2E2E2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#606060',
  textDim: '#404040',
  accent: '#FFFFFF',
  glow: 'rgba(255,255,255,0.04)',
  glowStrong: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(255,255,255,0.03)',
};

/* ── Stats data ─────────────────────────────────────────── */
export const STATS_DATA = [
  { icon: 'calendar-outline' as const, label: 'Events', value: 12, suffix: '' },
  { icon: 'images-outline' as const, label: 'Photos', value: 847, suffix: '' },
  { icon: 'heart-outline' as const, label: 'Memories', value: 56, suffix: '' },
  { icon: 'cloud-outline' as const, label: 'Storage', value: 2.4, suffix: 'GB' },
];

/* ── Timeline data ──────────────────────────────────────── */
export const TIMELINE_DATA = [
  { icon: 'add-circle-outline' as const, title: 'Event Created', desc: 'Annual Meetup 2026', time: '2h ago' },
  { icon: 'cloud-upload-outline' as const, title: 'Photos Uploaded', desc: '24 photos added', time: '5h ago' },
  { icon: 'share-outline' as const, title: 'Memories Shared', desc: 'Shared with 3 people', time: '1d ago' },
  { icon: 'create-outline' as const, title: 'Event Updated', desc: 'Weekend Retreat edited', time: '2d ago' },
];

/* ── Features data ──────────────────────────────────────── */
export const FEATURES_DATA = [
  { icon: 'shield-checkmark-outline' as const, title: 'Secure Cloud\nStorage', desc: 'End-to-end encrypted storage for all your memories' },
  { icon: 'sparkles-outline' as const, title: 'AI Powered\nOrganization', desc: 'Smart face recognition and auto-categorization' },
  { icon: 'albums-outline' as const, title: 'Event Based\nGallery', desc: 'Organize photos by events automatically' },
  { icon: 'flash-outline' as const, title: 'Fast Upload\nSystem', desc: 'Parallel uploads with progress tracking' },
  { icon: 'lock-closed-outline' as const, title: 'Privacy First\nDesign', desc: 'Your data stays yours, always' },
];

/* ── Motivational quotes ────────────────────────────────── */
export const QUOTES = [
  'Every moment is a memory waiting to be captured.',
  'Your story unfolds one photo at a time.',
  'Elegance is the beauty that never fades.',
  'Preserve today. Relive tomorrow.',
  'The art of memories, perfected.',
];

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getFormattedTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
