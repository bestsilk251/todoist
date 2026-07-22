import { fireEvent, render } from '@testing-library/react-native';
import ListFiltersSheet from '../ListFiltersSheet';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

const tasks = [
  {
    id: 'work-urgent', dueInDays: 0, title: 'Термінова робота', time: '10:00', category: 'Робота', priority: 'urgent',
    completed: false, cancelled: false, overdue: false, repeat: false, hasSubtasks: false, subtaskCount: 0, durationMinutes: 60, completedAt: null,
  },
  {
    id: 'personal-high', dueInDays: 0, title: 'Особиста задача', time: '12:00', category: 'Особисте', priority: 'high',
    completed: false, cancelled: false, overdue: false, repeat: false, hasSubtasks: false, subtaskCount: 0, durationMinutes: 60, completedAt: null,
  },
];

function mockFilters(open = true) {
  const actions = {
    closeListFilters: jest.fn(),
    setListFilters: jest.fn(),
    clearListFilters: jest.fn(),
  };
  (useV5 as jest.Mock).mockReturnValue({
    listFiltersOpen: open,
    listPriorityFilters: [],
    listCategoryFilters: [],
    categories: { Робота: '#7B6FA6', Особисте: '#6E8CB8' },
    tasks,
    ...actions,
  });
  return actions;
}

describe('ListFiltersSheet', () => {
  it('renders nothing while closed', () => {
    mockFilters(false);
    const { queryByText } = render(<ListFiltersSheet />);
    expect(queryByText('Фільтри')).toBeNull();
  });

  it('combines selected priorities and categories and reports the result count', () => {
    const actions = mockFilters();
    const screen = render(<ListFiltersSheet />);

    fireEvent.press(screen.getByText('Терміновий'));
    fireEvent.press(screen.getByText('Робота'));

    expect(screen.getByText('Показати 1 задача')).toBeTruthy();
    fireEvent.press(screen.getByText('Показати 1 задача'));
    expect(actions.setListFilters).toHaveBeenCalledWith(['urgent'], ['Робота']);
  });
});
