import { render } from '@testing-library/react-native';
import type { V5Task } from '../../../lib/v5data';
import CalendarTab from '../CalendarTab';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

function task(id: string, title: string, overrides: Partial<V5Task> = {}): V5Task {
  return {
    id,
    dueInDays: -1,
    title,
    time: '10:00',
    category: 'Робота',
    priority: 'medium',
    completed: false,
    cancelled: false,
    overdue: true,
    repeat: false,
    hasSubtasks: false,
    subtaskCount: 0,
    durationMinutes: 60,
    completedAt: null,
    ...overrides,
  };
}

describe('CalendarTab month history', () => {
  it('shows overdue and completed tasks on a selected past day but hides cancelled tasks', () => {
    (useV5 as jest.Mock).mockReturnValue({
      calendarView: 'month',
      calendarDayOffset: -1,
      tasks: [
        task('overdue', 'Минуле прострочене завдання'),
        task('completed', 'Минуле виконане завдання', {
          completed: true,
          overdue: false,
          completedAt: new Date().toISOString(),
        }),
        task('cancelled', 'Минуле скасоване завдання', {
          cancelled: true,
          overdue: false,
        }),
      ],
      categories: { Робота: '#8B5CF6' },
      prevDay: jest.fn(),
      nextDay: jest.fn(),
      goToToday: jest.fn(),
      setCalendarView: jest.fn(),
      setCalendarDay: jest.fn(),
      openTaskDetail: jest.fn(),
    });

    const screen = render(<CalendarTab />);

    expect(screen.getByText('Минуле прострочене завдання')).toBeTruthy();
    expect(screen.getByText('Минуле виконане завдання')).toBeTruthy();
    expect(screen.getByText('Прострочено')).toBeTruthy();
    expect(screen.getByText('Виконано')).toBeTruthy();
    expect(screen.queryByText('Минуле скасоване завдання')).toBeNull();
  });

  it('marks every day from a past week as finished instead of currently free', () => {
    (useV5 as jest.Mock).mockReturnValue({
      calendarView: 'week',
      calendarDayOffset: -8,
      tasks: [],
      categories: { Робота: '#8B5CF6' },
      prevDay: jest.fn(),
      nextDay: jest.fn(),
      goToToday: jest.fn(),
      setCalendarView: jest.fn(),
      setCalendarDay: jest.fn(),
    });

    const screen = render(<CalendarTab />);

    expect(screen.getAllByText('День завершено')).toHaveLength(7);
    expect(screen.queryByText('Вільно 8 год')).toBeNull();
  });
});
