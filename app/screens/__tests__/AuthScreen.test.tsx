import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AuthScreen from '../AuthScreen';
import { USAGE_GUIDE_PENDING_METADATA_KEY } from '../../lib/usageGuide';

const mockSignUp = jest.fn();

jest.mock('../../lib/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: mockSignUp,
    },
  }),
}));

describe('AuthScreen registration', () => {
  beforeEach(() => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: 'test' } }, error: null });
  });

  it('marks a newly created account for its first usage-guide display', async () => {
    const screen = render(<AuthScreen />);

    fireEvent.press(screen.getByTestId('auth-toggle'));
    fireEvent.changeText(screen.getByTestId('auth-email'), 'new@example.com');
    fireEvent.changeText(screen.getByTestId('auth-password'), 'strong-password');
    fireEvent.press(screen.getByTestId('auth-submit'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'strong-password',
        options: {
          data: { [USAGE_GUIDE_PENDING_METADATA_KEY]: true },
        },
      });
    });
  });
});
