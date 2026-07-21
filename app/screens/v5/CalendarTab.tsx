/** Calendar tab: day timeline (2px/min, now-line, free-window), week load
 * summary and month grid — ported from the v5 mock. */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, priorityColor, withAlpha } from '../../theme';
import { weekShort, monthsGen, weekdaysFull, dayPhrase, pluralTasks } from '../../lib/v5data';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { CategoryTag } from './ui';
import { CalendarIcon, HamburgerDotsIcon, FlagIcon } from '../../components/icons';

const END_HOUR = 18;
const PX_PER_MIN = 2;

/** '09:30' + 60 min → '10:30' (clamped to same day). */
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(24 * 60 - 1, h * 60 + m + mins);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function CalendarTab() {
  const s = useV5();
  const today = new Date();
  const offset = s.calendarDayOffset;
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + offset);
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
  const calendarDateLabel = `${selectedDate.getDate()} ${monthsGen[selectedDate.getMonth()]}, ${weekdaysFull[selectedDate.getDay()]}`;

  const dayMs = 86400000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const offsetOf = (d: Date) => Math.round((startOfDay(d) - startOfDay(today)) / dayMs);
  const catColor = (name: string) => s.categories[name] || palette.textFaint;

  const viewTabs: { v: typeof s.calendarView; label: string }[] = [
    { v: 'day', label: 'День' }, { v: 'week', label: 'Тиждень' }, { v: 'month', label: 'Місяць' },
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const isSelected = d.toDateString() === selectedDate.toDateString();
    return { i, d, num: d.getDate(), label: weekShort[i], isToday, isSelected, off: offsetOf(d) };
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <CalendarIcon size={24} color={palette.accent} />
            <View style={{ minWidth: 0 }}>
              <Text style={styles.h1}>Календар</Text>
              <View style={styles.dateNav}>
                <Pressable onPress={s.prevDay} style={styles.navArrow}><Text style={styles.navArrowText}>‹</Text></Pressable>
                <Text style={styles.dateLabel}>{calendarDateLabel}</Text>
                <Pressable onPress={s.nextDay} style={styles.navArrow}><Text style={styles.navArrowText}>›</Text></Pressable>
              </View>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <Pressable onPress={s.goToToday} style={styles.todayBtn}><Text style={styles.todayBtnText}>Сьогодні</Text></Pressable>
            <View style={styles.smallBtn}><HamburgerDotsIcon size={15} color={palette.textMuted} /></View>
          </View>
        </View>

        <View style={styles.viewTabs}>
          {viewTabs.map((t) => {
            const active = s.calendarView === t.v;
            return (
              <Pressable key={t.v} onPress={() => s.setCalendarView(t.v)} style={[styles.viewTab, active && styles.viewTabActive]}>
                <Text style={[styles.viewTabText, active && styles.viewTabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {s.calendarView === 'day' ? (
          <View style={styles.weekStrip}>
            {weekDays.map((w) => (
              <Pressable key={w.i} onPress={() => s.setCalendarDay(w.off)} style={styles.weekDay}>
                <Text style={[styles.weekDayLabel, { color: w.isSelected ? palette.text : palette.textFaint }]}>{w.label}</Text>
                <View style={[styles.weekDayNum, { backgroundColor: w.isSelected ? palette.accent : w.isToday ? palette.chip : 'transparent' }]}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: w.isSelected ? palette.text : palette.textSecondary }}>{w.num}</Text>
                </View>
                <View style={[styles.weekDayDot, { opacity: w.isSelected ? 1 : 0.5 }]} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {s.calendarView === 'day' ? <DayView /> : null}
        {s.calendarView === 'week' ? <WeekView monday={monday} offsetOf={offsetOf} /> : null}
        {s.calendarView === 'month' ? <MonthView selectedDate={selectedDate} offsetOf={offsetOf} /> : null}
      </ScrollView>
    </View>
  );

  function DayView() {
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const dayTasks = s.tasks.filter((t) => t.dueInDays === offset);
    const dayEvents = dayTasks
      .filter((t) => t.time)
      .map((t) => ({ id: t.id, start: t.time, end: addMinutes(t.time, 60), title: t.title, category: t.category, completed: t.completed, flag: t.priority === 'urgent' || t.priority === 'high' }))
      .sort((a, b) => a.start.localeCompare(b.start));
    const dayAllDay = dayTasks.filter((t) => !t.time);
    const earliest = dayEvents.length ? Math.min(...dayEvents.map((e) => toMins(e.start))) : 8 * 60;
    const startMinutes = Math.max(0, Math.min(8 * 60, Math.floor((earliest - 30) / 30) * 30));
    const endMinutes = END_HOUR * 60;
    const timeToY = (t: string) => (toMins(t) - startMinutes) * PX_PER_MIN;
    const firstHour = Math.ceil(startMinutes / 60);
    const totalHeight = (endMinutes - startMinutes) * PX_PER_MIN;

    const gridLines: React.ReactNode[] = [];
    for (let h = firstHour; h <= END_HOUR; h++) {
      gridLines.push(<View key={`g${h}`} style={{ position: 'absolute', left: 44, right: 0, top: (h * 60 - startMinutes) * PX_PER_MIN, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />);
      if (h < END_HOUR) gridLines.push(<View key={`gh${h}`} style={{ position: 'absolute', left: 44, right: 0, top: (h * 60 - startMinutes) * PX_PER_MIN + 60, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />);
    }
    const hourMarks = Array.from({ length: END_HOUR - firstHour + 1 }, (_, i) => {
      const h = firstHour + i;
      return (
        <Text key={`hm${h}`} style={{ position: 'absolute', top: (h * 60 - startMinutes) * PX_PER_MIN - 7, left: 0, fontSize: 12, color: palette.textFaint, backgroundColor: palette.bg, paddingRight: 6 }}>
          {`${String(h).padStart(2, '0')}:00`}
        </Text>
      );
    });

    const nowY = timeToY('10:30');
    const showNow = offset === 0 && nowY >= 0 && nowY <= totalHeight;
    const freeTop = timeToY('14:00');
    const freeBottom = timeToY('16:00');

    return (
      <View>
        <View style={styles.allDayCard}>
          <Text style={styles.allDayLabel}>На весь день · {dayAllDay.length}</Text>
          {dayAllDay.map((a) => (
            <View key={a.id} style={styles.allDayRow}>
              <Pressable onPress={() => s.toggleComplete(a.id)} style={[styles.allDayCheckbox, a.completed ? { backgroundColor: palette.accent } : { borderWidth: 1.5, borderColor: palette.border }]}>
                {a.completed ? <Text style={{ color: palette.text, fontSize: 10 }}>✓</Text> : null}
              </Pressable>
              <Text style={[styles.allDayTitle, a.completed && { color: palette.textFaint, textDecorationLine: 'line-through' }]}>{a.title}</Text>
              <CategoryTag name={a.category} color={catColor(a.category)} fontSize={10} />
            </View>
          ))}
        </View>

        <View style={{ position: 'relative', height: totalHeight + 30 }}>
          {gridLines}
          {hourMarks}

          {showNow ? (
            <>
              <View style={{ position: 'absolute', left: 44, right: 0, top: nowY, height: 1, backgroundColor: palette.accent, opacity: 0.75 }} />
              <View style={{ position: 'absolute', left: 40, top: nowY - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent, opacity: 0.9 }} />
              <Text style={{ position: 'absolute', left: 0, top: nowY - 7, fontSize: 10.5, fontWeight: '600', color: palette.accent }}>10:30</Text>
            </>
          ) : null}

          {dayEvents.map((ev) => {
            const top = timeToY(ev.start);
            const mins = toMins(ev.end) - toMins(ev.start);
            const height = mins * PX_PER_MIN;
            const compact = mins < 60;
            const cc = catColor(ev.category);
            const Icon = ev.flag ? <FlagIcon size={14} color={palette.accent} filled={false} /> : null;
            if (compact) {
              return (
                <View key={ev.id} style={[styles.eventCard, { top, height, borderLeftColor: cc, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 34 }]}>
                  <Text style={{ fontSize: 11.5, color: palette.textMuted }}>{`${ev.start}–${ev.end}`}</Text>
                  <Text style={{ fontSize: 13.5, color: palette.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{ev.title}</Text>
                  <CategoryTag name={ev.category} color={cc} />
                  {Icon ? <View style={{ marginLeft: 4 }}>{Icon}</View> : null}
                </View>
              );
            }
            return (
              <View key={ev.id} style={[styles.eventCard, { top, height, borderLeftColor: cc, paddingVertical: 9, paddingHorizontal: 12 }]}>
                <Text style={{ fontSize: 11, color: palette.textFaint }}>{`${ev.start} – ${ev.end}`}</Text>
                <Text style={{ fontSize: 14, color: palette.text, fontWeight: '600', marginTop: 3 }}>{ev.title}</Text>
                <View style={{ position: 'absolute', top: 9, right: 34 }}><CategoryTag name={ev.category} color={cc} /></View>
                {Icon ? <View style={{ position: 'absolute', top: 11, right: 10 }}>{Icon}</View> : null}
              </View>
            );
          })}

          <Pressable onPress={s.scheduleFreeWindow} style={[styles.freeWindow, { top: freeTop, height: freeBottom - freeTop }]}>
            <Text style={{ fontSize: 13.5, color: palette.text, fontWeight: '600' }}>14:00 – 16:00</Text>
            <Text style={{ fontSize: 11.5, color: palette.textMuted, marginTop: 2 }}>Вільне вікно · 2 години</Text>
            <Text style={{ marginTop: 8, color: palette.accent, fontSize: 12, fontWeight: '600' }}>+ Запланувати</Text>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Сьогодні</Text>
          <View style={styles.statsRow}>
            {[['Зайнято', '5 год 30 хв'], ['Вільно', '3 год 15 хв'], ['Задач', '7'], ['Виконано', '3']].map(([k, v]) => (
              <View key={k}>
                <Text style={styles.statsKey}>{k}</Text>
                <Text style={styles.statsVal}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.statsTrack}><View style={{ width: '61%', height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
            <Text style={{ fontSize: 12.5, color: palette.textMuted }}>61%</Text>
          </View>
        </View>
      </View>
    );
  }
}

function WeekView({ monday, offsetOf }: { monday: Date; offsetOf: (d: Date) => number }) {
  const s = useV5();
  const rows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const off = offsetOf(d);
    const dayTasks = s.tasks.filter((t) => !t.completed && t.dueInDays === off);
    const timed = dayTasks.filter((t) => t.time).length;
    const busy = timed * 60 + (dayTasks.length - timed) * 30;
    const busyLabel = busy === 0 ? '' : busy >= 60 ? `${Math.floor(busy / 60)} год${busy % 60 ? ' ' + (busy % 60) + ' хв' : ''}` : `${busy} хв`;
    const isSelected = off === s.calendarDayOffset;
    const isToday = off === 0;
    const loadPct = Math.min(100, Math.round((busy / 480) * 100));
    return { i, num: d.getDate(), label: weekShort[i], off, dayTasks, busyLabel, isSelected, isToday, loadPct };
  });
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <Pressable key={r.i} onPress={() => { s.setCalendarDay(r.off); s.setCalendarView('day'); }} style={[styles.weekRow, { borderColor: r.isSelected ? palette.accent : palette.border, borderWidth: r.isSelected ? 1.5 : 1 }]}>
          <View style={{ width: 40 }}>
            <Text style={{ fontSize: 11.5, color: r.isToday ? palette.accent : palette.textFaint, fontWeight: r.isToday ? '700' : '400' }}>{r.label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text, marginTop: 2 }}>{r.num}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.weekLoadTrack}><View style={{ width: `${r.loadPct}%`, height: '100%', backgroundColor: r.loadPct === 0 ? 'transparent' : palette.accent, borderRadius: 3 }} /></View>
            <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 6 }}>{r.dayTasks.length === 0 ? 'Вільний день' : `${r.dayTasks.length} ${pluralTasks(r.dayTasks.length)} · ${r.busyLabel}`}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function MonthView({ selectedDate, offsetOf }: { selectedDate: Date; offsetOf: (d: Date) => number }) {
  const s = useV5();
  const today = new Date();
  const anchor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const gridStart = new Date(anchor);
  gridStart.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
    const off = offsetOf(d);
    const inMonth = d.getMonth() === selectedDate.getMonth();
    const isToday = d.toDateString() === today.toDateString();
    const isSelected = off === s.calendarDayOffset;
    const dayTasks = s.tasks.filter((t) => !t.completed && t.dueInDays === off);
    return { i, num: d.getDate(), off, inMonth, isToday, isSelected, dots: dayTasks.slice(0, 3) };
  });
  const selOffset = s.calendarDayOffset;
  const selDate = new Date(today); selDate.setDate(today.getDate() + selOffset);
  const labelBase = selOffset === 0 ? 'Сьогодні' : `${selDate.getDate()} ${monthsGen[selDate.getMonth()]}`;
  const selTasks = s.tasks.filter((t) => !t.completed && t.dueInDays === selOffset);

  return (
    <View>
      <View style={styles.monthWeekRow}>
        {weekShort.map((l) => <Text key={l} style={styles.monthWeekLabel}>{l}</Text>)}
      </View>
      <View style={styles.monthGrid}>
        {cells.map((c) => (
          <Pressable key={c.i} onPress={() => s.setCalendarDay(c.off)} style={[styles.monthCell, { opacity: c.inMonth ? 1 : 0.32 }]}>
            <View style={[styles.monthNum, { backgroundColor: c.isSelected ? palette.accent : 'transparent', borderWidth: c.isToday && !c.isSelected ? 1 : 0, borderColor: palette.accent }]}>
              <Text style={{ fontSize: 13, fontWeight: c.isToday ? '700' : '500', color: c.isSelected ? palette.text : palette.textSecondary }}>{c.num}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
              {c.dots.map((t: V5Task) => <View key={t.id} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: priorityColor(t.priority) }} />)}
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.monthSelLabel}>Задачі · {labelBase}</Text>
      <View style={{ gap: 8 }}>
        {selTasks.length === 0 ? (
          <Text style={styles.monthEmpty}>Немає задач на цей день</Text>
        ) : selTasks.map((t) => (
          <View key={t.id} style={styles.monthTaskRow}>
            <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: priorityColor(t.priority) }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: palette.text }}>{t.title}</Text>
              <Text style={{ fontSize: 10.5, color: withAlpha(s.categories[t.category] || palette.textFaint, 0.9), marginTop: 3 }}>{t.category}</Text>
            </View>
            <Text style={{ fontSize: 11.5, color: palette.textMuted }}>{t.time ? `${dayPhrase(t.dueInDays!)}, ${t.time}` : dayPhrase(t.dueInDays!)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  h1: { fontSize: 24, fontWeight: '700', color: palette.text, letterSpacing: -0.3 },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  navArrow: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { color: palette.textFaint, fontSize: 15 },
  dateLabel: { fontSize: 13, color: palette.textMuted },
  headerBtns: { flexDirection: 'row', gap: 8 },
  todayBtn: { paddingHorizontal: 12, height: 32, borderRadius: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { color: palette.textSecondary, fontSize: 12 },
  smallBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  viewTabs: { flexDirection: 'row', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 4, marginBottom: 14 },
  viewTab: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center' },
  viewTabActive: { borderColor: palette.accent },
  viewTabText: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  viewTabTextActive: { color: palette.accent },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDay: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, width: 44, minHeight: 44 },
  weekDayLabel: { fontSize: 11.5 },
  weekDayNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekDayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent },
  scroll: { paddingHorizontal: 20, paddingBottom: 150 },
  allDayCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  allDayLabel: { fontSize: 11, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  allDayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  allDayCheckbox: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  allDayTitle: { flex: 1, fontSize: 13, color: palette.text },
  eventCard: { position: 'absolute', left: 62, right: 0, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, borderLeftWidth: 3, overflow: 'hidden' },
  freeWindow: { position: 'absolute', left: 62, right: 0, borderRadius: 12, borderWidth: 1.5, borderColor: palette.chipBorder, borderStyle: 'dashed', paddingHorizontal: 14, justifyContent: 'center' },
  statsCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 16, marginTop: 18 },
  statsTitle: { fontSize: 13, fontWeight: '600', color: palette.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statsKey: { fontSize: 11, color: palette.textMuted },
  statsVal: { fontSize: 14.5, color: palette.text, fontWeight: '600', marginTop: 3 },
  statsTrack: { flex: 1, height: 6, backgroundColor: palette.chip, borderRadius: 3, overflow: 'hidden' },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: palette.surface, borderRadius: 14 },
  weekLoadTrack: { height: 6, backgroundColor: palette.chip, borderRadius: 3, overflow: 'hidden' },
  monthWeekRow: { flexDirection: 'row', marginBottom: 6 },
  monthWeekLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: palette.textFaint, paddingVertical: 4 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  monthCell: { width: `${100 / 7}%`, alignItems: 'center', gap: 3, paddingVertical: 6, minHeight: 44 },
  monthNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  monthSelLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  monthEmpty: { fontSize: 13, color: palette.textFaint, paddingVertical: 16, textAlign: 'center' },
  monthTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14 },
});
