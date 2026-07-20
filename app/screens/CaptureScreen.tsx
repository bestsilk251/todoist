import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getSupabaseClient } from '../lib/supabase';
import MicButton from '../components/MicButton';
import { spacing, touch, typography, colors, radius } from '../theme';

export default function CaptureScreen() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  async function handleAdd() {
    if (!text.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const client = getSupabaseClient();
      const { data, error: fnError } = await client.functions.invoke('parse-task', {
        body: {
          text,
          currentDate: new Date().toISOString().slice(0, 10),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      if (fnError) throw fnError;

      navigation.navigate('Confirm', { tasks: data.tasks, sourceText: text });
      setText('');
    } catch {
      setError('Не вдалося розпізнати задачу. Спробуйте ще раз або введіть вручну.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Add a task..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
            style={styles.input}
            multiline
            testID="capture-input"
          />
          <MicButton onTranscript={setText} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleAdd}
          disabled={busy}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          testID="add-button"
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.addText}>Add</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: touch.inputMinHeight,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    ...typography.body,
  },
  addButton: {
    height: touch.primaryButtonHeight,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: { opacity: 0.8 },
  addText: { color: colors.primaryText, ...typography.callout, fontWeight: '600' },
  error: { color: colors.danger, ...typography.footnote },
});
