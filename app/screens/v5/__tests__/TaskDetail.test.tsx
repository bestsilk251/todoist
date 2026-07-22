import { fireEvent, render } from '@testing-library/react-native';
import TaskDetail from '../TaskDetail';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

const completedTask = {
  id: 'completed-task',
  dueInDays: 0,
  title: 'Завершена зустріч',
  time: '11:00',
  category: 'Робота',
  priority: 'high' as const,
  completed: true,
  cancelled: false,
  overdue: false,
  repeat: false,
  hasSubtasks: false,
  subtaskCount: 0,
  durationMinutes: 60,
  completedAt: '2026-07-22T09:00:00.000Z',
};

function mockTaskDetail(completed = true) {
  const toggleComplete = jest.fn();
  const updateTask = jest.fn();
  (useV5 as jest.Mock).mockReturnValue({
    taskDetailId: completedTask.id,
    tasks: [{ ...completedTask, completed }],
    categories: { Робота: '#9B59B6' },
    toggleComplete,
    closeTaskDetail: jest.fn(),
    openTaskTimePicker: jest.fn(),
    openTaskEndTimePicker: jest.fn(),
    updateTask,
    openShareSheet: jest.fn(),
  });
  return { toggleComplete, updateTask };
}

describe('TaskDetail completed task actions', () => {
  it('allows a completed calendar task to be reactivated', () => {
    const { toggleComplete } = mockTaskDetail();
    const screen = render(<TaskDetail />);

    expect(screen.getByText('Задачу виконано')).toBeTruthy();
    expect(screen.getByText('Її можна редагувати або повернути до активних задач.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Активувати задачу'));

    expect(toggleComplete).toHaveBeenCalledWith(completedTask.id);
  });

  it('does not show the reactivation action for an active task', () => {
    mockTaskDetail(false);
    const screen = render(<TaskDetail />);

    expect(screen.queryByLabelText('Активувати задачу')).toBeNull();
  });

  it('changes the task date from the existing calendar picker', () => {
    const { updateTask } = mockTaskDetail(false);
    const screen = render(<TaskDetail />);

    fireEvent.press(screen.getByLabelText('Змінити дату задачі'));
    fireEvent.press(screen.getByText('Завтра'));
    fireEvent.press(screen.getByText('Обрати день'));

    expect(updateTask).toHaveBeenCalledWith(completedTask.id, { dueInDays: 1 });
  });
});
