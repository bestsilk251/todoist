import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CaptureScreen from '../CaptureScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockInvoke = jest.fn();
jest.mock('../../lib/supabase', () => ({
  getSupabaseClient: () => ({ functions: { invoke: mockInvoke } }),
}));

const parsedTask = {
  title: 'Buy milk',
  date: '2026-07-21',
  time: null,
  is_all_day: true,
  needs_confirmation: false,
};

describe('CaptureScreen', () => {
  beforeEach(() => {
    mockInvoke.mockResolvedValue({ data: { tasks: [parsedTask] }, error: null });
  });

  it('sends the typed text with current date and timezone', async () => {
    const { getByTestId } = render(<CaptureScreen />);
    fireEvent.changeText(getByTestId('capture-input'), 'buy milk tomorrow');
    fireEvent.press(getByTestId('add-button'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'parse-task',
        expect.objectContaining({
          body: expect.objectContaining({ text: 'buy milk tomorrow' }),
        }),
      );
    });
  });

  it('navigates to Confirm with the returned tasks', async () => {
    const { getByTestId } = render(<CaptureScreen />);
    fireEvent.changeText(getByTestId('capture-input'), 'buy milk tomorrow');
    fireEvent.press(getByTestId('add-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Confirm', {
        tasks: [parsedTask],
        sourceText: 'buy milk tomorrow',
      });
    });
  });

  it('shows an error message instead of crashing when the function fails', async () => {
    mockInvoke.mockRejectedValue(new Error('network down'));

    const { getByTestId, findByText } = render(<CaptureScreen />);
    fireEvent.changeText(getByTestId('capture-input'), 'buy milk');
    fireEvent.press(getByTestId('add-button'));

    expect(await findByText(/Не вдалося розпізнати задачу/)).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing when the input is empty', () => {
    const { getByTestId } = render(<CaptureScreen />);
    fireEvent.press(getByTestId('add-button'));
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
