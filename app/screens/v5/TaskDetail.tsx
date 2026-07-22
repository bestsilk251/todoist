/** Full-screen task detail with date/category/priority, description and share. */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, priorityColor, priorityLabel, withAlpha } from '../../theme';
import { monthsGen, weekdaysFull, descByCategory } from '../../lib/v5data';
import { DEFAULT_TIMED_TASK_DURATION_MINUTES } from '../../lib/calendarMath';
import { isoFromOffset, isoOf, offsetFromToday } from '../../lib/tasksRepo';
import { useV5 } from './store';
import { ChevronLeftIcon, CalendarSlimIcon, FunnelIcon, FlagIcon, PersonPlusIcon, ShareArrowIcon, CaretRight, CheckCircleIcon } from '../../components/icons';
import PreviewDatePicker from './PreviewDatePicker';

export default function TaskDetail() {
  const s = useV5();
  const t = s.tasks.find((x) => x.id === s.taskDetailId);
  const [editingSection, setEditingSection] = useState<'category' | 'priority' | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  useEffect(() => {
    setEditingSection(null);
    setDatePickerOpen(false);
    setDateError(null);
  }, [s.taskDetailId]);
  if (!t) return null;

  const today = new Date();
  const cat = s.categories[t.category] || palette.textFaint;
  const pColor = priorityColor(t.priority);

  const dObj = new Date(today);
  if (t.dueInDays != null) dObj.setDate(today.getDate() + t.dueInDays);
  const fullDateLabel = t.dueInDays == null ? 'Без дати' : `${dObj.getDate()} ${monthsGen[dObj.getMonth()]} ${dObj.getFullYear()}, ${weekdaysFull[dObj.getDay()]}`;

  let endTimeLabel = '—';
  if (t.time) {
    const [h, m] = t.time.split(':').map(Number);
    const totalEndMinutes = h * 60 + m + (t.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES);
    const normalizedEnd = totalEndMinutes % (24 * 60);
    endTimeLabel = `${String(Math.floor(normalizedEnd / 60)).padStart(2, '0')}:${String(normalizedEnd % 60).padStart(2, '0')}${totalEndMinutes >= 24 * 60 ? ' · +1 день' : ''}`;
  }

  let subtitleLabel: string;
  if (t.dueInDays == null) subtitleLabel = 'Без дати';
  else {
    const base = t.dueInDays === 0 ? 'Сьогодні' : t.dueInDays === 1 ? 'Завтра' : fullDateLabel;
    subtitleLabel = base + (t.time ? ', ' + t.time : '');
  }

  const tag = (fontSize: number) => ({ fontSize, color: withAlpha(cat, 0.95), backgroundColor: withAlpha(cat, 0.15), paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, fontWeight: '600' as const, overflow: 'hidden' as const });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={s.closeTaskDetail} style={styles.hBtn}><ChevronLeftIcon size={17} color={palette.textSecondary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ marginTop: 3 }}><FlagIcon size={20} color={pColor} filled /></View>
          <Text style={styles.title}>{t.title}</Text>
        </View>
        <View style={styles.subRow}>
          <Text style={styles.subtitle}>{subtitleLabel}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={tag(12)}>{t.category}</Text>
        </View>

        {t.completed ? (
          <View style={styles.completedCard} accessibilityRole="summary">
            <View style={styles.completedIcon}><CheckCircleIcon size={18} color={palette.badgeGreen} /></View>
            <View style={styles.completedBody}>
              <Text style={styles.completedTitle}>Задачу виконано</Text>
              <Text style={styles.completedText}>Її можна редагувати або повернути до активних задач.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Активувати задачу"
              onPress={() => s.toggleComplete(t.id)}
              style={({ pressed }) => [styles.reactivateButton, pressed && styles.reactivateButtonPressed]}
            >
              <Text style={styles.reactivateText}>Активувати</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={[styles.infoRow, styles.infoDivider]}>
            <CalendarSlimIcon size={17} color={palette.accent} />
            <View style={{ flex: 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Змінити дату задачі"
                onPress={() => { setDateError(null); setDatePickerOpen(true); }}
                style={styles.dateEditorButton}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateEditorLabel}>Дата</Text>
                  <Text style={styles.infoMain}>{fullDateLabel}</Text>
                </View>
                <CaretRight size={7} color={palette.textFaint} />
              </Pressable>
              {dateError ? <Text accessibilityRole="alert" style={styles.dateError}>{dateError}</Text> : null}
              <View style={styles.timeEditorRow}>
                <Pressable onPress={() => s.openTaskTimePicker(t.id)} style={styles.timeEditorButton}>
                  <Text style={styles.timeEditorLabel}>Початок</Text>
                  <Text style={styles.timeEditorValue}>{t.time || 'Додати'}</Text>
                </Pressable>
                <Text style={styles.timeArrow}>→</Text>
                <Pressable onPress={() => s.openTaskEndTimePicker(t.id)} disabled={!t.time} style={[styles.timeEditorButton, !t.time && { opacity: 0.45 }]}>
                  <Text style={styles.timeEditorLabel}>Завершення</Text>
                  <Text style={styles.timeEditorValue}>{endTimeLabel}</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <Pressable onPress={() => setEditingSection(editingSection === 'category' ? null : 'category')} style={[styles.infoRow, styles.infoBetween, styles.infoDivider]}>
            <View style={styles.infoLeft}><FunnelIcon size={17} color={palette.textMuted} /><Text style={styles.infoLabel}>Категорія</Text></View>
            <View style={styles.editValue}><Text style={tag(12)}>{t.category}</Text><CaretRight size={7} color={palette.textFaint} /></View>
          </Pressable>
          {editingSection === 'category' ? (
            <View style={[styles.optionPanel, styles.infoDivider]}>
              {Object.keys(s.categories).map((category) => {
                const color = s.categories[category] || palette.textFaint;
                const active = category === t.category;
                return (
                  <Pressable key={category} onPress={() => { s.updateTask(t.id, { category }); setEditingSection(null); }} style={[styles.optionChip, active && { borderColor: color, backgroundColor: withAlpha(color, 0.14) }]}>
                    <View style={[styles.optionDot, { backgroundColor: color }]} />
                    <Text style={[styles.optionText, active && { color }]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Pressable onPress={() => setEditingSection(editingSection === 'priority' ? null : 'priority')} style={[styles.infoRow, styles.infoBetween]}>
            <View style={styles.infoLeft}><FlagIcon size={17} color={palette.textMuted} /><Text style={styles.infoLabel}>Пріоритет</Text></View>
            <View style={styles.editValue}>
              <Text style={{ fontSize: 12, color: pColor, backgroundColor: withAlpha(pColor, 0.15), paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, fontWeight: '600', overflow: 'hidden' }}>{priorityLabel(t.priority)}</Text>
              <CaretRight size={7} color={palette.textFaint} />
            </View>
          </Pressable>
          {editingSection === 'priority' ? (
            <View style={styles.optionPanel}>
              {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => {
                const color = priorityColor(priority);
                const active = priority === t.priority;
                return (
                  <Pressable key={priority} onPress={() => { s.updateTask(t.id, { priority }); setEditingSection(null); }} style={[styles.optionChip, active && { borderColor: color, backgroundColor: withAlpha(color, 0.14) }]}>
                    <View style={[styles.optionDot, { backgroundColor: color }]} />
                    <Text style={[styles.optionText, active && { color }]}>{priorityLabel(priority)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Опис</Text>
        <Text style={styles.description}>{descByCategory[t.category] || 'Опис відсутній.'}</Text>

        <Pressable onPress={s.openShareSheet} style={styles.shareBtn}>
          <PersonPlusIcon size={19} color={palette.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>Поділитися задачею</Text>
            <Text style={styles.shareSub}>Запросіть інших переглядати або виконувати</Text>
          </View>
          <View style={styles.shareIcon}><ShareArrowIcon size={16} color={palette.white} /></View>
        </Pressable>
      </ScrollView>
      <PreviewDatePicker
        visible={datePickerOpen}
        value={t.dueInDays == null ? null : isoFromOffset(t.dueInDays)}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(iso) => {
          const dueInDays = offsetFromToday(iso);
          if (dueInDays === 0 && t.time) {
            const [hours, minutes] = t.time.split(':').map(Number);
            const now = new Date();
            if (iso === isoOf(now) && hours * 60 + minutes < now.getHours() * 60 + now.getMinutes()) {
              setDateError('Цей час уже минув. Оберіть майбутній день або змініть час задачі.');
              return;
            }
          }
          setDateError(null);
          s.updateTask(t.id, { dueInDays });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.bg, zIndex: 25 },
  header: { paddingTop: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: palette.text, lineHeight: 29, flex: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22, paddingLeft: 30, flexWrap: 'wrap' },
  subtitle: { fontSize: 13.5, color: palette.textMuted },
  dot: { fontSize: 13, color: palette.textFaint },
  completedCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 14, borderRadius: 14, backgroundColor: withAlpha(palette.badgeGreen, 0.08), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.26) },
  completedIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.badgeGreen, 0.1) },
  completedBody: { flex: 1, minWidth: 0 },
  completedTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  completedText: { color: palette.textMuted, fontSize: 10.5, lineHeight: 14, marginTop: 2 },
  reactivateButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 11, backgroundColor: withAlpha(palette.badgeGreen, 0.1), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.32) },
  reactivateButtonPressed: { backgroundColor: withAlpha(palette.badgeGreen, 0.18) },
  reactivateText: { color: palette.badgeGreen, fontSize: 11.5, fontWeight: '700' },
  infoCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, overflow: 'hidden', marginBottom: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  infoBetween: { justifyContent: 'space-between' },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: palette.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoMain: { fontSize: 14, color: palette.text, fontWeight: '500' },
  dateEditorButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dateEditorLabel: { color: palette.textFaint, fontSize: 10.5, marginBottom: 2 },
  dateError: { color: palette.accent, fontSize: 11, lineHeight: 15, marginTop: 4 },
  infoSub: { fontSize: 12.5, color: palette.textMuted, marginTop: 2 },
  infoLabel: { fontSize: 14, color: palette.text },
  timeEditorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  timeEditorButton: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surfaceAlt, paddingHorizontal: 10, justifyContent: 'center' },
  timeEditorLabel: { color: palette.textFaint, fontSize: 10.5 },
  timeEditorValue: { color: palette.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  timeArrow: { color: palette.textFaint, fontSize: 14 },
  editValue: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.surfaceAlt },
  optionChip: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  optionDot: { width: 7, height: 7, borderRadius: 4 },
  optionText: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '500' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  description: { fontSize: 14, color: palette.textSecondary, lineHeight: 22, marginBottom: 24 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  shareTitle: { fontSize: 14.5, fontWeight: '600', color: palette.text },
  shareSub: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  shareIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
});
