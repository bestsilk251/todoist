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

import { Appearance, Dimensions, DynamicColorIOS, PixelRatio, Platform } from 'react-native';

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
export const darkPalette = {
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

export type ThemeMode = 'dark' | 'light';
export type ThemePalette = { [Key in keyof typeof darkPalette]: string };

export const lightPalette: ThemePalette = {
  pageBg: '#F1F2F4',
  bg: '#FAFAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F7F9',
  surfaceAltBorder: '#E7E9ED',
  chip: '#F0F1F4',
  chipBorder: '#D9DCE2',
  border: '#E1E3E8',
  borderStrong: '#D2D5DC',
  borderFaint: '#ECEEF1',
  overdueBorder: '#F0B8B5',
  text: '#1B1B1F',
  textSecondary: '#3A3A40',
  textMuted: '#717179',
  textFaint: '#96969E',
  textFainter: '#B1B1B8',
  textGhost: '#C6C6CC',
  accent: '#E53935',
  accentLight: '#F5675E',
  accentFab: '#EF4440',
  accentDeep: '#B72D2A',
  accentSoftText: '#B84A46',
  accentPaleText: '#7D302D',
  logout: '#D94540',
  priorityUrgent: '#E53935',
  priorityHigh: '#D9682F',
  priorityMedium: '#A77E12',
  priorityLow: '#8C8C94',
  badgeStreak: '#D9682F',
  badgeGold: '#B88C18',
  badgePurple: '#7158C6',
  badgeGreen: '#3F8E64',
  white: '#FFFFFF',
};

const palettes: Record<ThemeMode, ThemePalette> = { dark: darkPalette, light: lightPalette };
const cssNames = Object.fromEntries(
  Object.keys(darkPalette).map((key) => [key, `--voice-todo-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`]),
) as Record<keyof ThemePalette, string>;
const cssKeys = new Map(Object.entries(cssNames).map(([key, name]) => [name, key as keyof ThemePalette]));
const alphaVariables = new Map<string, { key: keyof ThemePalette; alpha: number }>();
const dynamicColorPairs = new WeakMap<object, { dark: string; light: string }>();
let activeThemeMode: ThemeMode = 'dark';

function dynamicToken(key: keyof ThemePalette): string {
  if (Platform.OS === 'web') return `var(${cssNames[key]}, ${darkPalette[key]})`;
  if (Platform.OS === 'ios') {
    const value = DynamicColorIOS({ dark: darkPalette[key], light: lightPalette[key] });
    dynamicColorPairs.set(value as object, { dark: darkPalette[key], light: lightPalette[key] });
    return value as unknown as string;
  }
  return darkPalette[key];
}

/** Semantic colors automatically react to the selected theme on web and iOS. */
export const palette = Object.fromEntries(
  (Object.keys(darkPalette) as (keyof ThemePalette)[]).map((key) => [key, dynamicToken(key)]),
) as Record<keyof ThemePalette, string>;

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function syncWebTheme(mode: ThemeMode) {
  if (Platform.OS !== 'web') return;
  const document = (globalThis as typeof globalThis & { document?: Document }).document;
  if (!document) return;
  const root = document.documentElement;
  (Object.keys(cssNames) as (keyof ThemePalette)[]).forEach((key) => {
    root.style.setProperty(cssNames[key], palettes[mode][key]);
  });
  alphaVariables.forEach(({ key, alpha }, variable) => {
    root.style.setProperty(variable, rgba(palettes[mode][key], alpha));
  });
  root.style.colorScheme = mode;
  document.body.style.backgroundColor = palettes[mode].bg;
}

export function applyThemeMode(mode: ThemeMode): void {
  activeThemeMode = mode;
  try { Appearance.setColorScheme(mode); } catch { /* not supported by every platform */ }
  syncWebTheme(mode);
}

export function getActiveThemeMode(): ThemeMode {
  return activeThemeMode;
}

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
  '#7657F6', '#667EEA', '#6E8CB8', '#4E9DA6', '#52C7A5', '#5FA07A', '#8BCB62',
  '#E0AA32', '#E58B45', '#E56F4A', '#E53935', '#DF6483', '#BC63D3', '#8B5CE5',
  '#8B735B', '#8A7D73', '#6D6D74', '#8C8C94', '#A4A4AC', '#B0B0B8', '#5D5D64',
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
export function withAlpha(color: string, a: number): string {
  if (typeof color === 'string') {
    const cssVariable = color.match(/^var\((--voice-todo-[a-z-]+)/)?.[1];
    const key = cssVariable ? cssKeys.get(cssVariable) : undefined;
    if (Platform.OS === 'web' && cssVariable && key) {
      const alphaKey = `${cssVariable}-alpha-${Math.round(a * 1000)}`;
      alphaVariables.set(alphaKey, { key, alpha: a });
      const document = (globalThis as typeof globalThis & { document?: Document }).document;
      document?.documentElement.style.setProperty(alphaKey, rgba(palettes[activeThemeMode][key], a));
      return `var(${alphaKey}, ${rgba(darkPalette[key], a)})`;
    }
    return rgba(color, a);
  }
  const pair = dynamicColorPairs.get(color as unknown as object);
  if (pair && Platform.OS === 'ios') return DynamicColorIOS({ dark: rgba(pair.dark, a), light: rgba(pair.light, a) }) as unknown as string;
  return color;
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
