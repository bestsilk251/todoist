export interface TimedCalendarItem {
  time: string;
  durationMinutes: number | null;
}

export const DEFAULT_TIMED_TASK_DURATION_MINUTES = 60;

export interface FreeWindow {
  startMinutes: number;
  endMinutes: number;
}

export interface TimelineRange {
  startMinutes: number;
  endMinutes: number;
}

export interface ExtractedSchedule {
  startTime: string | null;
  durationMinutes: number;
}

export interface ScheduleConflict {
  startMinutes: number;
  endMinutes: number;
  itemIndexes: number[];
}

export function clockToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToClock(value: number): string {
  const normalized = Math.max(0, value) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

export function shiftClockByMinutes(hour: number, minute: number, deltaMinutes: number): { hour: number; minute: number } {
  const minutesInDay = 24 * 60;
  const shifted = ((hour * 60 + minute + deltaMinutes) % minutesInDay + minutesInDay) % minutesInDay;
  return {
    hour: Math.floor(shifted / 60),
    minute: shifted % 60,
  };
}

export function durationBetweenClocks(start: string, end: string): number {
  const startMinutes = clockToMinutes(start);
  let duration = clockToMinutes(end) - startMinutes;
  if (duration <= 0) duration += 24 * 60;
  return duration;
}

export function snapTaskStartMinutes(value: number, durationMinutes: number, stepMinutes = 15): number {
  const safeStep = Math.max(1, Math.round(stepMinutes));
  const safeDuration = Math.max(1, Math.round(durationMinutes));
  const maxStart = Math.max(0, Math.floor((24 * 60 - safeDuration) / safeStep) * safeStep);
  const snapped = Math.round(value / safeStep) * safeStep;
  return Math.max(0, Math.min(maxStart, snapped));
}

export function getNonHourlyBoundaries(items: TimedCalendarItem[]): number[] {
  const boundaries = new Set<number>();
  items.forEach((item) => {
    if (!item.time) return;
    const start = clockToMinutes(item.time);
    if (start % 60 !== 0) boundaries.add(start);
    if (item.durationMinutes != null && item.durationMinutes > 0) {
      const end = Math.min(24 * 60, start + item.durationMinutes);
      if (end < 24 * 60 && end % 60 !== 0) boundaries.add(end);
    }
  });
  return [...boundaries].sort((a, b) => a - b);
}

function scheduledIntervals(items: TimedCalendarItem[], defaultDurationMinutes = DEFAULT_TIMED_TASK_DURATION_MINUTES) {
  return items
    .filter((item) => item.time)
    .map((item, itemIndex) => {
      const startMinutes = clockToMinutes(item.time);
      const durationMinutes = Math.max(1, item.durationMinutes ?? defaultDurationMinutes);
      return {
        itemIndex,
        startMinutes,
        endMinutes: Math.min(24 * 60, startMinutes + durationMinutes),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
}

/** Returns the earliest overlap between scheduled tasks, including all tasks involved. */
export function findScheduleConflict(items: TimedCalendarItem[]): ScheduleConflict | null {
  const intervals = scheduledIntervals(items);
  for (let firstIndex = 0; firstIndex < intervals.length; firstIndex += 1) {
    const first = intervals[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < intervals.length; secondIndex += 1) {
      const second = intervals[secondIndex];
      if (second.startMinutes >= first.endMinutes) break;
      const startMinutes = Math.max(first.startMinutes, second.startMinutes);
      const endMinutes = Math.min(first.endMinutes, second.endMinutes);
      const itemIndexes = intervals
        .filter((item) => item.startMinutes < endMinutes && item.endMinutes > startMinutes)
        .map((item) => item.itemIndex);
      return { startMinutes, endMinutes, itemIndexes };
    }
  }
  return null;
}

/** Returns every source item that overlaps at least one other item that day. */
export function getConflictingItemIndexes(items: TimedCalendarItem[]): number[] {
  const intervals = scheduledIntervals(items);
  const conflicting = new Set<number>();
  for (let firstIndex = 0; firstIndex < intervals.length; firstIndex += 1) {
    const first = intervals[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < intervals.length; secondIndex += 1) {
      const second = intervals[secondIndex];
      if (second.startMinutes >= first.endMinutes) break;
      if (second.endMinutes > first.startMinutes) {
        conflicting.add(first.itemIndex);
        conflicting.add(second.itemIndex);
      }
    }
  }
  return [...conflicting].sort((a, b) => a - b);
}

/** Counts the union of scheduled time inside a selected part of the day. */
export function getOccupiedMinutes(
  items: TimedCalendarItem[],
  windowStartMinutes = 8 * 60,
  windowEndMinutes = 22 * 60,
): number {
  if (windowEndMinutes <= windowStartMinutes) return 0;
  const intervals = scheduledIntervals(items)
    .map((item) => ({
      startMinutes: Math.max(windowStartMinutes, item.startMinutes),
      endMinutes: Math.min(windowEndMinutes, item.endMinutes),
    }))
    .filter((item) => item.endMinutes > item.startMinutes);

  let occupiedMinutes = 0;
  let currentStart: number | null = null;
  let currentEnd = 0;
  intervals.forEach((item) => {
    if (currentStart == null) {
      currentStart = item.startMinutes;
      currentEnd = item.endMinutes;
      return;
    }
    if (item.startMinutes <= currentEnd) {
      currentEnd = Math.max(currentEnd, item.endMinutes);
      return;
    }
    occupiedMinutes += currentEnd - currentStart;
    currentStart = item.startMinutes;
    currentEnd = item.endMinutes;
  });
  if (currentStart != null) occupiedMinutes += currentEnd - currentStart;
  return occupiedMinutes;
}

/** Extracts an explicit time/range and planned duration from free text. */
export function extractScheduleFromText(text: string): ExtractedSchedule | null {
  const replaceStandaloneWord = (source: string, words: string, value: string): string => {
    const lettersAndDigits = 'A-Za-zА-Яа-яІіЇїЄєҐґ0-9';
    const pattern = new RegExp(`(^|[^${lettersAndDigits}])(?:${words})(?=$|[^${lettersAndDigits}])`, 'gi');
    return source.replace(pattern, (_match, prefix: string) => `${prefix}${value}`);
  };

  let normalized = text.trim().toLowerCase();
  normalized = replaceStandaloneWord(normalized, 'півтори', '1.5');
  normalized = replaceStandaloneWord(normalized, 'пів', '0.5');
  normalized = replaceStandaloneWord(normalized, 'одну|одна|один|one', '1');
  normalized = replaceStandaloneWord(normalized, 'дві|два|two', '2');
  normalized = replaceStandaloneWord(normalized, 'три|three', '3');
  normalized = replaceStandaloneWord(normalized, 'чотири|four', '4');
  const range = normalized.match(/(?:^|\s)(?:з|від|from)\s*(\d{1,2})(?:[:.]|\s+)(\d{2})\s*(?:до|по|to|[-–—])\s*(\d{1,2})(?:[:.]|\s+)(\d{2})(?:\s|$)/i);
  if (range) {
    const [, startHourRaw, startMinuteRaw, endHourRaw, endMinuteRaw] = range;
    const startHour = Number(startHourRaw);
    const startMinute = Number(startMinuteRaw);
    const endHour = Number(endHourRaw);
    const endMinute = Number(endMinuteRaw);
    if (startHour <= 23 && endHour <= 23 && startMinute <= 59 && endMinute <= 59) {
      const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
      return { startTime, durationMinutes: durationBetweenClocks(startTime, endTime) };
    }
  }

  let durationSource = normalized;
  let startTime: string | null = null;
  const normalizeClock = (hourRaw: string, minuteRaw = '0', period?: string, assumeAfternoon = false): string | null => {
    let hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (hour > 23 || minute > 59) return null;
    if (period && /вечора|увечері|вечір/u.test(period) && hour < 12) hour += 12;
    if (period && /ранку|вранці|зранку|ранок/u.test(period) && hour === 12) hour = 0;
    if (!period && assumeAfternoon && hour >= 1 && hour <= 7) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };
  const consumeClock = (
    match: RegExpMatchArray | null,
    periodIndex?: number,
    assumeAfternoon = false,
    minuteIndex: number | null = 2,
  ) => {
    if (!match || startTime) return;
    const parsed = normalizeClock(
      match[1],
      minuteIndex == null ? '0' : (match[minuteIndex] ?? '0'),
      periodIndex == null ? undefined : match[periodIndex],
      assumeAfternoon,
    );
    if (!parsed) return;
    startTime = parsed;
    durationSource = durationSource.replace(match[0], ' ');
  };

  // Qualifiers always win: "о 8 ранку" → 08:00, "о 8 вечора" → 20:00.
  consumeClock(
    durationSource.match(/(?:^|\s)(?:о|на)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(ранку|вранці|зранку|вечора|увечері|на\s+вечір)(?=\s|[,.!?]|$)/iu),
    3,
  );
  // A clock with minutes is a start time, not a duration.
  consumeClock(
    durationSource.match(/(?:^|\s)(?:о|на)\s*(\d{1,2})[:.](\d{2})(?=\s|[,.!?]|$)/iu),
    undefined,
    true,
  );
  // In Ukrainian planning language 3–12 "на ... годину" names the start hour.
  // One/two hours remain duration phrases, which avoids breaking "на 1 годину".
  const hourWord = durationSource.match(/(?:^|\s)(?:о|на)\s*(\d{1,2})\s*(годину|годині)(?=\s|[,.!?]|$)/iu);
  if (hourWord && Number(hourWord[1]) >= 3 && Number(hourWord[1]) <= 12) {
    consumeClock(hourWord, undefined, true, null);
  }
  // Also support the common shortened form "зустріч на 5".
  consumeClock(
    durationSource.match(/(?:^|\s)(?:о|на)\s*([1-7])(?![.:]\d)(?=\s*(?:[,.!?]|$))/iu),
    undefined,
    true,
    null,
  );

  const hoursMatch = durationSource.match(/(\d+(?:[.,]\d+)?)\s*(?:год(?:ину|ина|ини|ин)?|hours?|hrs?|h)/i);
  const minutesMatch = durationSource.match(/(\d+)\s*(?:хв(?:илина|илини|илин)?|minutes?|mins?|min)/i);
  const durationMinutes = Math.round(Number((hoursMatch?.[1] ?? '0').replace(',', '.')) * 60 + Number(minutesMatch?.[1] ?? 0));
  if (durationMinutes > 0 && durationMinutes <= 24 * 60) return { startTime, durationMinutes };
  return startTime ? { startTime, durationMinutes: DEFAULT_TIMED_TASK_DURATION_MINUTES } : null;
}

/** Finds the first exact-size gap that is bounded by two scheduled tasks. */
export function findBoundedFreeWindow(
  items: TimedCalendarItem[],
  weekday: number,
  minimumMinutes = 120,
): FreeWindow | null {
  if (weekday === 0 || weekday === 6) return null;

  const occupied = items
    .filter((item) => item.time && item.durationMinutes != null && item.durationMinutes > 0)
    .map((item) => {
      const startMinutes = clockToMinutes(item.time);
      return {
        startMinutes,
        endMinutes: Math.min(24 * 60, startMinutes + item.durationMinutes!),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (let index = 0; index < occupied.length - 1; index += 1) {
    const startMinutes = occupied[index].endMinutes;
    const nextStart = occupied[index + 1].startMinutes;
    if (nextStart - startMinutes >= minimumMinutes) {
      return { startMinutes, endMinutes: startMinutes + minimumMinutes };
    }
  }
  return null;
}

/**
 * Returns every meaningful free interval during inclusive working hours
 * (09:00 through the end of the 18:00 hour). Empty days stay visually quiet,
 * matching the product decision not to suggest an entirely blank schedule.
 */
export function findWorkingHoursFreeWindows(
  items: TimedCalendarItem[],
  weekday: number,
  windowStartMinutes = 9 * 60,
  windowEndMinutes = 19 * 60,
  minimumMinutes = 30,
): FreeWindow[] {
  if (weekday === 0 || weekday === 6 || windowEndMinutes <= windowStartMinutes) return [];

  const occupied = scheduledIntervals(items)
    .map((item) => ({
      startMinutes: Math.max(windowStartMinutes, item.startMinutes),
      endMinutes: Math.min(windowEndMinutes, item.endMinutes),
    }))
    .filter((item) => item.endMinutes > item.startMinutes);
  if (occupied.length === 0) return [];

  const merged: FreeWindow[] = [];
  occupied.forEach((item) => {
    const previous = merged.at(-1);
    if (previous && item.startMinutes <= previous.endMinutes) {
      previous.endMinutes = Math.max(previous.endMinutes, item.endMinutes);
    } else {
      merged.push({ ...item });
    }
  });

  const windows: FreeWindow[] = [];
  let cursor = windowStartMinutes;
  merged.forEach((item) => {
    if (item.startMinutes - cursor >= minimumMinutes) {
      windows.push({ startMinutes: cursor, endMinutes: item.startMinutes });
    }
    cursor = Math.max(cursor, item.endMinutes);
  });
  if (windowEndMinutes - cursor >= minimumMinutes) {
    windows.push({ startMinutes: cursor, endMinutes: windowEndMinutes });
  }
  return windows;
}

/** Keeps one hour of context around scheduled tasks and folds empty night time. */
export function getCompactTimelineRange(
  items: TimedCalendarItem[],
  expanded = false,
  paddingMinutes = 60,
): TimelineRange | null {
  if (expanded) return { startMinutes: 0, endMinutes: 24 * 60 };
  const scheduled = items
    .filter((item) => item.time)
    .map((item) => {
      const startMinutes = clockToMinutes(item.time);
      return {
        startMinutes,
        endMinutes: Math.min(24 * 60, startMinutes + Math.max(30, item.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES)),
      };
    });
  if (scheduled.length === 0) return null;

  const earliest = Math.min(...scheduled.map((item) => item.startMinutes));
  const latest = Math.max(...scheduled.map((item) => item.endMinutes));
  const startMinutes = Math.max(0, Math.floor((earliest - paddingMinutes) / 30) * 30);
  const endMinutes = Math.min(24 * 60, Math.ceil((latest + paddingMinutes) / 30) * 30);
  return { startMinutes, endMinutes };
}
