import { useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getSupabaseClient } from '../lib/supabase';
import { isoToDisplayDate } from '../lib/dateTime';
import type { ParsedTask } from '../types';
import { spacing, touch, typography, colors, radius } from '../theme';

export default function ConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<ParsedTask[]>(route.params.tasks);
  const sourceText: string = route.params.sourceText ?? '';

  function updateTitle(index: number, title: string) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, title } : t)));
  }

  async function handleSave() {
    const client = getSupabaseClient();

    await client.from('tasks').insert(
      tasks.map((t) => ({
        title: t.title,
        due_date: t.date,
        due_time: t.time,
        is_all_day: t.is_all_day,
        needs_confirmation: t.needs_confirmation,
        source_text: sourceText,
      })),
    );

    navigation.navigate('TaskList');
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.card, item.needs_confirmation && styles.cardFlagged]}>
            <TextInput
              value={item.title}
              onChangeText={(t) => updateTitle(index, t)}
              style={styles.titleInput}
              testID={`task-title-${index}`}
            />
            <Text style={styles.meta}>
              {item.date ? isoToDisplayDate(item.date) : 'без дати'}
              {item.time ? ` · ${item.time}` : ''}
            </Text>
            {item.needs_confirmation ? <Text style={styles.flag}>⚠️ confirm time</Text> : null}
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          testID="save-button"
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.sm + 2 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touch.minTarget + spacing.lg,
  },
  cardFlagged: { borderColor: colors.warning, backgroundColor: colors.warningSurface },
  titleInput: {
    ...typography.callout,
    color: colors.text,
    padding: 0,
    minHeight: touch.minTarget - spacing.md,
  },
  meta: { ...typography.footnote, color: colors.textMuted, marginTop: spacing.xs + 2 },
  flag: { ...typography.footnote, color: colors.warningText, marginTop: spacing.xs + 2 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveButton: {
    height: touch.primaryButtonHeight,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: { opacity: 0.8 },
  saveText: { color: colors.primaryText, ...typography.callout, fontWeight: '600' },
});
