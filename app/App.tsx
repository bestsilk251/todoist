import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CaptureScreen from './screens/CaptureScreen';
import ConfirmScreen from './screens/ConfirmScreen';
import TaskListScreen from './screens/TaskListScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import AuthScreen from './screens/AuthScreen';
import { useAuth } from './lib/useAuth';
import type { RootStackParamList } from './types';
import { colors, typography } from './theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { ...typography.heading, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
} as const;

export default function App() {
  const { session, loading } = useAuth();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {loading ? (
          <View style={styles.splash}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : session ? (
          <Stack.Navigator initialRouteName="Capture" screenOptions={screenOptions}>
            <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Нова задача' }} />
            <Stack.Screen name="Confirm" component={ConfirmScreen} options={{ title: 'Підтвердити' }} />
            <Stack.Screen name="TaskList" component={TaskListScreen} options={{ title: 'Мої задачі' }} />
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
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
