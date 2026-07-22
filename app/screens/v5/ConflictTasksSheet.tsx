import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClockIcon } from '../../components/icons';
import { DEFAULT_TIMED_TASK_DURATION_MINUTES, clockToMinutes, minutesToClock } from '../../lib/calendarMath';
import { dayPhrase } from '../../lib/v5data';
import { palette, withAlpha } from '../../theme';
import { CategoryTag } from './ui';
import { useV5 } from './store';

export default function ConflictTasksSheet() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const tasks = s.conflictTaskIds.flatMap((id) => {
    const task = s.tasks.find((item) => item.id === id);
    return task && !task.completed && !task.cancelled ? [task] : [];
  });

  useEffect(() => {
    if (s.conflictTaskIds.length === 0) setConfirmDeleteId(null);
  }, [s.conflictTaskIds.length]);

  if (s.conflictTaskIds.length === 0) return null;

  const range = s.conflictStartMinutes != null && s.conflictEndMinutes != null
    ? `${minutesToClock(s.conflictStartMinutes)}–${minutesToClock(s.conflictEndMinutes)}`
    : null;

  const closeThen = (action: () => void) => {
    s.closeConflictTasks();
    action();
  };

  return (
    <Pressable
      onPress={s.closeConflictTasks}
      accessibilityRole="button"
      accessibilityLabel="Закрити список конфліктних задач"
      style={styles.overlay}
    >
      <Pressable onPress={() => {}} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={styles.headerIcon}><ClockIcon size={18} color={palette.accent} /></View>
          <View style={styles.headerBody}>
            <Text style={styles.eyebrow}>{range ? `Перетин ${range}` : 'Перетин у розкладі'}</Text>
            <Text style={styles.title}>Конфлікт часу</Text>
            <Text style={styles.subtitle}>Оберіть задачу та усуньте накладання в розкладі.</Text>
          </View>
          <Pressable onPress={s.closeConflictTasks} accessibilityLabel="Закрити" style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tasks.map((task) => {
            const duration = task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES;
            const endTime = task.time ? minutesToClock(clockToMinutes(task.time) + duration) : null;
            const categoryColor = s.categories[task.category] || palette.textFaint;
            const isDeleting = confirmDeleteId === task.id;
            return (
              <View key={task.id} style={styles.taskCard}>
                <Pressable
                  onPress={() => closeThen(() => s.openTaskDetail(task.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`Відкрити задачу ${task.title}`}
                  style={styles.taskHeader}
                >
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeStart}>{task.time || '—'}</Text>
                    {endTime ? <Text style={styles.timeEnd}>до {endTime}</Text> : null}
                  </View>
                  <View style={styles.taskBody}>
                    <Text numberOfLines={2} style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.dateText}>{task.dueInDays == null ? 'Без дати' : dayPhrase(task.dueInDays)}</Text>
                      <CategoryTag name={task.category} color={categoryColor} fontSize={10} />
                    </View>
                  </View>
                </Pressable>

                {isDeleting ? (
                  <View style={styles.deleteConfirm}>
                    <Text style={styles.deleteQuestion}>Видалити цю задачу назавжди?</Text>
                    <View style={styles.deleteConfirmActions}>
                      <Pressable onPress={() => setConfirmDeleteId(null)} style={styles.confirmCancelButton}>
                        <Text style={styles.confirmCancelText}>Назад</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Підтвердити видалення задачі ${task.title}`} onPress={() => closeThen(() => s.deleteTask(task.id))} style={styles.confirmDeleteButton}>
                        <Text style={styles.confirmDeleteText}>Видалити</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => closeThen(() => s.openTaskTimePicker(task.id))}
                      accessibilityRole="button"
                      accessibilityLabel={`Змінити час задачі ${task.title}`}
                      style={[styles.actionButton, styles.timeButton]}
                    >
                      <Text style={[styles.actionText, styles.timeButtonText]}>Змінити час</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Перенести задачу ${task.title} на один день`} onPress={() => closeThen(() => s.postponeTask(task.id))} style={styles.actionButton}>
                      <Text style={styles.actionText}>Перенести +1 день</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Скасувати задачу ${task.title}`} onPress={() => closeThen(() => s.cancelTask(task.id))} style={styles.actionButton}>
                      <Text style={styles.actionText}>Скасувати</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Видалити задачу ${task.title}`} onPress={() => setConfirmDeleteId(task.id)} style={[styles.actionButton, styles.deleteButton]}>
                      <Text style={styles.deleteButtonText}>Видалити</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 34,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '84%',
    alignSelf: 'center',
    backgroundColor: palette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: palette.border,
  },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 17, paddingBottom: 14 },
  headerIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.12), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.28) },
  headerBody: { flex: 1, minWidth: 0 },
  eyebrow: { color: palette.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: palette.text, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: 2 },
  subtitle: { color: palette.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  closeButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  closeText: { color: palette.textMuted, fontSize: 25, lineHeight: 27, fontWeight: '300' },
  content: { gap: 10, paddingHorizontal: 20, paddingBottom: 8 },
  taskCard: { padding: 13, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  taskHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBadge: { width: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 12, backgroundColor: withAlpha(palette.accent, 0.08), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.2) },
  timeStart: { color: palette.accentPaleText, fontSize: 13, fontWeight: '800' },
  timeEnd: { color: palette.textFaint, fontSize: 9.5, marginTop: 3 },
  taskBody: { flex: 1, minWidth: 0 },
  taskTitle: { color: palette.text, fontSize: 14.5, lineHeight: 20, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 6 },
  dateText: { color: palette.textFaint, fontSize: 10.5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  actionButton: { minWidth: '47%', flexGrow: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 11, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  actionText: { color: palette.textSecondary, fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
  timeButton: { borderColor: withAlpha(palette.accent, 0.45), backgroundColor: withAlpha(palette.accent, 0.09) },
  timeButtonText: { color: palette.accentPaleText },
  deleteButton: { borderColor: withAlpha(palette.accent, 0.25), backgroundColor: 'transparent' },
  deleteButtonText: { color: palette.accent, fontSize: 11.5, fontWeight: '700' },
  deleteConfirm: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  deleteQuestion: { color: palette.text, fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  deleteConfirmActions: { flexDirection: 'row', gap: 8 },
  confirmCancelButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  confirmCancelText: { color: palette.textSecondary, fontSize: 12, fontWeight: '600' },
  confirmDeleteButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: palette.accent },
  confirmDeleteText: { color: palette.white, fontSize: 12, fontWeight: '700' },
});
