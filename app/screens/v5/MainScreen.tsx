/** Root of the dark v5 experience: hosts the active tab, bottom nav and every
 * overlay, all reading from the shared V5 store. */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
import ConflictTasksSheet from './ConflictTasksSheet';
import TaskActionToast from './TaskActionToast';
import ListFiltersSheet from './ListFiltersSheet';
import {
  CategoryEditor, AvatarMenu, LogoutConfirm, ShareSheet, PersonalDataSheet, AppearanceSheet,
  AchievementsSheet, SecurityInfoSheet, AboutAppSheet,
} from './Sheets';
import { fetchAnalytics } from '../../lib/analyticsRepo';
import { getWeekRange } from '../../lib/analyticsMath';

function Shell() {
  const s = useV5();
  const dim = s.voiceState === 'recording';

  useEffect(() => {
    const timer = setTimeout(() => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv';
      void fetchAnalytics(getWeekRange(new Date(), timezone), timezone)
        .catch(() => { /* AnalyticsScreen keeps the visible retry state. */ });
    }, 250);
    return () => clearTimeout(timer);
  }, []);

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
      <PersonalDataSheet />
      <AppearanceSheet />
      <SecurityInfoSheet />
      <AboutAppSheet />
      <PreviewSheet />
      <LogoutConfirm />
      <VoiceOverlay />
      <ListFiltersSheet />
      <ConflictTasksSheet />
      <TimePicker />
      <UsageGuide />
      <TaskActionToast />
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
