import { matchesTaskFilters, taskFilterCount } from '../taskFilters';
import type { V5Task } from '../v5data';

const task: V5Task = {
  id: 'task-1',
  dueInDays: 0,
  title: 'Підготувати звіт',
  time: '10:00',
  category: 'Робота',
  priority: 'high',
  completed: false,
  cancelled: false,
  overdue: false,
  repeat: false,
  hasSubtasks: false,
  subtaskCount: 0,
  durationMinutes: 60,
  completedAt: null,
};

describe('task filters', () => {
  it('matches everything when no filters are selected', () => {
    expect(matchesTaskFilters(task, { priorities: [], categories: [] })).toBe(true);
  });

  it('uses OR inside a group and AND between priority and category groups', () => {
    expect(matchesTaskFilters(task, { priorities: ['urgent', 'high'], categories: ['Робота'] })).toBe(true);
    expect(matchesTaskFilters(task, { priorities: ['urgent'], categories: ['Робота'] })).toBe(false);
    expect(matchesTaskFilters(task, { priorities: ['high'], categories: ['Особисте'] })).toBe(false);
  });

  it('counts active choices for the filter badge', () => {
    expect(taskFilterCount({ priorities: ['urgent', 'high'], categories: ['Робота'] })).toBe(3);
  });
});
