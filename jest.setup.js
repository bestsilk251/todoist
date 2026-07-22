// Silence the noisy RN animation warning in tests.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/**
 * Render every component test against iPhone 16 Pro safe-area insets
 * (top 62 pt Dynamic Island, bottom 34 pt home indicator) so layout
 * assertions reflect the primary test device rather than a zero-inset screen.
 */
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 62, right: 0, bottom: 34, left: 0 };
  const frame = { x: 0, y: 0, width: 402, height: 874 };

  return {
    ...jest.requireActual('react-native-safe-area-context'),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});

// Match the 16 Pro's logical window size for Dimensions-based logic.
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const dimensions = {
    get: jest.fn().mockReturnValue({ width: 402, height: 874, scale: 3, fontScale: 1 }),
    set: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  };
  return { __esModule: true, default: dimensions, ...dimensions };
});

afterEach(() => {
  jest.clearAllMocks();
});
