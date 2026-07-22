import { getTaskListSection, isTaskInListSection, isTaskOnCalendarDay } from '../taskSelectors';
import type { V5Task } from '../v5data';

function task(overrides: Partial<V5Task> = {}): V5Task {
  return {
    id: 'task',
    dueInDays: 0,
    title: 'Задача',
    time: '10:00',
    category: 'Робота',
    priority: 'medium',
    completed: false,
    cancelled: false,
    overdue: false,
    repeat: false,
    hasSubtasks: false,
    subtaskCount: 0,
    durationMinutes: 30,
    completedAt: null,
    ...overrides,
  };
}

describe('shared task visibility', () => {
  it('classifies every task into exactly one list section', () => {
    expect(getTaskListSection(task())).toBe('active');
    expect(getTaskListSection(task({ overdue: true }))).toBe('overdue');
    expect(getTaskListSection(task({ completed: true, overdue: true }))).toBe('completed');
    expect(getTaskListSection(task({ cancelled: true, completed: true }))).toBe('cancelled');
  });

  it('only projects dated, non-cancelled tasks into a calendar day', () => {
    const active = task({ id: 'active' });
    const completed = task({ id: 'done', completed: true });
    const cancelled = task({ id: 'cancelled', cancelled: true });
    const noDate = task({ id: 'no-date', dueInDays: null });

    expect([active, completed, cancelled, noDate].filter((item) => isTaskOnCalendarDay(item, 0)).map((item) => item.id)).toEqual([
      'active', 'done',
    ]);
    expect(isTaskInListSection(active, 'active')).toBe(true);
    expect(isTaskInListSection(completed, 'completed')).toBe(true);
  });
});
