import { enrichParsedTasksWithSchedule, isoOf, previewFromParsed, previewToInsert, rowToV5 } from '../tasksRepo';
import type { Task } from '../../types';

function databaseTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-id',
    user_id: 'user-id',
    project_id: null,
    title: 'Задача',
    description: null,
    due_date: '2026-07-22',
    due_time: null,
    is_all_day: true,
    needs_confirmation: false,
    status: 'pending',
    source_text: null,
    category: 'Робота',
    important: false,
    priority: 'low',
    completed_at: null,
    duration_minutes: null,
    created_at: '2026-07-20T10:00:00.000Z',
    updated_at: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('parsed task duration persistence', () => {
  it('keeps duration from parser through preview and insert payload', () => {
    const preview = previewFromParsed({
      title: 'Працювати над презентацією',
      date: '2026-07-23',
      time: '10:15',
      is_all_day: false,
      needs_confirmation: false,
      duration_minutes: 85,
    }, 'preview-1');

    expect(preview.time).toBe('10:15');
    expect(preview.duration).toBe('1 год 25 хв');
    expect(previewToInsert(preview)).toEqual(expect.objectContaining({
      due_time: '10:15',
      duration_minutes: 85,
      is_all_day: false,
    }));
  });

  it('defaults a parsed task without a date to today', () => {
    const preview = previewFromParsed({
      title: 'Задача без дати',
      date: null,
      time: null,
      is_all_day: true,
      needs_confirmation: false,
    }, 'preview-today');

    expect(preview.iso).toBe(isoOf(new Date()));
  });

  it('defaults a timed task without an explicit duration to one hour', () => {
    const preview = previewFromParsed({
      title: 'Дзвінок',
      date: '2026-07-22',
      time: '15:00',
      is_all_day: false,
      needs_confirmation: false,
      duration_minutes: null,
    }, 'preview-default-duration');

    expect(preview.duration).toBe('1 год');
    expect(previewToInsert(preview)).toEqual(expect.objectContaining({ duration_minutes: 60 }));
  });

  it('fills a missing server duration from the original time range', () => {
    const [task] = enrichParsedTasksWithSchedule([{
      title: 'Дзвінок',
      date: '2026-07-23',
      time: null,
      is_all_day: true,
      needs_confirmation: false,
    }], 'Дзвінок з 10:15 до 11:40');

    expect(task).toEqual(expect.objectContaining({
      time: '10:15',
      is_all_day: false,
      duration_minutes: 85,
    }));
  });
});

describe('overdue task mapping', () => {
  const now = new Date(2026, 6, 22, 12, 30);

  it('keeps past-day tasks in the overdue section', () => {
    const previous = new Date(now);
    previous.setDate(previous.getDate() - 1);
    expect(rowToV5(databaseTask({ due_date: isoOf(previous) }), now).overdue).toBe(true);
  });

  it('marks a timed task overdue only after its scheduled duration ends', () => {
    const due_date = isoOf(now);
    expect(rowToV5(databaseTask({ due_date, due_time: '10:15:00', is_all_day: false, duration_minutes: 60 }), now).overdue).toBe(true);
    expect(rowToV5(databaseTask({ due_date, due_time: '12:00:00', is_all_day: false, duration_minutes: 60 }), now).overdue).toBe(false);
    expect(rowToV5(databaseTask({ due_date, due_time: null, is_all_day: true }), now).overdue).toBe(false);
  });

  it('maps legacy timed tasks without duration as one-hour tasks', () => {
    const mapped = rowToV5(databaseTask({
      due_date: isoOf(now),
      due_time: '12:00:00',
      is_all_day: false,
      duration_minutes: null,
    }), now);

    expect(mapped.durationMinutes).toBe(60);
    expect(mapped.overdue).toBe(false);
  });

  it('maps a cancelled database task without treating it as overdue', () => {
    const task = rowToV5(databaseTask({ status: 'cancelled', due_date: '2026-07-20' }), now);
    expect(task.cancelled).toBe(true);
    expect(task.completed).toBe(false);
    expect(task.overdue).toBe(false);
  });
});
