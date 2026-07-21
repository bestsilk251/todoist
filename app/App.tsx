import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MainScreen from './screens/MainScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import AuthScreen from './screens/AuthScreen';
import { useAuth } from './lib/useAuth';
import type { RootStackParamList } from './types';
import { colors, typography } from './theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { ...typography.heading, color: colors.text },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
} as const;

export default function App() {
  const { session, loading } = useAuth();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        {loading ? (
          <View style={styles.splash}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : session ? (
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Edit"
              component={EditTaskScreen}
              options={{ title: 'Редагувати', presentation: 'modal' }}
            />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
