import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './screens/AuthScreen';
import MainScreen from './screens/v5/MainScreen';
import type { UserProfile } from './screens/v5/store';
import { useAuth, signOut } from './lib/useAuth';
import { USAGE_GUIDE_PENDING_METADATA_KEY } from './lib/usageGuide';
import { palette } from './theme';
import { AppThemeProvider, useAppTheme } from './ThemeProvider';

function profileFromSession(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined): UserProfile {
  const email = user?.email ?? '';
  const fullName = (user?.user_metadata?.full_name as string) || email.split('@')[0] || 'Користувач';
  const parts = fullName.trim().split(/\s+/);
  const name = parts[0] || 'друже';
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return {
    id: user?.id ?? '',
    name,
    fullName,
    email,
    initials: (initials || email.slice(0, 2)).toUpperCase(),
    avatarUrl: typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
    usageGuidePending: user?.user_metadata?.[USAGE_GUIDE_PENDING_METADATA_KEY] === true,
  };
}

function AppContent() {
  const { session, loading } = useAuth();
  const { mode, ready } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {loading || !ready ? (
        <View style={styles.splash}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : session ? (
        <MainScreen onSignOut={() => { void signOut(); }} profile={profileFromSession(session.user)} />
      ) : (
        <AuthScreen />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
});
