import { clockToMinutes, durationBetweenClocks, extractScheduleFromText, findBoundedFreeWindow, findScheduleConflict, findWorkingHoursFreeWindows, getCompactTimelineRange, getConflictingItemIndexes, getNonHourlyBoundaries, getOccupiedMinutes, minutesToClock, shiftClockByMinutes, snapTaskStartMinutes } from '../calendarMath';

describe('calendarMath', () => {
  it('preserves minute precision and renders the end of day as 00:00', () => {
    expect(clockToMinutes('19:45')).toBe(1185);
    expect(minutesToClock(24 * 60)).toBe('00:00');
    expect(minutesToClock(25 * 60 + 15)).toBe('01:15');
    expect(durationBetweenClocks('10:15', '11:40')).toBe(85);
    expect(durationBetweenClocks('23:30', '00:15')).toBe(45);
  });

  it('shifts quick time actions from the currently selected wheel value', () => {
    expect(shiftClockByMinutes(13, 15, 30)).toEqual({ hour: 13, minute: 45 });
    expect(shiftClockByMinutes(13, 15, 60)).toEqual({ hour: 14, minute: 15 });
    expect(shiftClockByMinutes(23, 45, 30)).toEqual({ hour: 0, minute: 15 });
  });

  it('snaps dragged tasks to 15-minute starts and keeps them inside the day', () => {
    expect(snapTaskStartMinutes(10 * 60 + 7, 60)).toBe(10 * 60);
    expect(snapTaskStartMinutes(10 * 60 + 8, 60)).toBe(10 * 60 + 15);
    expect(snapTaskStartMinutes(-20, 60)).toBe(0);
    expect(snapTaskStartMinutes(24 * 60, 45)).toBe(23 * 60 + 15);
  });

  it('finds a two-hour weekday window only when tasks bound it', () => {
    expect(findBoundedFreeWindow([
      { time: '10:15', durationMinutes: 60 },
      { time: '13:15', durationMinutes: 45 },
    ], 4)).toEqual({ startMinutes: 675, endMinutes: 795 });
  });

  it('does not suggest windows on weekends, empty days, or without duration', () => {
    const tasks = [
      { time: '09:00', durationMinutes: 60 },
      { time: '13:00', durationMinutes: 60 },
    ];
    expect(findBoundedFreeWindow(tasks, 6)).toBeNull();
    expect(findBoundedFreeWindow([], 2)).toBeNull();
    expect(findBoundedFreeWindow([
      { time: '09:00', durationMinutes: null },
      { time: '13:00', durationMinutes: 60 },
    ], 2)).toBeNull();
  });

  it('finds complete free intervals between 09:00 and 19:00 on weekdays', () => {
    expect(findWorkingHoursFreeWindows([
      { time: '09:00', durationMinutes: 120 },
      { time: '15:00', durationMinutes: 60 },
      { time: '18:00', durationMinutes: 60 },
    ], 4)).toEqual([
      { startMinutes: 11 * 60, endMinutes: 15 * 60 },
      { startMinutes: 16 * 60, endMinutes: 18 * 60 },
    ]);
  });

  it('keeps weekends and completely empty weekdays free of suggestion cards', () => {
    expect(findWorkingHoursFreeWindows([], 4)).toEqual([]);
    expect(findWorkingHoursFreeWindows([{ time: '11:00', durationMinutes: 60 }], 6)).toEqual([]);
  });

  it('folds unused night hours while keeping context around tasks', () => {
    expect(getCompactTimelineRange([
      { time: '11:20', durationMinutes: 40 },
      { time: '14:00', durationMinutes: 60 },
    ])).toEqual({ startMinutes: 600, endMinutes: 960 });
    expect(getCompactTimelineRange([], false)).toBeNull();
    expect(getCompactTimelineRange([], true)).toEqual({ startMinutes: 0, endMinutes: 1440 });
  });

  it('marks unique non-hour starts and ends, including a shared boundary', () => {
    expect(getNonHourlyBoundaries([
      { time: '10:15', durationMinutes: 45 },
      { time: '11:00', durationMinutes: 80 },
      { time: '12:20', durationMinutes: 40 },
      { time: '18:30', durationMinutes: 45 },
    ])).toEqual([615, 740, 1110, 1155]);
  });

  it('detects the earliest calendar overlap but allows adjacent tasks', () => {
    expect(findScheduleConflict([
      { time: '10:00', durationMinutes: 60 },
      { time: '10:30', durationMinutes: 45 },
      { time: '12:00', durationMinutes: 30 },
    ])).toEqual({ startMinutes: 630, endMinutes: 660, itemIndexes: [0, 1] });
    expect(findScheduleConflict([
      { time: '10:00', durationMinutes: 60 },
      { time: '11:00', durationMinutes: 60 },
    ])).toBeNull();
  });

  it('returns tasks from every separate conflict during the selected day', () => {
    expect(getConflictingItemIndexes([
      { time: '09:00', durationMinutes: 60 },
      { time: '09:30', durationMinutes: 45 },
      { time: '12:00', durationMinutes: 60 },
      { time: '12:15', durationMinutes: 30 },
      { time: '14:00', durationMinutes: 60 },
      { time: '15:00', durationMinutes: 60 },
    ])).toEqual([0, 1, 2, 3]);
  });

  it('counts occupied time between 08:00 and 22:00 without double-counting overlaps', () => {
    expect(getOccupiedMinutes([
      { time: '07:30', durationMinutes: 60 },
      { time: '09:00', durationMinutes: 120 },
      { time: '10:00', durationMinutes: 120 },
      { time: '21:30', durationMinutes: 90 },
    ], 8 * 60, 22 * 60)).toBe(240);
  });

  it('extracts exact planned duration from ranges and duration phrases', () => {
    expect(extractScheduleFromText('Завтра дзвінок з 10:15 до 11:40')).toEqual({ startTime: '10:15', durationMinutes: 85 });
    expect(extractScheduleFromText('Тренування о 18:30 на 1 год 20 хв')).toEqual({ startTime: '18:30', durationMinutes: 80 });
    expect(extractScheduleFromText('Дзвінок на одну годину')).toEqual({ startTime: null, durationMinutes: 60 });
    expect(extractScheduleFromText('Дзвінок на 1 годину')).toEqual({ startTime: null, durationMinutes: 60 });
    expect(extractScheduleFromText('Робота на півтори години')).toEqual({ startTime: null, durationMinutes: 90 });
    expect(extractScheduleFromText('Фокус-сесія for 45 minutes')).toEqual({ startTime: null, durationMinutes: 45 });
    expect(extractScheduleFromText('Статистика з 1 до 22 липня')).toBeNull();
  });

  it('understands colloquial Ukrainian morning and evening hours', () => {
    expect(extractScheduleFromText('Зроби звіт на 5 годину')).toEqual({ startTime: '17:00', durationMinutes: 60 });
    expect(extractScheduleFromText('Пробіжка о 8 ранку')).toEqual({ startTime: '08:00', durationMinutes: 60 });
    expect(extractScheduleFromText('Зустріч о 8 вечора')).toEqual({ startTime: '20:00', durationMinutes: 60 });
    expect(extractScheduleFromText('Зустріч на 5')).toEqual({ startTime: '17:00', durationMinutes: 60 });
  });

  it('keeps an explicit duration next to a colloquial start time', () => {
    expect(extractScheduleFromText('Зустріч о 8 вечора на 45 хв')).toEqual({
      startTime: '20:00',
      durationMinutes: 45,
    });
  });
});
