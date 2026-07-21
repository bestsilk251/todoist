/**
 * Design tokens for the "Task Manager v3" dark theme.
 * Primary test device: iPhone 16 Pro (402 × 874 pt, safe area 62 / 34).
 * Layouts use flex + these tokens; never hard-code the device width.
 */

import { PixelRatio, Platform } from 'react-native';

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

export const colors = {
  // Backgrounds
  bg: '#050506',
  surface: '#0B0B0D',
  card: '#151518',
  chip: '#202024',
  // Borders
  border: '#29292E',
  // Text
  text: '#F5F5F5',
  textMuted: '#9A9AA1',
  textFaint: '#6E6E76',
  // Accent
  accent: '#E53935',
  accentDim: 'rgba(229,57,53,0.12)',
  accentDeep: '#8F1D24',
  accentText: '#F09A97',
} as const;

/** 8-pt-ish spacing scale used across the design. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Apple HIG minimum tap target is 44 pt; keep interactive controls >= this. */
export const touch = {
  minTarget: 44,
  primaryButtonHeight: 52,
  inputMinHeight: 48,
  iconButton: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  sheet: 24,
  phone: 40,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  cardTitle: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  chip: { fontSize: 11, fontWeight: '400' },
  section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6 },
} as const;

export const hairline = 1 / PixelRatio.get();
export const homeIndicatorInset = Platform.OS === 'ios' ? DEVICE.safeAreaBottom : 0;
