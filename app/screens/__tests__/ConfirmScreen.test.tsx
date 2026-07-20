import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConfirmScreen from '../ConfirmScreen';

const mockNavigate = jest.fn();
const mockInsert = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({
    params: {
      sourceText: 'buy milk tomorrow and doctor today at 3',
      tasks: [
        { title: 'Buy milk', date: '2026-07-21', time: null, is_all_day: true, needs_confirmation: false },
        { title: 'До лікаря', date: '2026-07-20', time: '15:00', is_all_day: false, needs_confirmation: true },
      ],
    },
  }),
}));

jest.mock('../../lib/supabase', () => ({
  getSupabaseClient: () => ({ from: () => ({ insert: mockInsert }) }),
}));

describe('ConfirmScreen', () => {
  beforeEach(() => {
    mockInsert.mockResolvedValue({ error: null });
  });

  it('renders one row per parsed task', () => {
    const { getByTestId } = render(<ConfirmScreen />);
    expect(getByTestId('task-title-0').props.value).toBe('Buy milk');
    expect(getByTestId('task-title-1').props.value).toBe('До лікаря');
  });

  it('flags tasks that need time confirmation', () => {
    const { getByText } = render(<ConfirmScreen />);
    expect(getByText('⚠️ confirm time')).toBeTruthy();
  });

  it('saves all tasks and navigates to the list', async () => {
    const { getByTestId } = render(<ConfirmScreen />);
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Buy milk', due_date: '2026-07-21' }),
        expect.objectContaining({ title: 'До лікаря', due_time: '15:00' }),
      ]);
      expect(mockNavigate).toHaveBeenCalledWith('TaskList');
    });
  });

  it('saves the edited title, not the original', async () => {
    const { getByTestId } = render(<ConfirmScreen />);
    fireEvent.changeText(getByTestId('task-title-0'), 'Buy oat milk');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Buy oat milk' }),
        expect.anything(),
      ]);
    });
  });
});
