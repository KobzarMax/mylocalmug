import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyMenu } from '../components/EmptyMenu';

describe('EmptyMenu', () => {
  it('offers editable starter categories and a custom category path', async () => {
    const addDefaults = jest.fn();
    const addCategory = jest.fn();
    await render(<EmptyMenu busy={false} onAddDefaults={addDefaults} onAddCategory={addCategory} />);

    expect(screen.getByText(/editable café starter categories/i)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add editable starter menu categories' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Create a custom menu category' }));
    expect(addDefaults).toHaveBeenCalledTimes(1);
    expect(addCategory).toHaveBeenCalledTimes(1);
  });

  it('disables both actions while starter categories are being added', async () => {
    await render(<EmptyMenu busy onAddDefaults={jest.fn()} onAddCategory={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Add editable starter menu categories' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create a custom menu category' })).toBeDisabled();
  });
});
