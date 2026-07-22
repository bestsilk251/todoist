/** Home tab: greeting, banners, quick-add, progress and nearest tasks. */
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, withAlpha, categoryColors } from '../../theme';
import { formatDateLabel, dayPhrase, getNearestTasks, isTaskCurrentOrUpcoming } from '../../lib/v5data';
import { useV5 } from './store';
import { ProgressBar } from './ui';
import NearestTaskCard from './NearestTaskCard';
import {
  ProfileIcon, MicDetailedIcon, PlusIcon, BellIcon, FlagIcon, ClockIcon,
} from '../../components/icons';
import { findWorkingHoursFreeWindows, minutesToClock } from '../../lib/calendarMath';
import { isoFromOffset } from '../../lib/tasksRepo';

export default function HomeTab() {
  const s = useV5();
  const cats = s.categories;
  const today = new Date();
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const dateLabel = formatDateLabel(today);

  const catColor = (name: string) => cats[name] || categoryColors[name] || palette.textFaint;

  const highPriority = s.tasks
    .filter((t) => !t.completed && !t.cancelled && (t.priority === 'urgent' || t.priority === 'high') && isTaskCurrentOrUpcoming(t, today))
    .sort((a, b) => (a.priority === 'urgent' ? -1 : 0) - (b.priority === 'urgent' ? -1 : 0) || a.dueInDays! - b.dueInDays!)[0];
  const priorityReminder = highPriority
    ? `Пріоритетна задача «${highPriority.title}» — ${dayPhrase(highPriority.dueInDays!)}`
    : null;

  const nearest = getNearestTasks(s.tasks, today, 3);

  const soon = s.tasks.find((t) => {
    if (t.completed || t.cancelled || t.dueInDays !== 0 || !t.time) return false;
    const [h, m] = t.time.split(':').map(Number);
    const diff = h * 60 + m - nowMinutes;
    return diff > 0 && diff <= 120;
  });
  let eventSoonBanner: string | null = null;
  if (soon) {
    const [h, m] = soon.time.split(':').map(Number);
    const diff = h * 60 + m - nowMinutes;
    const label = diff < 60 ? `${diff} хв` : `${Math.floor(diff / 60)} год ${diff % 60 ? diff % 60 + ' хв' : ''}`.trim();
    eventSoonBanner = `«${soon.title}» — через ${label}`;
  }

  const mondayOffset = -((today.getDay() + 6) % 7);
  const sundayOffset = mondayOffset + 6;
  const weekTasks = s.tasks.filter((task) => !task.cancelled && task.dueInDays != null && task.dueInDays >= mondayOffset && task.dueInDays <= sundayOffset);
  const completed = weekTasks.filter((task) => task.completed).length;
  const total = weekTasks.length;
  const focused = s.quickFocused || !!s.quickText;
  const todayTimedTasks = s.tasks.filter((task) => task.dueInDays === 0 && task.time && !task.cancelled);
  const todayFreeWindow = s.freeWindowsEnabled
    ? findWorkingHoursFreeWindows(todayTimedTasks, today.getDay())
      .map((window) => ({ ...window, startMinutes: Math.max(window.startMinutes, Math.ceil(nowMinutes / 15) * 15) }))
      .find((window) => window.endMinutes - window.startMinutes >= 30) ?? null
    : null;
  const freeWindowDuration = todayFreeWindow ? todayFreeWindow.endMinutes - todayFreeWindow.startMinutes : 0;
  const freeWindowDurationLabel = freeWindowDuration >= 60
    ? `${Math.floor(freeWindowDuration / 60)} год${freeWindowDuration % 60 ? ` ${freeWindowDuration % 60} хв` : ''}`
    : `${freeWindowDuration} хв`;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable onPress={() => s.setTab('profile')} style={styles.profileBtn}>
        <ProfileIcon size={20} color={palette.textMuted} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.greeting}>Привіт, {s.userName}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        {s.notificationsEnabled && eventSoonBanner ? (
          <View style={styles.soonBanner}>
            <BellIcon size={17} color={palette.accent} />
            <Text style={styles.soonText}>{eventSoonBanner}</Text>
          </View>
        ) : null}

        {priorityReminder ? (
          <Pressable onPress={() => highPriority && s.openTaskInCalendar(highPriority.id)} style={styles.reminder}>
            <FlagIcon size={16} color={palette.accent} />
            <Text style={styles.reminderText}>{priorityReminder}</Text>
          </Pressable>
        ) : null}

        <LinearGradient
          colors={[palette.surface, palette.surfaceAlt] as const}
          style={[styles.quickAdd, { borderColor: withAlpha(palette.accent, focused ? 0.68 : 0.26) }]}
        >
          <View style={styles.quickRow}>
            <TextInput
              value={s.quickText}
              onChangeText={(v) => s.set({ quickText: v })}
              onFocus={() => s.set({ quickFocused: true })}
              onBlur={() => s.set({ quickFocused: false })}
              onSubmitEditing={s.submitQuick}
              placeholder="Що потрібно зробити?"
              placeholderTextColor={palette.textFaint}
              style={styles.quickInput}
              returnKeyType="done"
            />
            <Pressable onPress={s.openMic} style={styles.micBtn}>
              <MicDetailedIcon size={20} />
            </Pressable>
            <Pressable onPress={s.submitQuick} style={styles.submitBtn}>
              <PlusIcon size={14} />
            </Pressable>
          </View>
        </LinearGradient>

        <ProgressBar completed={completed} total={total} label={`${completed} з ${total} задач виконано за цей тиждень`} />

        <Pressable onPress={() => s.setTab('list')} style={styles.viewAll}>
          <Text style={styles.viewAllText}>Переглянути всі задачі →</Text>
        </Pressable>

        {nearest.length > 0 ? (
          <View style={styles.nearestWrap}>
            {nearest.map((task) => <NearestTaskCard key={task.id} task={task} categoryColor={catColor(task.category)} />)}
          </View>
        ) : todayFreeWindow ? (
          <View style={styles.freeWindow}>
            <View style={styles.freeIcon}><ClockIcon size={17} color={palette.accent} /></View>
            <Text style={styles.freeText}>Вільне вікно {minutesToClock(todayFreeWindow.startMinutes)}–{minutesToClock(todayFreeWindow.endMinutes)} · {freeWindowDurationLabel}</Text>
            <Pressable onPress={() => s.scheduleFreeWindow(isoFromOffset(0), minutesToClock(todayFreeWindow.startMinutes), freeWindowDurationLabel)} style={styles.freeBtn}>
              <Text style={styles.freeBtnText}>Запланувати</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileBtn: {
    position: 'absolute', top: 52, right: 20, zIndex: 2,
    width: 44, height: 44, borderRadius: 14, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 110, gap: 14 },
  greeting: { fontSize: 22, fontWeight: '700', color: palette.text, letterSpacing: -0.3 },
  date: { fontSize: 14, color: palette.textMuted, marginTop: 6 },
  soonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: withAlpha(palette.accent, 0.12), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.4),
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12,
  },
  soonText: { flex: 1, fontSize: 12.5, color: palette.accentPaleText, lineHeight: 17 },
  reminder: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12,
  },
  reminderText: { flex: 1, fontSize: 12.5, color: palette.textSecondary, lineHeight: 17 },
  quickAdd: {
    borderWidth: 1, borderRadius: 16, height: 58, paddingLeft: 16, paddingRight: 10, justifyContent: 'center', width: '100%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickInput: { flex: 1, color: palette.text, fontSize: 16, padding: 0 },
  micBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.chip, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  viewAll: { paddingVertical: 6, alignSelf: 'flex-start' },
  viewAllText: { color: palette.textMuted, fontSize: 13 },
  nearestWrap: { width: '100%', gap: 8 },
  freeWindow: {
    width: '100%', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 14,
    backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.chipBorder, borderStyle: 'dashed', borderRadius: 16,
  },
  freeIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: withAlpha(palette.accent, 0.14), alignItems: 'center', justifyContent: 'center' },
  freeText: { fontSize: 13.5, color: palette.textSecondary, textAlign: 'center', lineHeight: 19 },
  freeBtn: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 12, backgroundColor: palette.accent },
  freeBtnText: { color: palette.text, fontSize: 13, fontWeight: '600' },
});
