import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './screens/AuthScreen';
import MainScreen from './screens/v5/MainScreen';
import type { UserProfile } from './screens/v5/store';
import { useAuth, signOut } from './lib/useAuth';
import { USAGE_GUIDE_PENDING_METADATA_KEY } from './lib/usageGuide';
import { palette } from './theme';

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
    usageGuidePending: user?.user_metadata?.[USAGE_GUIDE_PENDING_METADATA_KEY] === true,
  };
}

export default function App() {
  const { session, loading } = useAuth();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {loading ? (
        <View style={styles.splash}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : session ? (
        <MainScreen onSignOut={() => { void signOut(); }} profile={profileFromSession(session.user)} />
      ) : (
        <AuthScreen />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
});
