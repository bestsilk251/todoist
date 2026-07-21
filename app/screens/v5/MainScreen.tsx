/** Root of the dark v5 experience: hosts the active tab, bottom nav and every
 * overlay, all reading from the shared V5 store. */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { palette } from '../../theme';
import { V5Provider, useV5, type UserProfile } from './store';
import HomeTab from './HomeTab';
import ListTab from './ListTab';
import CalendarTab from './CalendarTab';
import ProfileTab from './ProfileTab';
import BottomNav from './BottomNav';
import ParticleField from './ParticleField';
import VoiceOverlay from './VoiceOverlay';
import PreviewSheet from './PreviewSheet';
import TimePicker from './TimePicker';
import TaskDetail from './TaskDetail';
import { CategoryEditor, AvatarMenu, LogoutConfirm, ShareSheet } from './Sheets';

function Shell() {
  const s = useV5();
  const dim = s.voiceState === 'recording';

  return (
    <View style={styles.root}>
      <ParticleField />
      <View style={[styles.content, dim && styles.contentDim]}>
        {s.activeTab === 'home' ? <HomeTab /> : null}
        {s.activeTab === 'list' ? <ListTab /> : null}
        {s.activeTab === 'calendar' ? <CalendarTab /> : null}
        {s.activeTab === 'profile' ? <ProfileTab /> : null}
        <BottomNav />
      </View>

      <TaskDetail />
      <CategoryEditor />
      <AvatarMenu />
      <ShareSheet />
      <PreviewSheet />
      <LogoutConfirm />
      <VoiceOverlay />
      <TimePicker />
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
});
