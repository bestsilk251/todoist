import { fireEvent, render } from '@testing-library/react-native';
import ConflictTasksSheet from '../ConflictTasksSheet';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

const firstTask = {
  id: 'task-1',
  dueInDays: 0,
  title: 'Дзвінок з інвестором',
  time: '11:00',
  category: 'Робота',
  priority: 'high' as const,
  completed: false,
  cancelled: false,
  overdue: false,
  repeat: false,
  hasSubtasks: false,
  subtaskCount: 0,
  durationMinutes: 60,
  completedAt: null,
};

const secondTask = {
  ...firstTask,
  id: 'task-2',
  title: 'Підготувати презентацію',
  time: '11:30',
  durationMinutes: 45,
};

function mockConflictStore(open = true) {
  const actions = {
    closeConflictTasks: jest.fn(),
    openTaskDetail: jest.fn(),
    openTaskTimePicker: jest.fn(),
    postponeTask: jest.fn(),
    cancelTask: jest.fn(),
    deleteTask: jest.fn(),
  };
  (useV5 as jest.Mock).mockReturnValue({
    conflictTaskIds: open ? ['task-1', 'task-2'] : [],
    conflictStartMinutes: open ? 690 : null,
    conflictEndMinutes: open ? 720 : null,
    tasks: [firstTask, secondTask],
    categories: { Робота: '#9A4D9A' },
    ...actions,
  });
  return actions;
}

describe('ConflictTasksSheet', () => {
  it('renders only while conflict tasks are selected', () => {
    mockConflictStore(false);
    const { queryByText } = render(<ConflictTasksSheet />);
    expect(queryByText('Конфлікт часу')).toBeNull();
  });

  it('shows the conflicting tasks and opens time editing for the selected task', () => {
    const actions = mockConflictStore();
    const screen = render(<ConflictTasksSheet />);

    expect(screen.getByText('Перетин 11:30–12:00')).toBeTruthy();
    expect(screen.getByText(firstTask.title)).toBeTruthy();
    expect(screen.getByText(secondTask.title)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(`Змінити час задачі ${firstTask.title}`));
    expect(actions.closeConflictTasks).toHaveBeenCalledTimes(1);
    expect(actions.openTaskTimePicker).toHaveBeenCalledWith(firstTask.id);
  });

  it('supports postponing, cancelling and confirmed deletion', () => {
    const actions = mockConflictStore();
    const screen = render(<ConflictTasksSheet />);

    fireEvent.press(screen.getByLabelText(`Перенести задачу ${firstTask.title} на один день`));
    expect(actions.postponeTask).toHaveBeenCalledWith(firstTask.id);

    fireEvent.press(screen.getByLabelText(`Скасувати задачу ${secondTask.title}`));
    expect(actions.cancelTask).toHaveBeenCalledWith(secondTask.id);

    fireEvent.press(screen.getByLabelText(`Видалити задачу ${firstTask.title}`));
    expect(actions.deleteTask).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText(`Підтвердити видалення задачі ${firstTask.title}`));
    expect(actions.deleteTask).toHaveBeenCalledWith(firstTask.id);
  });
});
