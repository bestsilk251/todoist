/** Root of the dark v5 experience: hosts the active tab, bottom nav and every
 * overlay, all reading from the shared V5 store. */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../theme';
import { V5Provider, useV5, type UserProfile } from './store';
import HomeTab from './HomeTab';
import ListTab from './ListTab';
import CalendarTab from './CalendarTab';
import ProfileTab from './ProfileTab';
import AnalyticsScreen from './analytics/AnalyticsScreen';
import BottomNav from './BottomNav';
import ParticleField from './ParticleField';
import VoiceOverlay from './VoiceOverlay';
import PreviewSheet from './PreviewSheet';
import TimePicker from './TimePicker';
import TaskDetail from './TaskDetail';
import UsageGuide from './UsageGuide';
import {
  CategoryEditor, AvatarMenu, LogoutConfirm, ShareSheet,
  AchievementsSheet, SecurityInfoSheet, AboutAppSheet,
} from './Sheets';

function Shell() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  const dim = s.voiceState === 'recording';

  return (
    <View style={styles.root}>
      <ParticleField />
      <View style={[styles.content, dim && styles.contentDim]}>
        {s.activeTab === 'home' ? <HomeTab /> : null}
        {s.activeTab === 'list' ? <ListTab /> : null}
        {s.activeTab === 'calendar' ? <CalendarTab /> : null}
        {s.activeTab === 'analytics' ? <AnalyticsScreen /> : null}
        {s.activeTab === 'profile' ? <ProfileTab /> : null}
        <BottomNav />
      </View>

      <TaskDetail />
      <CategoryEditor />
      <AvatarMenu />
      <ShareSheet />
      <AchievementsSheet />
      <SecurityInfoSheet />
      <AboutAppSheet />
      <PreviewSheet />
      <LogoutConfirm />
      <VoiceOverlay />
      <TimePicker />
      <UsageGuide />
      {s.undoTaskId ? (
        <View style={[styles.undoBar, { bottom: 74 + insets.bottom }]}>
          <Text numberOfLines={1} style={styles.undoMessage}>Завдання виконано</Text>
          <Pressable onPress={s.undoLastComplete} hitSlop={10}><Text style={styles.undoAction}>Скасувати</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function MainScreen({ onSignOut, profile }: { onSignOut?: () => void; profile?: UserProfile }) {
  return (
    <V5Provider onSignOut={onSignOut} profile={profile}>
      <Shell />
    </V5Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { flex: 1 },
  contentDim: { opacity: 0.6, transform: [{ scale: 0.98 }] },
  undoBar: { position: 'absolute', left: 20, right: 20, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: palette.text, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  undoMessage: { flex: 1, color: palette.bg, fontSize: 13.5, fontWeight: '600' },
  undoAction: { color: palette.accentDeep, fontSize: 13.5, fontWeight: '800' },
});
