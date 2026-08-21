import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { useCategoryManager } from '../categoryHooks';

const mockCheckName = jest.fn();

jest.mock('../api', () => ({
  addDefaultMenuCategories: jest.fn(),
  checkMenuCategoryName: (...args: unknown[]) => mockCheckName(...args),
  deleteMenuCategory: jest.fn(),
  getBusinessMenu: jest.fn().mockResolvedValue({
    categories: [
      { id: 'coffee-id', businessId: 'business-id', name: 'Coffee', iconKey: 'coffee', sortOrder: 0 },
    ],
    items: [],
  }),
  reorderMenuCategories: jest.fn(),
  saveMenuCategory: jest.fn(),
}));

describe('useCategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckName.mockImplementation(async (_businessId: string, name: string) => ({
      exact: null,
      similar:
        name === 'Coffees'
          ? [{ categoryId: 'coffee-id', categoryName: 'Coffee', kind: 'similar', score: 0.8 }]
          : [],
    }));
  });

  it('resets similar-name confirmation whenever the proposed name changes', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useCategoryManager('business-id'), { wrapper });

    await waitFor(() => expect(result.current.categories).toHaveLength(1));
    await act(async () => result.current.openEditor('new'));
    await act(async () => result.current.setName('Coffees'));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 300)));
    await waitFor(() => expect(result.current.similarMatches).toHaveLength(1));
    await act(async () => result.current.confirmSimilar());
    expect(result.current.similarConfirmed).toBe(true);

    await act(async () => result.current.setIconKey('sandwich'));
    expect(result.current.similarConfirmed).toBe(true);

    await act(async () => result.current.setName('Coffees and tea'));
    expect(result.current.similarConfirmed).toBe(false);
    unmount();
    queryClient.clear();
  });
});
