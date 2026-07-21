import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '../lib/supabase';
import { colors, spacing, touch, typography, radius } from '../theme';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  async function handleSubmit() {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const client = getSupabaseClient();
      if (mode === 'signIn') {
        const { error: e } = await client.auth.signInWithPassword({ email, password });
        if (e) throw e;
      } else {
        const { data, error: e } = await client.auth.signUp({ email, password });
        if (e) throw e;
        if (!data.session) {
          setInfo('Перевірте пошту, щоб підтвердити реєстрацію, потім увійдіть.');
          setMode('signIn');
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Сталася помилка. Спробуйте ще раз.');
    } finally {
      setBusy(false);
    }
  }

  const isSignIn = mode === 'signIn';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.title}>{isSignIn ? 'Вхід' : 'Реєстрація'}</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textFaint}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={styles.input}
          testID="auth-email"
        />
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={colors.textFaint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          testID="auth-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={busy}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          testID="auth-submit"
        >
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>{isSignIn ? 'Увійти' : 'Зареєструватися'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(isSignIn ? 'signUp' : 'signIn');
            setError(null);
            setInfo(null);
          }}
          style={styles.switch}
          testID="auth-toggle"
        >
          <Text style={styles.switchText}>
            {isSignIn ? 'Немає акаунта? Зареєструватися' : 'Вже є акаунт? Увійти'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.md },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  input: {
    minHeight: touch.inputMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  button: {
    height: touch.primaryButtonHeight,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  switch: { alignItems: 'center', paddingVertical: spacing.sm, minHeight: touch.minTarget },
  switchText: { ...typography.label, color: colors.accent },
  error: { color: colors.accent, ...typography.small },
  info: { color: colors.accentText, ...typography.small },
});
