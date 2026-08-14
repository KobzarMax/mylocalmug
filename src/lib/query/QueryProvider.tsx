import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient, useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
  QUERY_CACHE_STORAGE_KEY,
  QUERY_STALE_TIME,
  shouldPersistQuery,
  shouldRemoveForAccount,
} from './config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_MAX_AGE,
      retry: 1,
      refetchOnReconnect: true,
    },
    mutations: { retry: false },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_STORAGE_KEY,
  throttleTime: 1_000,
});

onlineManager.setOnline(false);
const NetworkContext = createContext({ isOnline: false, isOffline: true });

export function LocalQueryProvider({ children }: PropsWithChildren) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const update = (connected: boolean) => {
      setIsOnline(connected);
      onlineManager.setOnline(connected);
    };
    void NetInfo.fetch().then((state) => update(Boolean(state.isConnected && state.isInternetReachable !== false)));
    return NetInfo.addEventListener((state) => update(Boolean(state.isConnected && state.isInternetReachable !== false)));
  }, []);

  useEffect(() => {
    const onChange = (status: AppStateStatus) => focusManager.setFocused(status === 'active');
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  return <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: QUERY_CACHE_MAX_AGE,
      buster: QUERY_CACHE_BUSTER,
      dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
    }}
  >
    <NetworkContext.Provider value={{ isOnline, isOffline: !isOnline }}>{children}</NetworkContext.Provider>
  </PersistQueryClientProvider>;
}

export function useNetworkStatus() {
  return useContext(NetworkContext);
}

export function useAccountCacheBoundary(accountId: string | null) {
  const client = useQueryClient();
  const isRestoring = useIsRestoring();
  useEffect(() => {
    if (isRestoring) return;
    client.removeQueries({ predicate: (query) => shouldRemoveForAccount(query, accountId) });
  }, [accountId, client, isRestoring]);
}
