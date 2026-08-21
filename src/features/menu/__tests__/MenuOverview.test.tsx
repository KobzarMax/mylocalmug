import { fireEvent, render, screen } from '@testing-library/react-native';

import { MenuOverview } from '../components/MenuOverview';

jest.mock('../../../components/CachedImage', () => ({ CachedImage: () => null }));

describe('MenuOverview category navigation', () => {
  it('uses one category-management action and keeps category controls out of the item list', async () => {
    const manage = jest.fn();
    await render(
      <MenuOverview
        busy={false}
        categories={[
          { id: 'coffee-id', businessId: 'business-id', name: 'Coffee', iconKey: 'coffee', sortOrder: 0 },
        ]}
        error={null}
        items={[]}
        loading={false}
        onAddDefaults={jest.fn()}
        onAddItem={jest.fn()}
        onBack={jest.fn()}
        onCreateCategory={jest.fn()}
        onDeleteItem={jest.fn()}
        onEditItem={jest.fn()}
        onManageCategories={manage}
        onRetry={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Manage categories' }));
    expect(manage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Edit category' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete category' })).toBeNull();
  });
});
