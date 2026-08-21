import { fireEvent, render, screen } from '@testing-library/react-native';

import { CategoryManagerRow } from '../components/CategoryManagerRow';

const category = {
  id: 'category-id',
  businessId: 'business-id',
  name: 'Coffee',
  iconKey: 'coffee' as const,
  sortOrder: 0,
};

describe('CategoryManagerRow', () => {
  it('exposes labelled ordering, editing, and deletion actions', async () => {
    const edit = jest.fn();
    const remove = jest.fn();
    await render(
      <CategoryManagerRow busy={false} category={category} itemCount={2} onDelete={remove} onEdit={edit} />,
    );

    expect(screen.getByText('2 items')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Move Coffee/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Edit Coffee' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete Coffee' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
