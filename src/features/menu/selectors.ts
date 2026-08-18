import { useMemo } from 'react';

import { MenuItem } from './types';

export function useItemsByCategory(items: MenuItem[]) {
  return useMemo(() => {
    const grouped = new Map<string | null, MenuItem[]>();
    items.forEach((item) => grouped.set(item.categoryId, [...(grouped.get(item.categoryId) ?? []), item]));
    return grouped;
  }, [items]);
}
