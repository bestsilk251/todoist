/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VoiceTodo.app',
      build:
        'xcodebuild -workspace ios/VoiceTodo.xcworkspace -scheme VoiceTodo -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    // Primary test device — 402 × 874 pt, Dynamic Island, 34 pt home indicator.
    'iphone-16-pro': {
      type: 'ios.simulator',
      device: { type: 'iPhone 16 Pro' },
    },
    // Smallest supported width (375 pt) — catches layouts that only fit on 402.
    'iphone-se': {
      type: 'ios.simulator',
      device: { type: 'iPhone SE (3rd generation)' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'iphone-16-pro', app: 'ios.debug' },
    'ios.se.debug': { device: 'iphone-se', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
  },
};
