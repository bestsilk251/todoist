/**
 * Design tokens, calibrated to the primary test device: iPhone 16 Pro.
 *
 *   Logical size : 402 × 874 pt
 *   Native pixels: 1206 × 2622 px (@3x, 460 ppi)
 *   Safe area    : top 62 pt (Dynamic Island), bottom 34 pt (home indicator)
 *
 * Everything below is expressed in points on an 8-pt grid so layouts scale
 * predictably to smaller phones (iPhone SE, 375 pt) and larger ones
 * (16 Pro Max, 440 pt). Never hard-code 402 in a layout — use flex plus these
 * tokens, and use `DEVICE` only for test assertions and design references.
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
  /** True on 402-pt-wide devices (16 Pro, 15 Pro, 14 Pro). */
  get isReferenceWidth() {
    return Math.round(Dimensions.get('window').width) === DEVICE.width;
  },
  /** Narrower than the reference — tighten padding, allow text to wrap. */
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

/**
 * Type scale in points. Sizes track iOS Dynamic Type defaults so the app reads
 * naturally next to system UI on a 402-pt screen.
 */
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '500' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

export const colors = {
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  text: '#111827',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  primary: '#2563eb',
  primaryText: '#ffffff',
  warning: '#f59e0b',
  warningSurface: '#fffbeb',
  warningText: '#b45309',
  danger: '#dc2626',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Hairline that renders as a true 1-physical-pixel line. On the 16 Pro's @3x
 * screen that is 0.333 pt — using 1 pt would look three times too heavy.
 */
export const hairline = 1 / PixelRatio.get();

/**
 * Extra bottom padding for content that sits above the home indicator when a
 * screen is not already wrapped in a safe-area view.
 */
export const homeIndicatorInset = Platform.OS === 'ios' ? DEVICE.safeAreaBottom : 0;
