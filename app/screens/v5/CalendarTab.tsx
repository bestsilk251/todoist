/** Calendar tab: day timeline (2px/min, now-line, free-window), week load
 * summary and month grid — ported from the v5 mock. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { palette, priorityColor, withAlpha } from '../../theme';
import { compareTasksChronologically, formatTaskDateFromOffset, weekShort, monthsGen, dayPhrase, pluralTasks } from '../../lib/v5data';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { CategoryTag, ScreenHeader, SegmentedControl } from './ui';
import { CalendarIcon, ClockIcon, FlagIcon, ChevronRightIcon } from '../../components/icons';
import { DEFAULT_TIMED_TASK_DURATION_MINUTES, findScheduleConflict, findWorkingHoursFreeWindows, getCompactTimelineRange, getConflictingItemIndexes, getNonHourlyBoundaries, getOccupiedMinutes, clockToMinutes, minutesToClock, snapTaskStartMinutes } from '../../lib/calendarMath';
import { isoFromOffset } from '../../lib/tasksRepo';
import { isTaskInListSection, isTaskOnCalendarDay } from '../../lib/taskSelectors';

const PX_PER_MIN = 2;

type DayCalendarEvent = V5Task & {
  startMinutes: number;
  endMinutes: number;
  start: string;
  end: string;
};

export default function CalendarTab() {
  const s = useV5();
  const scrollRef = useRef<ScrollView>(null);
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
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {s.calendarView === 'day' ? (
            <DayView
              offset={offset}
              selectedDate={selectedDate}
              onScrollToTask={(y) => scrollRef.current?.scrollTo({ y, animated: true })}
            />
          ) : null}
          {s.calendarView === 'week' ? <WeekView monday={monday} offsetOf={offsetOf} /> : null}
        </ScrollView>
      )}
    </View>
  );

}

function DayView({ offset, selectedDate, onScrollToTask }: { offset: number; selectedDate: Date; onScrollToTask: (y: number) => void }) {
  const s = useV5();
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  const [timelineY, setTimelineY] = useState(0);
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
  const scheduledDayEvents = dayEvents.filter((event) => !event.cancelled);
  const importantTasks = dayTasks.filter((task) => !task.completed && !task.cancelled && (task.priority === 'urgent' || task.priority === 'high'));
  const importantIds = new Set(importantTasks.map((task) => task.id));
  const untimedTasks = dayTasks
    .filter((task) => !task.time && !importantIds.has(task.id))
    .sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  const preciseBoundaries = getNonHourlyBoundaries(dayEvents);
  const activeDayEvents = dayEvents.filter((event) => !event.completed && !event.cancelled);
  const scheduleConflict = findScheduleConflict(activeDayEvents);
  const allConflictIndexes = getConflictingItemIndexes(activeDayEvents);
  const conflictTaskIds = scheduleConflict
    ? allConflictIndexes.flatMap((index) => activeDayEvents[index]?.id ? [activeDayEvents[index].id] : [])
    : [];
  const hasAdditionalConflicts = scheduleConflict != null && allConflictIndexes.length > scheduleConflict.itemIndexes.length;
  const timelineRange = getCompactTimelineRange(dayEvents, expandedTimeline);
  const startMinutes = timelineRange?.startMinutes ?? 0;
  const endMinutes = timelineRange?.endMinutes ?? 0;
  const totalHeight = (endMinutes - startMinutes) * PX_PER_MIN;
  const gridLineCount = timelineRange ? Math.floor((endMinutes - startMinutes) / 30) + 1 : 0;
  const firstHour = Math.ceil(startMinutes / 60);
  const lastHour = Math.floor(endMinutes / 60);
  const hourCount = timelineRange ? Math.max(0, lastHour - firstHour + 1) : 0;
  const timeToY = (minutes: number) => (minutes - startMinutes) * PX_PER_MIN;
  const rawFreeWindows = s.freeWindowsEnabled && offset >= 0
    ? findWorkingHoursFreeWindows(scheduledDayEvents, selectedDate.getDay())
    : [];
  const now = new Date();
  const earliestTodayMinute = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
  const freeWindows = rawFreeWindows
    .map((window) => offset === 0 ? { ...window, startMinutes: Math.max(window.startMinutes, earliestTodayMinute) } : window)
    .filter((window) => window.endMinutes - window.startMinutes >= 30);
  const scheduleWindowMinutes = 14 * 60;
  const occupiedMinutes = getOccupiedMinutes(scheduledDayEvents, 8 * 60, 22 * 60);
  const freeMinutes = Math.max(0, scheduleWindowMinutes - occupiedMinutes);
  const loadPercent = Math.min(100, Math.round((occupiedMinutes / scheduleWindowMinutes) * 100));
  const completed = dayTasks.filter((task) => task.completed).length;

  useEffect(() => {
    const focused = s.calendarFocusTaskId
      ? dayEvents.find((event) => event.id === s.calendarFocusTaskId)
      : null;
    if (!focused || !timelineRange || timelineY <= 0) return undefined;
    const timer = setTimeout(() => {
      const eventY = (focused.startMinutes - startMinutes) * PX_PER_MIN;
      onScrollToTask(Math.max(0, timelineY + eventY - 90));
    }, 220);
    return () => clearTimeout(timer);
  }, [s.calendarFocusTaskId, offset, startMinutes, timelineRange?.endMinutes, timelineY]);

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
          <View key={task.id} style={[styles.importantRow, s.calendarFocusTaskId === task.id && styles.taskRowFocused]}>
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
            <View key={task.id} style={[styles.untimedRow, s.calendarFocusTaskId === task.id && styles.taskRowFocused]}>
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
        <Pressable
          onPress={() => s.openConflictTasks(
            conflictTaskIds,
            hasAdditionalConflicts ? null : scheduleConflict.startMinutes,
            hasAdditionalConflicts ? null : scheduleConflict.endMinutes,
          )}
          accessibilityRole="button"
          accessibilityLabel={`Конфлікт часу: ${conflictTaskIds.length} задачі перетинаються`}
          accessibilityHint="Відкриває список задач і дії для усунення конфлікту"
          style={({ pressed }) => [styles.conflictCard, pressed && styles.conflictCardPressed]}
        >
          <View style={styles.conflictIcon}><ClockIcon size={16} color={palette.accent} /></View>
          <View style={styles.conflictBody}>
            <Text style={styles.conflictTitle}>Конфлікт часу</Text>
            <Text style={styles.conflictText}>
              {hasAdditionalConflicts
                ? `Протягом дня ${conflictTaskIds.length} ${pluralTasks(conflictTaskIds.length)} мають накладання в розкладі.`
                : `${conflictTaskIds.length} ${pluralTasks(conflictTaskIds.length)} перетинаються о ${minutesToClock(scheduleConflict.startMinutes)}–${minutesToClock(scheduleConflict.endMinutes)}.`}
            </Text>
            <Text style={styles.conflictAction}>Переглянути задачі</Text>
          </View>
          <ChevronRightIcon size={15} color={palette.accent} />
        </Pressable>
      ) : null}

      {freeWindows.length > 0 ? (
        <View style={styles.freeWindowsPanel}>
          <View style={styles.freeWindowsHeader}>
            <View style={styles.freeWindowsHeading}>
              <ClockIcon size={15} color={palette.badgeGreen} />
              <Text style={styles.freeWindowsTitle}>Вільні вікна · 09:00–19:00</Text>
            </View>
            <Text style={styles.freeWindowsCount}>{freeWindows.length}</Text>
          </View>
          {freeWindows.map((window) => {
            const duration = window.endMinutes - window.startMinutes;
            return (
              <Pressable
                key={`${window.startMinutes}-${window.endMinutes}`}
                onPress={() => s.scheduleFreeWindow(isoFromOffset(offset), minutesToClock(window.startMinutes), formatDuration(duration))}
                style={styles.freeWindowRow}
              >
                <View style={styles.freeWindowTimeBlock}>
                  <Text style={styles.freeWindowTime}>{minutesToClock(window.startMinutes)}–{minutesToClock(window.endMinutes)}</Text>
                  <Text style={styles.freeWindowDuration}>Вільно {formatDuration(duration)}</Text>
                </View>
                <Text style={styles.freeWindowPlan}>+ Запланувати</Text>
              </Pressable>
            );
          })}
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

      {timelineRange && activeDayEvents.length > 0 ? (
        <View style={styles.dragGuide}>
          <ClockIcon size={13} color={palette.textFaint} />
          <Text style={styles.dragGuideText}>Затисніть задачу та перетягніть · крок 15 хв</Text>
        </View>
      ) : null}

      {!timelineRange ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.emptyTimelineTitle}>Немає задач із зазначеним часом</Text>
          <Text style={styles.emptyTimelineText}>Порожня добова шкала прихована, щоб не створювати зайвий скрол.</Text>
          <Pressable onPress={() => setExpandedTimeline(true)} style={styles.emptyTimelineButton}><Text style={styles.emptyTimelineButtonText}>Показати всю добу</Text></Pressable>
        </View>
      ) : (
        <View onLayout={(event) => setTimelineY(event.nativeEvent.layout.y)} style={[styles.timeline, { height: totalHeight + 30 }]}>
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

          {dayEvents.map((event) => (
            <DraggableCalendarEvent
              key={event.id}
              event={event}
              color={catColor(event.category)}
              timelineStartMinutes={startMinutes}
              timelineEndMinutes={endMinutes}
              timeToY={timeToY}
              focused={s.calendarFocusTaskId === event.id}
            />
          ))}
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

interface DraggableCalendarEventProps {
  event: DayCalendarEvent;
  color: string;
  timelineStartMinutes: number;
  timelineEndMinutes: number;
  timeToY: (minutes: number) => number;
  focused: boolean;
}

function DraggableCalendarEvent({
  event,
  color,
  timelineStartMinutes,
  timelineEndMinutes,
  timeToY,
  focused,
}: DraggableCalendarEventProps) {
  const s = useV5();
  const durationMinutes = Math.max(30, event.endMinutes - event.startMinutes);
  const draggable = !event.completed && !event.cancelled;
  const translateY = useRef(new Animated.Value(0)).current;
  const dragSurfaceRef = useRef<View>(null);
  const longPressReady = useRef(false);
  const gestureActive = useRef(false);
  const suppressPress = useRef(false);
  const previewStartRef = useRef(event.startMinutes);
  const eventRef = useRef(event);
  const rangeRef = useRef({ timelineStartMinutes, timelineEndMinutes, durationMinutes });
  const [dragging, setDragging] = useState(false);
  const [previewStart, setPreviewStart] = useState(event.startMinutes);

  eventRef.current = event;
  rangeRef.current = { timelineStartMinutes, timelineEndMinutes, durationMinutes };

  useEffect(() => {
    if (gestureActive.current) return;
    previewStartRef.current = event.startMinutes;
    setPreviewStart(event.startMinutes);
    translateY.setValue(0);
  }, [event.startMinutes, translateY]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const node = dragSurfaceRef.current as unknown as HTMLElement | null;
    if (!node) return undefined;
    const preventContextMenu = (contextEvent: Event) => contextEvent.preventDefault();
    node.style.setProperty('touch-action', 'none');
    node.style.setProperty('-webkit-user-select', 'none');
    node.style.setProperty('-webkit-touch-callout', 'none');
    node.addEventListener('contextmenu', preventContextMenu);
    return () => node.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  const finishDrag = (save: boolean) => {
    const currentEvent = eventRef.current;
    const nextStart = previewStartRef.current;
    if (save && nextStart !== currentEvent.startMinutes) {
      s.updateTask(currentEvent.id, { time: minutesToClock(nextStart) });
    }
    gestureActive.current = false;
    longPressReady.current = false;
    setDragging(false);
    translateY.setValue(0);
    if (!save || nextStart === currentEvent.startMinutes) {
      previewStartRef.current = currentEvent.startMinutes;
      setPreviewStart(currentEvent.startMinutes);
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => (
      longPressReady.current && Math.abs(gesture.dy) > 1
    ),
    onMoveShouldSetPanResponderCapture: (_event, gesture) => (
      longPressReady.current && Math.abs(gesture.dy) > 1
    ),
    onPanResponderGrant: () => {
      gestureActive.current = true;
      suppressPress.current = true;
      setDragging(true);
    },
    onPanResponderMove: (_event, gesture) => {
      const currentEvent = eventRef.current;
      const range = rangeRef.current;
      const rawStart = currentEvent.startMinutes + gesture.dy / PX_PER_MIN;
      let snappedStart = snapTaskStartMinutes(rawStart, range.durationMinutes, 15);
      const visibleMin = Math.ceil(range.timelineStartMinutes / 15) * 15;
      const visibleMax = Math.floor((range.timelineEndMinutes - range.durationMinutes) / 15) * 15;
      if (visibleMax >= visibleMin) {
        snappedStart = Math.max(visibleMin, Math.min(visibleMax, snappedStart));
      }
      previewStartRef.current = snappedStart;
      setPreviewStart(snappedStart);
      translateY.setValue((snappedStart - currentEvent.startMinutes) * PX_PER_MIN);
    },
    onPanResponderRelease: () => finishDrag(true),
    onPanResponderTerminate: () => finishDrag(false),
    onPanResponderTerminationRequest: () => false,
  })).current;

  const previewEnd = Math.min(24 * 60, previewStart + durationMinutes);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.eventCard,
        {
          top: timeToY(event.startMinutes),
          height: durationMinutes * PX_PER_MIN,
          borderLeftColor: color,
          transform: [{ translateY }, { scale: dragging ? 1.015 : 1 }],
        },
        dragging && styles.eventCardDragging,
        focused && styles.eventCardFocused,
      ]}
    >
      <Pressable
        ref={dragSurfaceRef}
        delayLongPress={320}
        onPressIn={() => {
          suppressPress.current = false;
          longPressReady.current = false;
        }}
        onLongPress={() => {
          if (!draggable) return;
          longPressReady.current = true;
          suppressPress.current = true;
          setDragging(true);
          try { Vibration.vibrate(20); } catch { /* no-op on web */ }
        }}
        onPressOut={() => {
          if (gestureActive.current) return;
          const wasArmed = longPressReady.current;
          longPressReady.current = false;
          if (wasArmed) {
            setDragging(false);
            translateY.setValue(0);
            previewStartRef.current = eventRef.current.startMinutes;
            setPreviewStart(eventRef.current.startMinutes);
          }
        }}
        onPress={() => {
          if (!suppressPress.current) s.openTaskDetail(event.id);
          suppressPress.current = false;
        }}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, ${minutesToClock(previewStart)}–${minutesToClock(previewEnd)}`}
        accessibilityHint={draggable
          ? 'Натисніть, щоб відкрити. Затисніть і перетягніть, щоб змінити час із кроком 15 хвилин.'
          : 'Натисніть, щоб відкрити задачу.'}
        accessibilityActions={draggable ? [{ name: 'increment', label: 'Перенести на 15 хвилин пізніше' }, { name: 'decrement', label: 'Перенести на 15 хвилин раніше' }] : undefined}
        onAccessibilityAction={draggable ? (actionEvent) => {
          const direction = actionEvent.nativeEvent.actionName === 'increment' ? 15 : -15;
          const nextStart = snapTaskStartMinutes(event.startMinutes + direction, durationMinutes, 15);
          if (nextStart !== event.startMinutes) s.updateTask(event.id, { time: minutesToClock(nextStart) });
        } : undefined}
        style={styles.eventPressable}
      >
        <Text selectable={false} style={[styles.eventTime, dragging && styles.eventTimeDragging]}>
          {minutesToClock(previewStart)}–{minutesToClock(previewEnd)}
          {dragging ? ' · крок 15 хв' : ''}
        </Text>
        <Text selectable={false} numberOfLines={2} style={[styles.eventTitle, event.completed && styles.eventTitleDone]}>{event.title}</Text>
        <View style={styles.eventCategory}><CategoryTag name={event.category} color={color} fontSize={9.5} /></View>
        {(event.priority === 'urgent' || event.priority === 'high') ? (
          <View style={styles.eventFlag}><FlagIcon size={13} color={priorityColor(event.priority)} filled /></View>
        ) : null}
        {draggable ? <Text selectable={false} style={[styles.eventDragGrip, dragging && styles.eventDragGripActive]}>⠿</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

function WeekView({ monday, offsetOf }: { monday: Date; offsetOf: (d: Date) => number }) {
  const s = useV5();
  const rows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const off = offsetOf(d);
    const dayTasks = s.tasks.filter((task) => isTaskOnCalendarDay(task, off));
    const busy = dayTasks.reduce((sum, task) => sum + (task.time ? (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES) : 0), 0);
    const durationLabel = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} год${minutes % 60 ? ` ${minutes % 60} хв` : ''}` : `${minutes} хв`;
    const busyLabel = durationLabel(busy);
    const freeLabel = durationLabel(Math.max(0, 480 - busy));
    const isSelected = off === s.calendarDayOffset;
    const isToday = off === 0;
    const availabilityLabel = off < 0 ? 'День завершено' : `Вільно ${freeLabel}`;
    const loadPct = Math.min(100, Math.round((busy / 480) * 100));
    return { i, num: d.getDate(), label: weekShort[i], off, dayTasks, busyLabel, availabilityLabel, isSelected, isToday, loadPct };
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
            <View style={styles.weekLoadLabels}><Text style={styles.weekLoadText}>Зайнято {r.loadPct}%</Text><Text style={styles.weekLoadText}>{r.availabilityLabel}</Text></View>
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
  const selTasks = s.tasks
    .filter((task) => isTaskOnCalendarDay(task, selOffset))
    .sort(compareTasksChronologically);

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
        ) : selTasks.map((t) => {
          const pastDateLabel = t.dueInDays != null && t.dueInDays < 0
            ? formatTaskDateFromOffset(t.dueInDays)
            : null;
          const whenLabel = t.time
            ? `${pastDateLabel ?? dayPhrase(t.dueInDays!)}, ${t.time}`
            : (pastDateLabel ?? dayPhrase(t.dueInDays!));
          return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`Відкрити задачу ${t.title}`}
            onPress={() => s.openTaskDetail(t.id)}
            style={[styles.monthTaskRow, t.completed && styles.monthTaskRowCompleted]}
          >
            <View style={[styles.monthTaskBar, { backgroundColor: t.overdue ? palette.accent : t.completed ? palette.borderStrong : priorityColor(t.priority) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.monthTaskTitle, t.completed && styles.monthTaskTitleCompleted]}>{t.title}</Text>
              <View style={styles.monthTaskMeta}>
                <Text style={{ fontSize: 10.5, color: withAlpha(s.categories[t.category] || palette.textFaint, 0.9) }}>{t.category}</Text>
                {t.completed ? <Text style={styles.monthTaskCompleted}>Виконано</Text> : null}
                {t.overdue ? <Text style={styles.monthTaskOverdue}>Прострочено</Text> : null}
              </View>
            </View>
            <Text style={styles.monthTaskWhen}>{whenLabel}</Text>
          </Pressable>
          );
        })}
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
  taskRowFocused: { paddingHorizontal: 8, borderRadius: 10, borderTopColor: withAlpha(palette.accent, 0.38), backgroundColor: withAlpha(palette.accent, 0.07) },
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
  conflictCardPressed: { backgroundColor: withAlpha(palette.accent, 0.12), borderColor: withAlpha(palette.accent, 0.42) },
  conflictIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.1) },
  conflictBody: { flex: 1, minWidth: 0 },
  conflictTitle: { color: palette.accentPaleText, fontSize: 12.5, fontWeight: '700' },
  conflictText: { color: palette.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  conflictAction: { color: palette.accent, fontSize: 11, fontWeight: '700', marginTop: 5 },
  collapseTimelineButton: { alignSelf: 'center', minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, marginBottom: 10, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  collapseTimelineText: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  foldedTime: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.borderFaint, borderStyle: 'dashed' },
  foldedTimeRange: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  foldedTimeLabel: { color: palette.accent, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  dragGuide: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
  dragGuideText: { color: palette.textFaint, fontSize: 10.5 },
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
  eventCard: { position: 'absolute', left: 62, right: 0, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, borderLeftWidth: 3, overflow: 'hidden', zIndex: 2, userSelect: 'none' },
  eventCardFocused: { borderColor: withAlpha(palette.accent, 0.72), backgroundColor: withAlpha(palette.accent, 0.08), zIndex: 4 },
  eventCardDragging: { zIndex: 20, elevation: 12, borderColor: withAlpha(palette.accent, 0.82), backgroundColor: palette.surfaceAlt, shadowColor: palette.accent, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  eventPressable: { flex: 1, minHeight: 44, paddingHorizontal: 12, paddingVertical: 9, userSelect: 'none' },
  eventTime: { fontSize: 11, color: palette.textFaint },
  eventTimeDragging: { color: palette.accent, fontWeight: '700' },
  eventTitle: { fontSize: 14, color: palette.text, fontWeight: '600', marginTop: 3, paddingRight: 72 },
  eventTitleDone: { color: palette.textFaint, textDecorationLine: 'line-through' },
  eventCategory: { position: 'absolute', top: 9, right: 32 },
  eventFlag: { position: 'absolute', top: 11, right: 10 },
  eventDragGrip: { position: 'absolute', right: 9, bottom: 5, color: palette.textFainter, fontSize: 16, lineHeight: 18, userSelect: 'none' },
  eventDragGripActive: { color: palette.accent },
  freeWindowsPanel: { marginBottom: 12, padding: 12, borderRadius: 15, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  freeWindowsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  freeWindowsHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  freeWindowsTitle: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '700' },
  freeWindowsCount: { minWidth: 24, height: 24, lineHeight: 24, textAlign: 'center', color: palette.badgeGreen, fontSize: 11, fontWeight: '800', borderRadius: 8, overflow: 'hidden', backgroundColor: withAlpha(palette.badgeGreen, 0.1) },
  freeWindowRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.borderFaint, marginTop: 6 },
  freeWindowTimeBlock: { flex: 1, minWidth: 0 },
  freeWindowTime: { color: palette.text, fontSize: 12.5, fontWeight: '700' },
  freeWindowDuration: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  freeWindowPlan: { color: palette.badgeGreen, fontSize: 11.5, fontWeight: '700' },
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
  monthTaskRowCompleted: { opacity: 0.58 },
  monthTaskBar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  monthTaskTitle: { fontSize: 14, color: palette.text },
  monthTaskTitleCompleted: { color: palette.textFaint, textDecorationLine: 'line-through' },
  monthTaskMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' },
  monthTaskCompleted: { color: palette.badgeGreen, fontSize: 10, fontWeight: '600' },
  monthTaskOverdue: { color: palette.accent, fontSize: 10, fontWeight: '600' },
  monthTaskWhen: { maxWidth: 116, fontSize: 11.5, color: palette.textMuted, textAlign: 'right' },
});
