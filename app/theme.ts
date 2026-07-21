/**
 * Design tokens, calibrated to the primary test device: iPhone 16 Pro.
 *
 *   Logical size : 402 × 874 pt
 *   Native pixels: 1206 × 2622 px (@3x, 460 ppi)
 *   Safe area    : top 62 pt (Dynamic Island), bottom 34 pt (home indicator)
 *
 * The visual language is the dark "Task Manager v5" redesign: near-black
 * background (#0B0B0D), red accent (#E53935), muted category palette and
 * priority-only left-bar indicators. Everything below is expressed in points
 * on an 8-pt grid so layouts scale predictably to smaller and larger phones.
 * Never hard-code 402 in a layout — use flex plus these tokens.
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

/** Reference device metrics. For tests and design docs, not for layout math. */
export const DEVICE = {
  name: 'iPhone 16 Pro',
  width: 402,
  height: 874,
  scale: 3,
  nativeWidth: 1206,
  nativeHeight: 2622,
  safeAreaTop: 62,
  safeAreaBottom: 34,
} as const;

/** Live metrics of whatever device is actually running the app. */
export const screen = {
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
  get scale() {
    return PixelRatio.get();
  },
  get isReferenceWidth() {
    return Math.round(Dimensions.get('window').width) === DEVICE.width;
  },
  get isCompact() {
    return Dimensions.get('window').width < DEVICE.width;
  },
};

/** 8-pt spacing scale. Use these, not raw numbers. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Minimum sizes from Apple's Human Interface Guidelines. 44 pt is the smallest
 * reliably tappable target; anything below it fails accessibility review.
 */
export const touch = {
  minTarget: 44,
  primaryButtonHeight: 52,
  inputMinHeight: 48,
  iconButton: 48,
} as const;

/** Type scale in points. */
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '500' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

/**
 * Full v5 dark palette. `colors` keeps the historical key names (so the older
 * light-theme screens still type-check) but every value now points at its dark
 * equivalent. Reach for `palette` for the complete, design-accurate set.
 */
export const palette = {
  /** Backgrounds */
  pageBg: '#050506', // outer frame behind the phone
  bg: '#0B0B0D', // app background
  surface: '#151518', // cards, sheets, chips-on-card
  surfaceAlt: '#101012', // completed-task cards
  surfaceAltBorder: '#1C1C20',
  chip: '#202024', // small pill backgrounds / secondary buttons
  chipBorder: '#33333A',

  /** Borders */
  border: '#29292E',
  borderStrong: '#33333A',
  borderFaint: '#202024',
  overdueBorder: '#5C2323',

  /** Text */
  text: '#F5F5F5',
  textSecondary: '#D8D8DC',
  textMuted: '#9A9AA1',
  textFaint: '#6E6E76',
  textFainter: '#4A4A50',
  textGhost: '#3E3E44',

  /** Red accent family */
  accent: '#E53935',
  accentLight: '#F5675E',
  accentFab: '#B23A34',
  accentDeep: '#8F1D24',
  accentSoftText: '#F09A97',
  accentPaleText: '#F5CFCD',
  logout: '#E5645D',

  /** Priority colors */
  priorityUrgent: '#E53935',
  priorityHigh: '#E5793A',
  priorityMedium: '#C9A227',
  priorityLow: '#5A5A62',

  /** Badge accents */
  badgeStreak: '#E5793A',
  badgeGold: '#C9A227',
  badgePurple: '#8B6DE0',
  badgeGreen: '#5FA07A',

  white: '#F5F5F5',
} as const;

/** Backwards-compatible alias used across the codebase. */
export const colors = {
  background: palette.bg,
  surface: palette.surface,
  border: palette.border,
  borderStrong: palette.borderStrong,
  text: palette.text,
  textMuted: palette.textMuted,
  textFaint: palette.textFaint,
  primary: palette.accent,
  primaryText: palette.white,
  warning: palette.priorityMedium,
  warningSurface: 'rgba(201,162,39,0.14)',
  warningText: palette.priorityMedium,
  danger: palette.accent,
} as const;

/** Default category → color map (matches v5 seed state). */
export const categoryColors: Record<string, string> = {
  'Робота': '#7B6FA6',
  "Здоров'я": '#5FA07A',
  'Дім': '#4E9DA6',
  'Особисте': '#6E8CB8',
  'Навчання': '#A88A5C',
};

/** Swatch palette offered in the category-color editor. */
export const categorySwatches = [
  '#7B6FA6', '#6E8CB8', '#5FA07A', '#4E9DA6',
  '#A88A5C', '#B07A8C', '#8C8C94', '#A0785A',
] as const;

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export function priorityColor(p: Priority): string {
  switch (p) {
    case 'urgent': return palette.priorityUrgent;
    case 'high': return palette.priorityHigh;
    case 'medium': return palette.priorityMedium;
    default: return palette.priorityLow;
  }
}

export function priorityLabel(p: Priority): string {
  switch (p) {
    case 'urgent': return 'Терміновий';
    case 'high': return 'Високий';
    case 'medium': return 'Середній';
    default: return 'Без пріоритету';
  }
}

/** Convert a #rrggbb hex to an rgba() string with the given alpha. */
export function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Hairline that renders as a true 1-physical-pixel line. */
export const hairline = 1 / PixelRatio.get();

/** Extra bottom padding above the home indicator when not inside a SafeAreaView. */
export const homeIndicatorInset = Platform.OS === 'ios' ? DEVICE.safeAreaBottom : 0;
