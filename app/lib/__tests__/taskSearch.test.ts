import { matchesTaskSearch } from '../taskSearch';
import type { V5Task } from '../v5data';

const task: V5Task = {
  id: 'task-1',
  dueInDays: 0,
  title: 'Підготувати квартальний звіт',
  time: '11:20',
  category: 'Робота',
  priority: 'high',
  completed: false,
  cancelled: false,
  overdue: false,
  repeat: false,
  hasSubtasks: false,
  subtaskCount: 0,
  durationMinutes: 70,
  completedAt: null,
};

describe('matchesTaskSearch', () => {
  it('matches title, category, priority and time keywords', () => {
    expect(matchesTaskSearch(task, 'звіт')).toBe(true);
    expect(matchesTaskSearch(task, 'робота')).toBe(true);
    expect(matchesTaskSearch(task, 'високий')).toBe(true);
    expect(matchesTaskSearch(task, '11:20')).toBe(true);
    expect(matchesTaskSearch(task, 'робота звіт')).toBe(true);
  });

  it('requires every entered keyword to match', () => {
    expect(matchesTaskSearch(task, 'робота покупки')).toBe(false);
  });
});
