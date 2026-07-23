import { fireEvent, render } from '@testing-library/react-native';
import ListTab from '../ListTab';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

function mockList() {
  const closeListSearch = jest.fn();
  (useV5 as jest.Mock).mockReturnValue({
    tasks: [],
    categories: {},
    listPriorityFilters: [],
    listCategoryFilters: [],
    listSearchOpen: true,
    listSearchQuery: 'робота',
    listAddMenuOpen: false,
    listAddMode: null,
    showOverdue: false,
    showCompleted: false,
    showCancelled: false,
    quickText: '',
    closeListSearch,
    setListSearch: jest.fn(),
    toggleListSearch: jest.fn(),
    openListFilters: jest.fn(),
    openCategoryEditor: jest.fn(),
    setListFilters: jest.fn(),
    clearListFilters: jest.fn(),
    toggleShowOverdue: jest.fn(),
    toggleShowCompleted: jest.fn(),
    toggleShowCancelled: jest.fn(),
    openTaskDetail: jest.fn(),
    toggleComplete: jest.fn(),
    restoreTask: jest.fn(),
    closeListAddMenu: jest.fn(),
    chooseListMic: jest.fn(),
    chooseListText: jest.fn(),
    submitQuick: jest.fn(),
    handleFabClick: jest.fn(),
    set: jest.fn(),
  });
  return { closeListSearch };
}

describe('ListTab search', () => {
  it('keeps the query open while results are scrolled and closes only explicitly', () => {
    const { closeListSearch } = mockList();
    const screen = render(<ListTab />);
    const scroll = screen.getByTestId('list-task-scroll');
    const input = screen.getByPlaceholderText('Назва, категорія або ключове слово...');

    expect(scroll.props.onScrollBeginDrag).toBeUndefined();
    expect(input.props.onBlur).toBeUndefined();
    expect(input.props.value).toBe('робота');

    fireEvent.press(screen.getByLabelText('Закрити пошук'));
    expect(closeListSearch).toHaveBeenCalledTimes(1);
  });
});
