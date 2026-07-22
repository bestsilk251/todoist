import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PeriodSelector from '../PeriodSelector';

describe('PeriodSelector', () => {
  it('opens an adaptive calendar sheet and applies a preset', () => {
    const onPreset = jest.fn();
    const screen = render(
      <PeriodSelector
        range={{ from: '2026-07-16', to: '2026-07-22' }}
        preset="week"
        maxDate="2026-07-22"
        disableNext
        onPreset={onPreset}
        onShift={jest.fn()}
        onCustomRange={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('Вибрати період'));
    expect(screen.getByText('Оберіть період')).toBeTruthy();
    expect(screen.getByText(/липень 2026/i)).toBeTruthy();

    fireEvent.press(screen.getByText('30 днів'));
    fireEvent.press(screen.getByText('Застосувати'));
    expect(onPreset).toHaveBeenCalledWith('30days');
  });
});
