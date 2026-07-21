import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateTask, deleteTask, setTaskStatus } from '../lib/taskActions';
import { isoToDisplayDate, displayDateToIso, normalizeTime, timeToDisplay } from '../lib/dateTime';
import type { Task } from '../types';
import { colors, spacing, touch, typography, radius } from '../theme';

const CATEGORIES = ['Особисте', 'Робота', 'Дім', "Здоров'я"];

export default function EditTaskScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const task = route.params.task as Task;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [date, setDate] = useState(isoToDisplayDate(task.due_date));
  const [time, setTime] = useState(timeToDisplay(task.due_time));
  const [category, setCategory] = useState(task.category ?? 'Особисте');
  const [important, setImportant] = useState(!!task.important);
  const [status, setStatus] = useState<Task['status']>(task.status);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setError('Назва не може бути порожньою.');
      return;
    }
    let dueDate: string | null;
    let dueTime: string | null;
    try {
      dueDate = displayDateToIso(date);
    } catch {
      setError('Дата має бути у форматі ДД-ММ-РРРР.');
      return;
    }
    try {
      dueTime = normalizeTime(time);
    } catch {
      setError('Час має бути у форматі ГГ або ГГ:ХХ (напр. 15 або 15:30).');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate,
        due_time: dueTime,
        is_all_day: dueTime === null,
        category,
        important,
      });
      if (status !== task.status) await setTaskStatus(task.id, status);
      navigation.goBack();
    } catch {
      setError('Не вдалося зберегти зміни. Спробуйте ще раз.');
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteTask(task.id);
      navigation.goBack();
    } catch {
      setError('Не вдалося видалити. Спробуйте ще раз.');
      setBusy(false);
    }
  }

  const done = status === 'done';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.label}>Назва</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={colors.textFaint} testID="edit-title" />

        <Text style={styles.label}>Опис</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="Додати опис…"
          placeholderTextColor={colors.textFaint}
          testID="edit-description"
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Дата</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="ДД-ММ-РРРР"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              testID="edit-date"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Час</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              onBlur={() => {
                try {
                  const n = normalizeTime(time);
                  if (n) setTime(n);
                } catch {
                  /* handleSave surfaces the error */
                }
              }}
              style={styles.input}
              placeholder="напр. 15 або 15:30"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              testID="edit-time"
            />
          </View>
        </View>

        <Text style={styles.label}>Категорія</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.catChip, category === c && styles.catChipOn]}
              testID={`edit-cat-${c}`}
            >
              <Text style={[styles.catChipText, category === c && styles.catChipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setImportant((v) => !v)} style={styles.toggleRow} testID="edit-important">
          <Text style={styles.toggleText}>{important ? '★ Важлива задача' : '☆ Позначити важливою'}</Text>
        </Pressable>

        <Pressable onPress={() => setStatus(done ? 'pending' : 'done')} style={styles.toggleRow} testID="edit-status">
          <Text style={styles.toggleText}>{done ? '↩︎ Повернути в невиконані' : '✓ Позначити виконаною'}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={handleSave} disabled={busy} style={({ pressed }) => [styles.save, pressed && styles.pressed]} testID="edit-save">
          <Text style={styles.saveText}>Зберегти</Text>
        </Pressable>

        <Pressable onPress={handleDelete} disabled={busy} style={styles.delete} testID="edit-delete">
          <Text style={styles.deleteText}>Видалити задачу</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.xs },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    minHeight: touch.inputMinHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border },
  catChipOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  catChipText: { fontSize: 13, color: colors.textMuted },
  catChipTextOn: { color: colors.text },
  toggleRow: { minHeight: touch.minTarget, justifyContent: 'center', marginTop: spacing.sm },
  toggleText: { fontSize: 15, color: colors.accent },
  save: { height: touch.primaryButtonHeight, backgroundColor: colors.accent, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  pressed: { opacity: 0.8 },
  saveText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  delete: { minHeight: touch.minTarget, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  deleteText: { fontSize: 15, color: colors.accentDeep },
  error: { color: colors.accent, ...typography.small, marginTop: spacing.sm },
});
