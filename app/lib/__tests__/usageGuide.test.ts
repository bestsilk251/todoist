import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasSeenUsageGuide,
  markUsageGuideSeen,
  shouldAutoOpenUsageGuide,
  usageGuideStorageKey,
} from '../usageGuide';

describe('usage guide persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('uses a versioned, account-specific storage key', () => {
    expect(usageGuideStorageKey(' User@Example.com ')).toBe('voice-todo:usage-guide:v1:user@example.com');
    expect(usageGuideStorageKey('another@example.com')).not.toBe(usageGuideStorageKey('user@example.com'));
  });

  it('marks the guide as seen for the selected account', async () => {
    expect(await hasSeenUsageGuide('user@example.com')).toBe(false);
    await markUsageGuideSeen('user@example.com');
    expect(await hasSeenUsageGuide('user@example.com')).toBe(true);
    expect(await hasSeenUsageGuide('other@example.com')).toBe(false);
  });

  it('opens automatically only for an unseen newly created account', () => {
    expect(shouldAutoOpenUsageGuide(true, false)).toBe(true);
    expect(shouldAutoOpenUsageGuide(false, false)).toBe(false);
    expect(shouldAutoOpenUsageGuide(true, true)).toBe(false);
    expect(shouldAutoOpenUsageGuide(false, true)).toBe(false);
  });
});
