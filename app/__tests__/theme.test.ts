import { DEVICE, darkPalette, lightPalette, spacing, touch, typography, radius } from '../theme';

describe('design tokens', () => {
  it('matches the iPhone 16 Pro reference metrics', () => {
    expect(DEVICE.width).toBe(402);
    expect(DEVICE.height).toBe(874);
    expect(DEVICE.scale).toBe(3);
    expect(DEVICE.nativeWidth).toBe(DEVICE.width * DEVICE.scale);
    expect(DEVICE.nativeHeight).toBe(DEVICE.height * DEVICE.scale);
  });

  it('keeps every spacing step on the 8-pt grid (except the 4-pt half-step)', () => {
    const steps = Object.values(spacing).filter((v) => v !== spacing.xs);
    steps.forEach((v) => expect(v % 8).toBe(0));
    expect(spacing.xs).toBe(4);
  });

  it('never defines a touch target below the 44-pt HIG minimum', () => {
    Object.values(touch).forEach((v) => expect(v).toBeGreaterThanOrEqual(44));
  });

  it('keeps line height above font size for every text style', () => {
    Object.values(typography).forEach((style) => {
      expect(style.lineHeight).toBeGreaterThan(style.fontSize);
    });
  });

  it('leaves room for content between the safe area insets', () => {
    const usableHeight = DEVICE.height - DEVICE.safeAreaTop - DEVICE.safeAreaBottom;
    expect(usableHeight).toBe(778);
  });

  it('exposes a pill radius large enough to fully round any button', () => {
    expect(radius.pill).toBeGreaterThan(touch.primaryButtonHeight);
  });

  it('keeps dark and light themes on the same semantic token contract', () => {
    expect(Object.keys(lightPalette).sort()).toEqual(Object.keys(darkPalette).sort());
    expect(lightPalette.bg).not.toBe(darkPalette.bg);
    expect(lightPalette.text).not.toBe(darkPalette.text);
    expect(lightPalette.accent).toBe(darkPalette.accent);
  });
});
