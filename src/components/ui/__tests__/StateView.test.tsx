import { fireEvent, render, screen } from '@testing-library/react-native';

import { StateView } from '../StateView';

describe('StateView', () => {
  it('renders an actionable error state', async () => {
    const retry = jest.fn();
    await render(
      <StateView kind="error" message="Check your connection." onRetry={retry} title="Could not load" />,
    );
    expect(screen.getByRole('header', { name: 'Could not load' })).toBeOnTheScreen();
    expect(screen.getByText('Check your connection.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
