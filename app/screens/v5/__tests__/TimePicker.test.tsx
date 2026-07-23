import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import TimePicker, { WheelColumn, type WheelColumnHandle } from '../TimePicker';
import { useV5 } from '../store';

jest.mock('../store', () => ({ useV5: jest.fn() }));

function mockTimePicker(open = true) {
  const actions = {
    closeTimePicker: jest.fn(),
    confirmTimePicker: jest.fn(),
    setTimePickerHour: jest.fn(),
    setTimePickerMinute: jest.fn(),
    applyTimePreset: jest.fn(),
  };
  (useV5 as jest.Mock).mockReturnValue({
    timePickerId: open ? 'task-1' : null,
    timePickerTarget: 'task-start',
    timePickerHour: 9,
    timePickerMinute: 20,
    ...actions,
  });
  return actions;
}

describe('TimePicker', () => {
  it('renders nothing while closed', () => {
    mockTimePicker(false);
    const screen = render(<TimePicker />);
    expect(screen.queryByText('Час початку')).toBeNull();
  });

  it('changes hours and minutes through vertical wheel swipes', () => {
    const actions = mockTimePicker();
    const screen = render(<TimePicker />);

    // Both wheels start in the fifth repeated loop. Move each one row forward.
    fireEvent.scroll(screen.getByTestId('time-wheel-hours'), {
      nativeEvent: {
        contentOffset: { x: 0, y: (4 * 24 + 10) * 48 },
        contentSize: { width: 96, height: 9 * 24 * 48 + 192 },
        layoutMeasurement: { width: 96, height: 240 },
      },
    });
    fireEvent.scroll(screen.getByTestId('time-wheel-minutes'), {
      nativeEvent: {
        contentOffset: { x: 0, y: (4 * 60 + 21) * 48 },
        contentSize: { width: 96, height: 9 * 60 * 48 + 192 },
        layoutMeasurement: { width: 96, height: 240 },
      },
    });

    expect(actions.setTimePickerHour).toHaveBeenCalledWith(10);
    expect(actions.setTimePickerMinute).toHaveBeenCalledWith(21);
  });

  it('keeps quick presets and confirmation actions available', () => {
    const actions = mockTimePicker();
    const screen = render(<TimePicker />);

    fireEvent.press(screen.getByText('+30 хв'));
    expect(actions.applyTimePreset).toHaveBeenLastCalledWith(9, 50);

    fireEvent.press(screen.getByText('+1 год'));
    expect(actions.applyTimePreset).toHaveBeenLastCalledWith(10, 20);

    fireEvent.press(screen.getByText('18:00'));
    expect(actions.applyTimePreset).toHaveBeenLastCalledWith(18, 0);

    fireEvent.press(screen.getByText('Готово'));
    expect(actions.confirmTimePicker).toHaveBeenCalledTimes(1);
  });

  it('ignores synthetic wheel events while a quick action cancels momentum', () => {
    const onPick = jest.fn();
    const ref = React.createRef<WheelColumnHandle>();
    const screen = render(
      <WheelColumn
        ref={ref}
        accessibilityLabel="Хвилини"
        testID="standalone-minute-wheel"
        values={Array.from({ length: 60 }, (_, value) => value)}
        selectedValue={15}
        onPick={onPick}
      />,
    );

    act(() => ref.current?.syncToValue(45));
    fireEvent.scroll(screen.getByTestId('standalone-minute-wheel'), {
      nativeEvent: {
        contentOffset: { x: 0, y: (4 * 60 + 31) * 48 },
        contentSize: { width: 96, height: 9 * 60 * 48 + 192 },
        layoutMeasurement: { width: 96, height: 240 },
      },
    });

    expect(onPick).not.toHaveBeenCalled();
  });
});
