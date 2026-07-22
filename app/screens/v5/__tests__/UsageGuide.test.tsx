import { fireEvent, render } from '@testing-library/react-native';
import UsageGuide from '../UsageGuide';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

function mockGuide(open: boolean) {
  const closeUsageGuide = jest.fn();
  (useV5 as jest.Mock).mockReturnValue({
    usageGuideOpen: open,
    closeUsageGuide,
    tasks: [],
    categories: { Робота: '#9A4D9A', Особисте: '#6378C7' },
  });
  return closeUsageGuide;
}

describe('UsageGuide', () => {
  it('renders nothing while closed', () => {
    mockGuide(false);
    const { queryByTestId } = render(<UsageGuide />);
    expect(queryByTestId('usage-guide')).toBeNull();
  });

  it('walks through all slides and finishes the guide', () => {
    const closeUsageGuide = mockGuide(true);
    const { getByText } = render(<UsageGuide />);

    expect(getByText('Ласкаво просимо')).toBeTruthy();
    fireEvent.press(getByText('Далі'));
    expect(getByText('Додавайте задачі за секунди')).toBeTruthy();
    fireEvent.press(getByText('Далі'));
    expect(getByText('Стежте за прогресом')).toBeTruthy();
    fireEvent.press(getByText('Почати'));

    expect(closeUsageGuide).toHaveBeenCalledTimes(1);
  });

  it('can be skipped from the first slide', () => {
    const closeUsageGuide = mockGuide(true);
    const { getByText } = render(<UsageGuide />);
    fireEvent.press(getByText('Пропустити'));
    expect(closeUsageGuide).toHaveBeenCalledTimes(1);
  });
});
