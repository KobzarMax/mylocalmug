import { useInfiniteQuery, useIsRestoring, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../lib/query/QueryProvider';
import { getPublicBusinessDetail, getPublicBusinesses, getPublicBusinessMenu } from './api';
import { MarketplaceCursor } from './types';

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  catalog: (search: string) => [...marketplaceKeys.all, 'catalog', search] as const,
  detail: (businessId: string) => [...marketplaceKeys.all, 'detail', businessId] as const,
  menu: (businessId: string) => [...marketplaceKeys.all, 'menu', businessId] as const,
};

const persistedMeta = { persist: true } as const;

export function useMarketplace(search: string) {
  const deferredSearch = useDebouncedValue(search.trim(), 300);
  const query = useInfiniteQuery({
    queryKey: marketplaceKeys.catalog(deferredSearch),
    queryFn: ({ pageParam }) => getPublicBusinesses(deferredSearch, pageParam),
    initialPageParam: null as MarketplaceCursor | null,
    getNextPageParam: (page) => page.nextCursor,
    maxPages: 2,
    meta: persistedMeta,
  });
  return {
    ...useOfflineQueryState(query, query.data?.pages.flatMap((page) => page.items) ?? []),
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

export function usePublicBusiness(businessId: string) {
  const detail = useQuery({
    queryKey: marketplaceKeys.detail(businessId),
    queryFn: () => getPublicBusinessDetail(businessId),
    meta: persistedMeta,
  });
  const menu = useQuery({
    queryKey: marketplaceKeys.menu(businessId),
    queryFn: () => getPublicBusinessMenu(businessId),
    meta: persistedMeta,
  });
  return { detail: useOfflineQueryState(detail, detail.data ?? null), menu: useOfflineQueryState(menu, menu.data ?? null) };
}

function useOfflineQueryState<QueryResult extends { dataUpdatedAt: number; error: Error | null; isFetching: boolean; isLoading: boolean; refetch: () => unknown } , Data>(query: QueryResult, data: Data) {
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();
  return {
    data,
    dataUpdatedAt: query.dataUpdatedAt,
    error: query.error?.message ?? null,
    isFetching: query.isFetching,
    loading: query.isLoading || isRestoring,
    isOnline,
    isOffline: !isOnline,
    isRestoring,
    isFromCache: !isOnline && query.dataUpdatedAt > 0,
    refresh: query.refetch,
  };
}

function useDebouncedValue(value: string, delay: number) {
  const [deferred, setDeferred] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDeferred(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);
  return deferred;
}
