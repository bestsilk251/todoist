/** Calendar tab: day timeline (2px/min, now-line, free-window), week load
 * summary and month grid — ported from the v5 mock. */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, priorityColor, withAlpha } from '../../theme';
import { weekShort, monthsGen, dayPhrase, pluralTasks } from '../../lib/v5data';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { CategoryTag, ScreenHeader, SegmentedControl } from './ui';
import { CalendarIcon, ClockIcon, FlagIcon } from '../../components/icons';
import { DEFAULT_TIMED_TASK_DURATION_MINUTES, findBoundedFreeWindow, findScheduleConflict, getCompactTimelineRange, getNonHourlyBoundaries, getOccupiedMinutes, clockToMinutes, minutesToClock } from '../../lib/calendarMath';
import { isoFromOffset } from '../../lib/tasksRepo';
import { isTaskInListSection, isTaskOnCalendarDay } from '../../lib/taskSelectors';

const PX_PER_MIN = 2;

export default function CalendarTab() {
  const s = useV5();
  const today = new Date();
  const offset = s.calendarDayOffset;
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + offset);
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));

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
        <ScreenHeader
          icon={<CalendarIcon size={24} color={palette.accent} />}
          title="Календар"
          actions={<>
            <View style={styles.navPair}>
              <Pressable onPress={s.prevDay} style={styles.navArrow}><Text style={styles.navArrowText}>‹</Text></Pressable>
              <View style={styles.navDivider} />
              <Pressable onPress={s.nextDay} style={styles.navArrow}><Text style={styles.navArrowText}>›</Text></Pressable>
            </View>
            <Pressable onPress={s.goToToday} style={styles.todayBtn}><Text style={styles.todayBtnText}>Сьогодні</Text></Pressable>
          </>}
        />

        <View style={styles.viewTabs}>
          <SegmentedControl
            items={viewTabs.map((item) => ({ value: item.v, label: item.label }))}
            value={s.calendarView}
            onChange={s.setCalendarView}
          />
        </View>

        {s.calendarView === 'day' ? (
          <View style={styles.weekStrip}>
            {weekDays.map((w) => (
              <Pressable key={w.i} onPress={() => s.setCalendarDay(w.off)} style={styles.weekDay}>
                <Text style={[styles.weekDayLabel, { color: w.isSelected ? palette.text : palette.textFaint }]}>{w.label}</Text>
                <View style={[styles.weekDayNum, w.isSelected ? styles.weekDayNumSelected : w.isToday ? styles.weekDayNumToday : null]}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: w.isSelected ? palette.accent : palette.textSecondary }}>{w.num}</Text>
                </View>
                <View style={[styles.weekDayDot, { opacity: w.isSelected ? 1 : 0.5 }]} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {s.calendarView === 'month' ? (
        <MonthView selectedDate={selectedDate} offsetOf={offsetOf} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {s.calendarView === 'day' ? <DayView offset={offset} selectedDate={selectedDate} /> : null}
          {s.calendarView === 'week' ? <WeekView monday={monday} offsetOf={offsetOf} /> : null}
        </ScrollView>
      )}
    </View>
  );

}

function DayView({ offset, selectedDate }: { offset: number; selectedDate: Date }) {
  const s = useV5();
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  useEffect(() => setExpandedTimeline(false), [offset]);
  const catColor = (name: string) => s.categories[name] || palette.textFaint;
  const dayTasks = s.tasks.filter((task) => isTaskOnCalendarDay(task, offset));
  const dayEvents = dayTasks
    .filter((task) => task.time)
    .map((task) => {
      const startMinutes = clockToMinutes(task.time);
      const visualMinutes = Math.max(30, task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES);
      const endMinutes = Math.min(24 * 60, startMinutes + visualMinutes);
      return {
        ...task,
        startMinutes,
        endMinutes,
        start: task.time,
        end: minutesToClock(endMinutes),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const importantTasks = dayTasks.filter((task) => !task.completed && (task.priority === 'urgent' || task.priority === 'high'));
  const importantIds = new Set(importantTasks.map((task) => task.id));
  const untimedTasks = dayTasks
    .filter((task) => !task.time && !importantIds.has(task.id))
    .sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  const preciseBoundaries = getNonHourlyBoundaries(dayEvents);
  const scheduleConflict = findScheduleConflict(dayEvents.filter((event) => !event.completed && !event.cancelled));
  const timelineRange = getCompactTimelineRange(dayEvents, expandedTimeline);
  const startMinutes = timelineRange?.startMinutes ?? 0;
  const endMinutes = timelineRange?.endMinutes ?? 0;
  const totalHeight = (endMinutes - startMinutes) * PX_PER_MIN;
  const gridLineCount = timelineRange ? Math.floor((endMinutes - startMinutes) / 30) + 1 : 0;
  const firstHour = Math.ceil(startMinutes / 60);
  const lastHour = Math.floor(endMinutes / 60);
  const hourCount = timelineRange ? Math.max(0, lastHour - firstHour + 1) : 0;
  const timeToY = (minutes: number) => (minutes - startMinutes) * PX_PER_MIN;
  const freeWindow = findBoundedFreeWindow(dayEvents, selectedDate.getDay());
  const scheduleWindowMinutes = 14 * 60;
  const occupiedMinutes = getOccupiedMinutes(dayEvents, 8 * 60, 22 * 60);
  const freeMinutes = Math.max(0, scheduleWindowMinutes - occupiedMinutes);
  const loadPercent = Math.min(100, Math.round((occupiedMinutes / scheduleWindowMinutes) * 100));
  const completed = dayTasks.filter((task) => task.completed).length;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} хв`;
    return `${hours} год${rest ? ` ${rest} хв` : ''}`;
  };

  return (
    <View style={styles.dayView}>
      <View style={styles.importantCard}>
        <View style={styles.importantHeader}>
          <View style={styles.importantIcon}><FlagIcon size={16} color={palette.accent} filled /></View>
          <View style={styles.importantHeading}>
            <Text style={styles.importantLabel}>Важливі задачі</Text>
            <Text style={styles.importantHint}>Високий і терміновий пріоритет</Text>
          </View>
          <Text style={styles.importantCount}>{importantTasks.length}</Text>
        </View>
        {importantTasks.length === 0 ? <Text style={styles.importantEmpty}>На цей день немає важливих задач</Text> : null}
        {importantTasks.map((task) => (
          <View key={task.id} style={styles.importantRow}>
            <View style={[styles.importantBar, { backgroundColor: priorityColor(task.priority) }]} />
            <Pressable onPress={() => s.toggleComplete(task.id)} style={[styles.allDayCheckbox, task.completed ? { backgroundColor: palette.accent } : { borderWidth: 1.5, borderColor: palette.border }]}>
              {task.completed ? <Text style={{ color: palette.text, fontSize: 10 }}>✓</Text> : null}
            </Pressable>
            <Pressable onPress={() => s.openTaskDetail(task.id)} style={styles.importantBody}>
              <Text numberOfLines={1} style={styles.importantTitle}>{task.title}</Text>
              <Text style={styles.importantMeta}>{task.time || 'Без часу'} · {task.priority === 'urgent' ? 'Терміново' : 'Високий пріоритет'}</Text>
            </Pressable>
            <CategoryTag name={task.category} color={catColor(task.category)} fontSize={10} />
          </View>
        ))}
      </View>

      {untimedTasks.length > 0 ? (
        <View style={styles.untimedCard}>
          <View style={styles.untimedHeader}>
            <View>
              <Text style={styles.untimedLabel}>Без конкретного часу</Text>
              <Text style={styles.untimedHint}>Задачі на вибраний день без години початку</Text>
            </View>
            <Text style={styles.untimedCount}>{untimedTasks.length}</Text>
          </View>
          {untimedTasks.map((task) => (
            <View key={task.id} style={styles.untimedRow}>
              <Pressable
                onPress={() => s.toggleComplete(task.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                style={[styles.allDayCheckbox, task.completed ? { backgroundColor: palette.accent } : { borderWidth: 1.5, borderColor: palette.border }]}
              >
                {task.completed ? <Text style={{ color: palette.text, fontSize: 10 }}>✓</Text> : null}
              </Pressable>
              <Pressable onPress={() => s.openTaskDetail(task.id)} style={styles.importantBody}>
                <Text numberOfLines={1} style={[styles.importantTitle, task.completed && styles.untimedTitleDone]}>{task.title}</Text>
              </Pressable>
              <CategoryTag name={task.category} color={catColor(task.category)} fontSize={10} />
            </View>
          ))}
        </View>
      ) : null}

      {scheduleConflict ? (
        <View accessible accessibilityRole="alert" style={styles.conflictCard}>
          <View style={styles.conflictIcon}><ClockIcon size={16} color={palette.accent} /></View>
          <View style={styles.conflictBody}>
            <Text style={styles.conflictTitle}>Конфлікт часу</Text>
            <Text style={styles.conflictText}>
              {scheduleConflict.itemIndexes.length} {pluralTasks(scheduleConflict.itemIndexes.length)} перетинаються о {minutesToClock(scheduleConflict.startMinutes)}–{minutesToClock(scheduleConflict.endMinutes)}. Змініть час однієї з них.
            </Text>
          </View>
        </View>
      ) : null}

      {expandedTimeline ? (
        <Pressable onPress={() => setExpandedTimeline(false)} style={styles.collapseTimelineButton}>
          <Text style={styles.collapseTimelineText}>Згорнути порожній час</Text>
        </Pressable>
      ) : null}

      {timelineRange && startMinutes > 0 ? (
        <Pressable onPress={() => setExpandedTimeline(true)} style={styles.foldedTime}>
          <Text style={styles.foldedTimeRange}>00:00–{minutesToClock(startMinutes)} · Вільно {formatDuration(startMinutes)}</Text>
          <Text style={styles.foldedTimeLabel}>Розгорнути</Text>
        </Pressable>
      ) : null}

      {!timelineRange ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.emptyTimelineTitle}>Немає задач із зазначеним часом</Text>
          <Text style={styles.emptyTimelineText}>Порожня добова шкала прихована, щоб не створювати зайвий скрол.</Text>
          <Pressable onPress={() => setExpandedTimeline(true)} style={styles.emptyTimelineButton}><Text style={styles.emptyTimelineButtonText}>Показати всю добу</Text></Pressable>
        </View>
      ) : (
        <View style={[styles.timeline, { height: totalHeight + 30 }]}>
          {Array.from({ length: gridLineCount }, (_, index) => (
            <View
              key={`grid-${index}`}
              style={[
                styles.gridLine,
                { top: index * 30 * PX_PER_MIN, backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)' },
              ]}
            />
          ))}
          {Array.from({ length: hourCount }, (_, index) => firstHour + index).map((hour) => (
            <Text key={`hour-${hour}`} style={[styles.hourMark, { top: timeToY(hour * 60) - 7 }]}>
              {hour === 24 ? '00:00' : `${String(hour).padStart(2, '0')}:00`}
            </Text>
          ))}

          {preciseBoundaries.map((minutes) => {
            const top = timeToY(minutes);
            return (
              <React.Fragment key={`marker-${minutes}`}>
                <View style={[styles.preciseLine, { top }]} />
                <View style={[styles.preciseDot, { top: top - 3 }]} />
                <Text style={[styles.preciseLabel, { top: top - 7 }]}>{minutesToClock(minutes)}</Text>
              </React.Fragment>
            );
          })}

          {freeWindow ? (
            <Pressable
              onPress={() => s.scheduleFreeWindow(isoFromOffset(offset), minutesToClock(freeWindow.startMinutes), '2 год')}
              style={[styles.freeWindow, { top: timeToY(freeWindow.startMinutes), height: (freeWindow.endMinutes - freeWindow.startMinutes) * PX_PER_MIN }]}
            >
              <Text style={styles.freeWindowTitle}>{minutesToClock(freeWindow.startMinutes)} – {minutesToClock(freeWindow.endMinutes)}</Text>
              <Text style={styles.freeWindowSub}>Вільне вікно · 2 години</Text>
              <Text style={styles.freeWindowAction}>+ Запланувати</Text>
            </Pressable>
          ) : null}

          {dayEvents.map((event) => {
            const top = timeToY(event.startMinutes);
            const minutes = event.endMinutes - event.startMinutes;
            const height = Math.max(30, minutes * PX_PER_MIN);
            const compact = minutes < 60;
            const color = catColor(event.category);
            const flag = event.priority === 'urgent' || event.priority === 'high';
            return (
              <Pressable
                key={event.id}
                onPress={() => s.openTaskDetail(event.id)}
                style={[styles.eventCard, { top, height, borderLeftColor: color, paddingVertical: compact ? 6 : 9, paddingHorizontal: 12 }]}
              >
                <Text style={styles.eventTime}>{event.start} – {event.end}</Text>
                <Text style={[styles.eventTitle, event.completed && styles.eventTitleDone]} numberOfLines={compact ? 1 : 2}>{event.title}</Text>
                {!compact ? <View style={styles.eventCategory}><CategoryTag name={event.category} color={color} /></View> : null}
                {flag ? <View style={styles.eventFlag}><FlagIcon size={14} color={palette.accent} filled={false} /></View> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {timelineRange && endMinutes < 24 * 60 ? (
        <Pressable onPress={() => setExpandedTimeline(true)} style={styles.foldedTime}>
          <Text style={styles.foldedTimeRange}>{minutesToClock(endMinutes)}–00:00 · Вільно {formatDuration(24 * 60 - endMinutes)}</Text>
          <Text style={styles.foldedTimeLabel}>Розгорнути</Text>
        </Pressable>
      ) : null}

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{offset === 0 ? 'Сьогодні' : `${selectedDate.getDate()} ${monthsGen[selectedDate.getMonth()]}`}</Text>
        <View style={styles.statsRow}>
          {[
            ['Зайнято', formatDuration(occupiedMinutes)],
            ['Вільно 8–22', formatDuration(freeMinutes)],
            ['Задач', String(dayTasks.length)],
            ['Виконано', String(completed)],
          ].map(([label, value]) => (
            <View key={label} style={styles.statsItem}>
              <Text style={styles.statsKey}>{label}</Text>
              <Text style={styles.statsVal}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.statsProgressRow}>
          <View style={styles.statsTrack}><View style={{ width: `${loadPercent}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
          <Text style={styles.statsPercent}>{loadPercent}% зайнято</Text>
        </View>
      </View>
    </View>
  );
}

function WeekView({ monday, offsetOf }: { monday: Date; offsetOf: (d: Date) => number }) {
  const s = useV5();
  const rows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const off = offsetOf(d);
    const dayTasks = s.tasks.filter((task) => isTaskOnCalendarDay(task, off) && isTaskInListSection(task, 'active'));
    const busy = dayTasks.reduce((sum, task) => sum + (task.time ? (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : 0), 0);
    const durationLabel = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} год${minutes % 60 ? ` ${minutes % 60} хв` : ''}` : `${minutes} хв`;
    const busyLabel = durationLabel(busy);
    const freeLabel = durationLabel(Math.max(0, 480 - busy));
    const isSelected = off === s.calendarDayOffset;
    const isToday = off === 0;
    const loadPct = Math.min(100, Math.round((busy / 480) * 100));
    return { i, num: d.getDate(), label: weekShort[i], off, dayTasks, busyLabel, freeLabel, isSelected, isToday, loadPct };
  });
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <Pressable key={r.i} onPress={() => { s.setCalendarDay(r.off); s.setCalendarView('day'); }} style={[styles.weekRow, r.isSelected && styles.weekRowSelected]}>
          <View style={styles.weekDate}>
            <Text style={[styles.weekDateText, r.isToday && styles.weekDateToday]}>{r.label} {r.num}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekSummary}>{r.dayTasks.length} {pluralTasks(r.dayTasks.length)} · {r.busyLabel}</Text>
            <View style={styles.weekLoadTrack}><View style={{ width: `${r.loadPct}%`, height: '100%', backgroundColor: r.loadPct === 0 ? 'transparent' : palette.accent, borderRadius: 3 }} /></View>
            <View style={styles.weekLoadLabels}><Text style={styles.weekLoadText}>Зайнято {r.loadPct}%</Text><Text style={styles.weekLoadText}>Вільно {r.freeLabel}</Text></View>
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
    const dayTasks = s.tasks.filter((task) => isTaskOnCalendarDay(task, off) && isTaskInListSection(task, 'active'));
    const busy = dayTasks.reduce((sum, task) => sum + (task.time ? (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : 0), 0);
    const dotCount = dayTasks.length === 0 ? 0 : busy > 300 || dayTasks.length >= 6 ? 3 : busy > 120 || dayTasks.length >= 3 ? 2 : 1;
    return { i, num: d.getDate(), off, inMonth, isToday, isSelected, dayTasks, dotCount };
  });
  const selOffset = s.calendarDayOffset;
  const selDate = new Date(today); selDate.setDate(today.getDate() + selOffset);
  const labelBase = selOffset === 0 ? 'Сьогодні' : `${selDate.getDate()} ${monthsGen[selDate.getMonth()]}`;
  const selTasks = s.tasks.filter((task) => isTaskOnCalendarDay(task, selOffset) && isTaskInListSection(task, 'active'));

  return (
    <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.monthTitle}>{selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}</Text>
        <View style={styles.monthWeekRow}>{weekShort.map((l) => <Text key={l} style={styles.monthWeekLabel}>{l}</Text>)}</View>
        <View style={styles.monthGrid}>
          {cells.map((c) => (
          <Pressable key={c.i} onPress={() => s.setCalendarDay(c.off)} style={[styles.monthCell, { opacity: c.inMonth ? 1 : 0.32 }]}>
            <View style={[styles.monthNum, c.isSelected && styles.monthNumSelected, { borderWidth: c.isToday || c.isSelected ? 1 : 0, borderColor: palette.accent }]}>
              <Text style={{ fontSize: 13, fontWeight: c.isToday ? '700' : '500', color: c.isSelected ? palette.text : palette.textSecondary }}>{c.num}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
              {Array.from({ length: c.dotCount }, (_, index) => <View key={index} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.isSelected ? (s.categories[c.dayTasks[index % c.dayTasks.length]?.category] || palette.accent) : withAlpha(palette.accent, 0.68) }} />)}
            </View>
          </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.monthStickyHeader}><Text style={styles.monthSelLabel}>Задачі · {labelBase}</Text></View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, paddingHorizontal: 20 },
  navPair: { height: 34, flexDirection: 'row', alignItems: 'center', borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  navArrow: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { color: palette.textSecondary, fontSize: 20, lineHeight: 22 },
  navDivider: { width: 1, height: 18, backgroundColor: palette.border },
  headerBtns: { flexDirection: 'row', gap: 6 },
  todayBtn: { width: 64, height: 34, borderRadius: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { color: palette.textSecondary, fontSize: 11.5 },
  viewTabs: { marginBottom: 14 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDay: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, width: 44, minHeight: 44 },
  weekDayLabel: { fontSize: 11.5 },
  weekDayNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekDayNumSelected: { backgroundColor: withAlpha(palette.accent, 0.12), borderWidth: 1, borderColor: palette.accent },
  weekDayNumToday: { backgroundColor: palette.chip },
  weekDayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 150 },
  dayView: { flexGrow: 1 },
  importantCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13, marginBottom: 12 },
  importantHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  importantIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.1), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.22) },
  importantHeading: { flex: 1, minWidth: 0 },
  importantLabel: { fontSize: 13, fontWeight: '700', color: palette.text },
  importantHint: { fontSize: 10.5, lineHeight: 14, color: palette.textFaint, marginTop: 1 },
  importantCount: { minWidth: 26, height: 26, borderRadius: 9, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', paddingTop: 4, color: palette.accent, fontSize: 12, fontWeight: '700', backgroundColor: withAlpha(palette.accent, 0.1) },
  importantEmpty: { fontSize: 12, color: palette.textFaint, paddingTop: 10, paddingBottom: 3 },
  importantRow: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingTop: 9, paddingLeft: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  untimedCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13, marginBottom: 12 },
  untimedHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  untimedLabel: { color: palette.text, fontSize: 13.5, fontWeight: '700' },
  untimedHint: { color: palette.textFaint, fontSize: 10.5, marginTop: 2 },
  untimedCount: { minWidth: 26, height: 26, borderRadius: 8, color: palette.textSecondary, backgroundColor: palette.chip, textAlign: 'center', textAlignVertical: 'center', fontSize: 12, fontWeight: '700' },
  untimedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  untimedTitleDone: { color: palette.textFaint, textDecorationLine: 'line-through' },
  importantBar: { position: 'absolute', left: 0, top: 11, bottom: 2, width: 3, borderRadius: 2 },
  importantBody: { flex: 1, minWidth: 0 },
  importantTitle: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: palette.text },
  importantMeta: { fontSize: 10.5, lineHeight: 14, color: palette.textFaint, marginTop: 2 },
  allDayCheckbox: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  conflictCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 13, backgroundColor: withAlpha(palette.accent, 0.07), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.25) },
  conflictIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.1) },
  conflictBody: { flex: 1, minWidth: 0 },
  conflictTitle: { color: palette.accentPaleText, fontSize: 12.5, fontWeight: '700' },
  conflictText: { color: palette.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  collapseTimelineButton: { alignSelf: 'center', minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, marginBottom: 10, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  collapseTimelineText: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  foldedTime: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.borderFaint, borderStyle: 'dashed' },
  foldedTimeRange: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  foldedTimeLabel: { color: palette.accent, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  emptyTimeline: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, marginVertical: 8 },
  emptyTimelineTitle: { color: palette.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptyTimelineText: { color: palette.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  emptyTimelineButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 14, borderRadius: 12, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.chipBorder },
  emptyTimelineButtonText: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  timeline: { position: 'relative' },
  gridLine: { position: 'absolute', left: 44, right: 0, height: 1 },
  hourMark: { position: 'absolute', left: 0, fontSize: 12, color: palette.textFaint, backgroundColor: palette.bg, paddingRight: 6 },
  preciseLine: { position: 'absolute', left: 44, right: 0, height: 1, backgroundColor: palette.accent, opacity: 0.75 },
  preciseDot: { position: 'absolute', left: 40, width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent, opacity: 0.9 },
  preciseLabel: { position: 'absolute', left: 0, fontSize: 10.5, fontWeight: '600', color: palette.accent },
  eventCard: { position: 'absolute', left: 62, right: 0, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, borderLeftWidth: 3, overflow: 'hidden' },
  eventTime: { fontSize: 11, color: palette.textFaint },
  eventTitle: { fontSize: 14, color: palette.text, fontWeight: '600', marginTop: 3, paddingRight: 72 },
  eventTitleDone: { color: palette.textFaint, textDecorationLine: 'line-through' },
  eventCategory: { position: 'absolute', top: 9, right: 32 },
  eventFlag: { position: 'absolute', top: 11, right: 10 },
  freeWindow: { position: 'absolute', left: 62, right: 0, borderRadius: 12, borderWidth: 1.5, borderColor: palette.chipBorder, borderStyle: 'dashed', paddingHorizontal: 14, justifyContent: 'center', backgroundColor: withAlpha(palette.bg, 0.84) },
  freeWindowTitle: { fontSize: 13.5, color: palette.text, fontWeight: '600' },
  freeWindowSub: { fontSize: 11.5, color: palette.textMuted, marginTop: 2 },
  freeWindowAction: { marginTop: 8, color: palette.accent, fontSize: 12, fontWeight: '600' },
  statsCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 16, marginTop: 18 },
  statsTitle: { fontSize: 13, fontWeight: '600', color: palette.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  statsItem: { flex: 1, minWidth: 0 },
  statsKey: { fontSize: 11, color: palette.textMuted },
  statsVal: { fontSize: 13.5, color: palette.text, fontWeight: '600', marginTop: 3 },
  statsProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statsPercent: { fontSize: 12.5, color: palette.textMuted },
  statsTrack: { flex: 1, height: 6, backgroundColor: palette.chip, borderRadius: 3, overflow: 'hidden' },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border },
  weekRowSelected: { backgroundColor: withAlpha(palette.accent, 0.08), borderColor: withAlpha(palette.accent, 0.72) },
  weekDate: { width: 48, alignSelf: 'flex-start', paddingTop: 1 },
  weekDateText: { color: palette.textSecondary, fontSize: 13, fontWeight: '700' },
  weekDateToday: { color: palette.accent },
  weekSummary: { color: palette.text, fontSize: 12.5, fontWeight: '600', marginBottom: 8 },
  weekLoadTrack: { height: 6, backgroundColor: palette.chip, borderRadius: 3, overflow: 'hidden' },
  weekLoadLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  weekLoadText: { color: palette.textFaint, fontSize: 10.5 },
  monthTitle: { color: palette.text, fontSize: 17, fontWeight: '700', textTransform: 'capitalize', marginBottom: 12 },
  monthWeekRow: { flexDirection: 'row', marginBottom: 6 },
  monthWeekLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: palette.textFaint, paddingVertical: 4 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  monthCell: { width: `${100 / 7}%`, alignItems: 'center', gap: 3, paddingVertical: 6, minHeight: 44 },
  monthNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  monthNumSelected: { backgroundColor: withAlpha(palette.accent, 0.14) },
  monthStickyHeader: { minHeight: 42, justifyContent: 'center', backgroundColor: palette.bg },
  monthSelLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  monthEmpty: { fontSize: 13, color: palette.textFaint, paddingVertical: 16, textAlign: 'center' },
  monthTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14 },
});
