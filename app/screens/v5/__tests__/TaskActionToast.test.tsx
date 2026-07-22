import { fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import TaskActionToast from '../TaskActionToast';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

function mockToast(kind: 'completed' | 'cancelled' | null) {
  const undoLastAction = jest.fn();
  (useV5 as jest.Mock).mockReturnValue({
    undoTaskId: kind ? 'task-1' : null,
    undoTaskKind: kind,
    undoLastAction,
  });
  return undoLastAction;
}

describe('TaskActionToast', () => {
  beforeEach(() => {
    jest.spyOn(Animated, 'parallel').mockReturnValue({ start: jest.fn() } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing without a reversible task action', () => {
    mockToast(null);
    const { queryByTestId } = render(<TaskActionToast />);
    expect(queryByTestId('task-action-toast')).toBeNull();
  });

  it('shows completion feedback and lets the user undo it', () => {
    const undoLastAction = mockToast('completed');
    const screen = render(<TaskActionToast />);

    expect(screen.getByText('Завдання виконано')).toBeTruthy();
    fireEvent.press(screen.getByText('Скасувати'));
    expect(undoLastAction).toHaveBeenCalledTimes(1);
  });

  it('shows cancellation feedback and lets the user restore the task', () => {
    const undoLastAction = mockToast('cancelled');
    const screen = render(<TaskActionToast />);

    expect(screen.getByText('Задачу скасовано')).toBeTruthy();
    fireEvent.press(screen.getByText('Повернути'));
    expect(undoLastAction).toHaveBeenCalledTimes(1);
  });

  it('also restores a cancelled task when the left icon is pressed', () => {
    const undoLastAction = mockToast('cancelled');
    const screen = render(<TaskActionToast />);

    fireEvent.press(screen.getByLabelText('Повернути скасовану задачу'));
    expect(undoLastAction).toHaveBeenCalledTimes(1);
  });
});
