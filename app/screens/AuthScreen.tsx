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
import { spacing, touch, typography, colors, radius } from '../theme';

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
        // On success the auth listener in useAuth swaps the navigator; no nav here.
      } else {
        const { data, error: e } = await client.auth.signUp({ email, password });
        if (e) throw e;
        // If email confirmations are on, there is no session yet.
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.md }]}>
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
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          testID="auth-submit"
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryText} />
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  input: {
    minHeight: touch.inputMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  button: {
    height: touch.primaryButtonHeight,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.primaryText, ...typography.callout, fontWeight: '600' },
  switch: { alignItems: 'center', paddingVertical: spacing.sm, minHeight: touch.minTarget },
  switchText: { ...typography.subhead, color: colors.primary },
  error: { color: colors.danger, ...typography.footnote },
  info: { color: colors.warningText, ...typography.footnote },
});
