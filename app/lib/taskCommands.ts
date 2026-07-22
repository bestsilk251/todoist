import type { PreviewTask, V5Task } from './v5data';
import { clockToMinutes, DEFAULT_TIMED_TASK_DURATION_MINUTES, minutesToClock } from './calendarMath';
import { isoFromOffset, offsetFromToday } from './tasksRepo';
import { parseDurationMinutes } from './analyticsMath';

export type TaskScheduleCommandKind = 'shift' | 'cancel';

export interface TaskScheduleCommand {
  id: string;
  kind: TaskScheduleCommandKind;
  date: string;
  fromMinutes: number;
  toMinutes: number;
  shiftMinutes: number;
  taskIds: string[];
  summary: string;
}

export interface TaskCommandSplit {
  taskText: string;
  commandText: string | null;
}

const COMMAND_START = /(?:перемісти|перенеси|посунь|зсунь|звільни|скасуй|видали|видалити|прибери)\s+(?:(?:якийсь|певний)\s+)?(?:все|усе|всі|усі|задачі|завдання|час|період)/iu;

export function splitTaskCommandText(rawText: string): TaskCommandSplit {
  const match = COMMAND_START.exec(rawText);
  if (!match || match.index == null) return { taskText: rawText.trim(), commandText: null };
  const taskText = rawText
    .slice(0, match.index)
    .replace(/[\s,;:–—-]*(?:і|та)?\s*$/iu, '')
    .trim();
  return { taskText, commandText: rawText.slice(match.index).trim() };
}

function parsedClock(hourRaw: string, minuteRaw?: string): number | null {
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? 0);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function explicitRange(text: string): { fromMinutes: number; toMinutes: number } | null {
  const range = text.match(/(?:з|від)\s*(\d{1,2})(?:\s*[:.]\s*|\s+)?(\d{2})?\s*(?:до|по|[-–—])\s*(\d{1,2})(?:\s*[:.]\s*|\s+)?(\d{2})?/iu)
    ?? text.match(/між\s*(\d{1,2})(?:\s*[:.]\s*|\s+)?(\d{2})?\s*(?:і|та)\s*(\d{1,2})(?:\s*[:.]\s*|\s+)?(\d{2})?/iu);
  if (!range) return null;
  const fromMinutes = parsedClock(range[1], range[2]);
  const toMinutes = parsedClock(range[3], range[4]);
  if (fromMinutes == null || toMinutes == null || toMinutes <= fromMinutes) return null;
  return { fromMinutes, toMinutes };
}

function shiftAmount(text: string): number {
  if (/на\s+(?:пів|половину)\s*(?:години|годину)/iu.test(text)) return 30;
  const minutes = text.match(/на\s+(\d+)\s*(?:хв|хвилин\w*)/iu);
  if (minutes) return Math.max(15, Math.min(12 * 60, Number(minutes[1])));
  const hours = text.match(/на\s+(\d+(?:[.,]\d+)?)\s*(?:год|годин\w*)/iu);
  if (hours) return Math.max(15, Math.min(12 * 60, Math.round(Number(hours[1].replace(',', '.')) * 60)));
  if (/на\s+(?:одну\s+)?годину/iu.test(text)) return 60;
  return 60;
}

function commandDate(commandText: string, previews: PreviewTask[]): string {
  const previewDate = previews.find((task) => task.iso)?.iso;
  if (previewDate) return previewDate;
  if (/завтра/iu.test(commandText)) return isoFromOffset(1);
  return isoFromOffset(0);
}

function previewRange(previews: PreviewTask[]): { fromMinutes: number; toMinutes: number } | null {
  const preview = previews.find((task) => task.time);
  if (!preview?.time) return null;
  const fromMinutes = clockToMinutes(preview.time);
  const duration = parseDurationMinutes(preview.duration) ?? DEFAULT_TIMED_TASK_DURATION_MINUTES;
  return { fromMinutes, toMinutes: Math.min(24 * 60, fromMinutes + duration) };
}

function tasksInRange(tasks: V5Task[], date: string, fromMinutes: number, toMinutes: number, beforeOnly = false): string[] {
  const offset = offsetFromToday(date);
  return tasks.filter((task) => {
    if (task.completed || task.cancelled || !task.time || task.dueInDays !== offset) return false;
    const start = clockToMinutes(task.time);
    if (beforeOnly) return start < toMinutes;
    const end = start + (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES);
    return start < toMinutes && end > fromMinutes;
  }).map((task) => task.id);
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours} год` : ''}${rest ? ` ${rest} хв` : ''}`.trim();
}

export function resolveTaskScheduleCommand(
  commandText: string | null,
  previews: PreviewTask[],
  tasks: V5Task[],
): TaskScheduleCommand | null {
  if (!commandText) return null;
  const isShift = /(?:перемісти|перенеси|посунь|зсунь)/iu.test(commandText);
  const isCancel = /(?:звільни|скасуй|видали|видалити|прибери)/iu.test(commandText);
  if (!isShift && !isCancel) return null;

  const date = commandDate(commandText, previews);
  const range = explicitRange(commandText) ?? previewRange(previews);
  const beforeMeeting = isCancel && /(?:до|перед)\s+(?:зустріч\w*|задач\w*|завдан\w*)/iu.test(commandText);
  const explicitBefore = isCancel ? commandText.match(/до\s*(\d{1,2})(?:\s*[:.]\s*|\s+)?(\d{2})?/iu) : null;
  const beforeMinutes = explicitBefore ? parsedClock(explicitBefore[1], explicitBefore[2]) : null;

  let fromMinutes = range?.fromMinutes ?? 0;
  let toMinutes = range?.toMinutes ?? beforeMinutes ?? 0;
  let beforeOnly = false;
  if (beforeMeeting && previews.some((task) => task.time)) {
    toMinutes = clockToMinutes(previews.find((task) => task.time)!.time);
    fromMinutes = 0;
    beforeOnly = true;
  } else if (!range && beforeMinutes != null) {
    fromMinutes = 0;
    toMinutes = beforeMinutes;
    beforeOnly = true;
  }
  if (toMinutes <= fromMinutes) return null;

  const taskIds = tasksInRange(tasks, date, fromMinutes, toMinutes, beforeOnly);
  const shiftMinutes = isShift ? shiftAmount(commandText) : 0;
  const rangeLabel = beforeOnly
    ? `до ${minutesToClock(toMinutes)}`
    : `${minutesToClock(fromMinutes)}–${minutesToClock(toMinutes)}`;
  const summary = isShift
    ? `Перенести ${taskIds.length} задач у періоді ${rangeLabel} на ${durationLabel(shiftMinutes)}`
    : `Скасувати ${taskIds.length} задач у періоді ${rangeLabel}`;

  return {
    id: `command-${Date.now()}`,
    kind: isShift ? 'shift' : 'cancel',
    date,
    fromMinutes,
    toMinutes,
    shiftMinutes,
    taskIds,
    summary,
  };
}
