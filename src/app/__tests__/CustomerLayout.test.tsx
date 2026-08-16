import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import CustomerLayout from '../(customer)/_layout';

const mockUseAccount = jest.fn<unknown, []>();
const mockReact = React;
const mockText = Text;

jest.mock('../../features/auth/AccountProvider', () => ({ useAccount: () => mockUseAccount() }));
jest.mock('expo-router', () => {
  return {
    Redirect: ({ href }: { href: string }) => mockReact.createElement(mockText, null, `redirect:${href}`),
    Stack: () => mockReact.createElement(mockText, null, 'customer-stack'),
  };
});

describe('customer route protection', () => {
  it('redirects signed-out visitors to sign in', async () => {
    mockUseAccount.mockReturnValue({
      loadingSession: false,
      session: null,
      profile: null,
      profileError: null,
    });
    const view = await render(<CustomerLayout />);
    expect(view.getByText('redirect:/sign-in')).toBeOnTheScreen();
  });

  it('renders customer routes for a loaded session', async () => {
    mockUseAccount.mockReturnValue({
      loadingSession: false,
      session: { user: { id: 'customer' } },
      profile: { id: 'customer' },
      profileError: null,
    });
    const view = await render(<CustomerLayout />);
    expect(view.getByText('customer-stack')).toBeOnTheScreen();
  });
});
