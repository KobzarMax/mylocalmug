import { fireEvent, render, screen } from '@testing-library/react-native';

import { CategoryEditorCard } from '../components/CategoryEditorCard';

const baseProps = {
  editing: false,
  name: 'Coffee',
  iconKey: 'coffee' as const,
  exactMatch: null,
  similarMatches: [],
  similarConfirmed: false,
  checking: false,
  checkFailed: false,
  busy: false,
  error: null,
  onNameChange: jest.fn(),
  onIconChange: jest.fn(),
  onConfirmSimilar: jest.fn(),
  onRetryCheck: jest.fn(),
  onSave: jest.fn(),
  onCancel: jest.fn(),
};

describe('CategoryEditorCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('blocks an exact duplicate', async () => {
    await render(
      <CategoryEditorCard
        {...baseProps}
        exactMatch={{ categoryId: 'coffee-id', categoryName: 'Coffee', kind: 'exact', score: 1 }}
      />,
    );

    expect(screen.getByText(/already exists/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create category' })).toBeDisabled();
  });

  it('requires explicit confirmation for a similar name', async () => {
    const confirm = jest.fn();
    await render(
      <CategoryEditorCard
        {...baseProps}
        name="Coffees"
        onConfirmSimilar={confirm}
        similarMatches={[{ categoryId: 'coffee-id', categoryName: 'Coffee', kind: 'similar', score: 0.8 }]}
      />,
    );

    expect(screen.getAllByText('Coffee').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Create category' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Use this name anyway' }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('allows saving after the similar name was confirmed', async () => {
    await render(
      <CategoryEditorCard
        {...baseProps}
        name="Coffees"
        similarConfirmed
        similarMatches={[{ categoryId: 'coffee-id', categoryName: 'Coffee', kind: 'similar', score: 0.8 }]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Create category' })).toBeEnabled();
  });

  it('blocks saving and offers retry when the name check fails', async () => {
    const retry = jest.fn();
    await render(
      <CategoryEditorCard
        {...baseProps}
        checkFailed
        error="Could not check this category name."
        onRetryCheck={retry}
      />,
    );

    expect(screen.getByRole('button', { name: 'Create category' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Try name check again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('exposes an accessible icon choice without changing the category name', async () => {
    const changeIcon = jest.fn();
    await render(<CategoryEditorCard {...baseProps} onIconChange={changeIcon} />);

    expect(screen.getByRole('radio', { name: 'Coffee icon' }).props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'Sandwich icon' }));
    expect(changeIcon).toHaveBeenCalledWith('sandwich');
    expect(baseProps.onNameChange).not.toHaveBeenCalled();
  });
});
