import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_GUIDE_VERSION = 1;
export const USAGE_GUIDE_PENDING_METADATA_KEY = 'usage_guide_pending';

export function shouldAutoOpenUsageGuide(isPendingForNewAccount: boolean, hasSeenOnDevice: boolean): boolean {
  return isPendingForNewAccount && !hasSeenOnDevice;
}

export function usageGuideStorageKey(identity: string): string {
  const normalized = identity.trim().toLowerCase() || 'local';
  return `voice-todo:usage-guide:v${USAGE_GUIDE_VERSION}:${normalized}`;
}

export async function hasSeenUsageGuide(identity: string): Promise<boolean> {
  return (await AsyncStorage.getItem(usageGuideStorageKey(identity))) === 'seen';
}

export async function markUsageGuideSeen(identity: string): Promise<void> {
  await AsyncStorage.setItem(usageGuideStorageKey(identity), 'seen');
}
