import { fireEvent, render } from '@testing-library/react-native';
import PreviewSheet from '../PreviewSheet';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));
jest.mock('../PreviewDatePicker', () => () => null);

function mockPreview(open = true) {
  const confirmSave = jest.fn();
  (useV5 as jest.Mock).mockReturnValue({
    previewOpen: open,
    previewTasks: [{
      id: 'preview-1',
      title: 'Зустріч з командою',
      iso: '2026-07-23',
      time: '10:00',
      duration: '1 год',
      category: 'Робота',
      important: false,
      needsConfirmation: false,
    }],
    previewError: null,
    editingPreviewId: null,
    categories: { Робота: '#7B6FA6', "Здоров'я": '#5FA07A' },
    confirmSave,
    togglePreviewEdit: jest.fn(),
    updatePreviewField: jest.fn(),
    deletePreviewTask: jest.fn(),
    openTimePicker: jest.fn(),
    cyclePreviewCategory: jest.fn(),
    togglePreviewImportant: jest.fn(),
    cancelPreview: jest.fn(),
  });
  return confirmSave;
}

describe('PreviewSheet backdrop confirmation', () => {
  it('saves through the same action when the area above the sheet is pressed', () => {
    const confirmSave = mockPreview();
    const screen = render(<PreviewSheet />);

    fireEvent.press(screen.getByTestId('preview-save-backdrop'));

    expect(confirmSave).toHaveBeenCalledTimes(1);
  });

  it('keeps the existing save button connected to the same action', () => {
    const confirmSave = mockPreview();
    const screen = render(<PreviewSheet />);

    fireEvent.press(screen.getByText('Зберегти всі задачі'));

    expect(confirmSave).toHaveBeenCalledTimes(1);
  });

  it('opens a category choice instead of cycling categories', () => {
    mockPreview();
    const screen = render(<PreviewSheet />);

    fireEvent.press(screen.getByLabelText('Змінити категорію задачі Зустріч з командою'));
    fireEvent.press(screen.getByLabelText("Обрати категорію Здоров'я"));

    const store = (useV5 as jest.Mock).mock.results.at(-1)?.value;
    expect(store.updatePreviewField).toHaveBeenCalledWith('preview-1', 'category', "Здоров'я");
  });

  it('allows the planned duration to be changed with presets', () => {
    mockPreview();
    const screen = render(<PreviewSheet />);

    fireEvent.press(screen.getByLabelText('Змінити тривалість задачі Зустріч з командою'));
    fireEvent.press(screen.getByLabelText('Встановити тривалість 45 хв'));

    const store = (useV5 as jest.Mock).mock.results.at(-1)?.value;
    expect(store.updatePreviewField).toHaveBeenCalledWith('preview-1', 'duration', '45 хв');
  });

  it('renders nothing when confirmation is closed', () => {
    mockPreview(false);
    const screen = render(<PreviewSheet />);

    expect(screen.queryByTestId('preview-save-backdrop')).toBeNull();
  });
});
