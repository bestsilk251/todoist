import { compareTasksChronologically, formatTaskEventDate, getNearestTasks, isTaskCurrentOrUpcoming, type V5Task } from '../v5data';

function task(overrides: Partial<V5Task>): V5Task {
  return {
    id: 'task',
    dueInDays: 0,
    title: 'Задача',
    time: '12:00',
    category: 'Робота',
    priority: 'low',
    completed: false,
    cancelled: false,
    overdue: false,
    repeat: false,
    hasSubtasks: false,
    subtaskCount: 0,
    durationMinutes: null,
    completedAt: null,
    ...overrides,
  };
}

describe('nearest task filtering', () => {
  const now = new Date(2026, 6, 22, 12, 30);

  it('excludes past dates and finished timed tasks', () => {
    expect(isTaskCurrentOrUpcoming(task({ dueInDays: -1 }), now)).toBe(false);
    expect(isTaskCurrentOrUpcoming(task({ time: '11:00' }), now)).toBe(false);
    expect(isTaskCurrentOrUpcoming(task({ time: '11:00', durationMinutes: 60 }), now)).toBe(false);
  });

  it('keeps an ongoing task and future tasks', () => {
    expect(isTaskCurrentOrUpcoming(task({ time: '12:00', durationMinutes: 60 }), now)).toBe(true);
    expect(isTaskCurrentOrUpcoming(task({ time: '12:00', durationMinutes: null }), now)).toBe(true);
    expect(isTaskCurrentOrUpcoming(task({ time: '12:30' }), now)).toBe(true);
    expect(isTaskCurrentOrUpcoming(task({ dueInDays: 1, time: '08:00' }), now)).toBe(true);
  });

  it("keeps today's all-day tasks", () => {
    expect(isTaskCurrentOrUpcoming(task({ time: '' }), now)).toBe(true);
  });

  it('excludes cancelled tasks from nearest tasks', () => {
    expect(isTaskCurrentOrUpcoming(task({ cancelled: true, time: '13:00' }), now)).toBe(false);
  });

  it('returns only the three chronologically nearest tasks', () => {
    const tasks = [
      task({ id: 'later-priority', dueInDays: 4, time: '09:00', priority: 'urgent' }),
      task({ id: 'third', dueInDays: 1, time: '09:00' }),
      task({ id: 'first', dueInDays: 0, time: '12:45' }),
      task({ id: 'second', dueInDays: 0, time: '13:00' }),
    ];

    expect(getNearestTasks(tasks, now).map((item) => item.id)).toEqual(['first', 'second', 'third']);
  });
});

describe('chronological task sorting', () => {
  it('sorts dates first, timed tasks by clock, and all-day tasks last', () => {
    const tasks = [
      task({ id: 'tomorrow', dueInDays: 1, time: '08:00' }),
      task({ id: 'all-day', dueInDays: 0, time: '' }),
      task({ id: 'late', dueInDays: 0, time: '18:30' }),
      task({ id: 'early', dueInDays: 0, time: '09:15' }),
      task({ id: 'no-date', dueInDays: null, time: '07:00' }),
    ];

    expect(tasks.sort(compareTasksChronologically).map((item) => item.id)).toEqual([
      'early', 'late', 'all-day', 'tomorrow', 'no-date',
    ]);
  });
});

describe('task event date formatting', () => {
  it('can omit the year for compact completed-task labels', () => {
    const value = new Date(2026, 6, 22, 12, 0).toISOString();
    const label = formatTaskEventDate(value, false);

    expect(label).toContain('22');
    expect(label).not.toContain('2026');
  });
});
