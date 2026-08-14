import type { Query } from '@tanstack/react-query';

export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
export const QUERY_STALE_TIME = 5 * 60 * 1000;
export const QUERY_CACHE_BUSTER = 'local-mug-customer-v1';
export const QUERY_CACHE_STORAGE_KEY = 'local-mug-query-cache';

export type LocalMugQueryMeta = Record<string, unknown> & {
  persist?: boolean;
  accountScoped?: boolean;
  accountId?: string;
};

export function shouldPersistQuery(query: Query) {
  const meta = query.meta as LocalMugQueryMeta | undefined;
  return query.state.status === 'success' && meta?.persist === true;
}

export function shouldRemoveForAccount(query: Query, accountId: string | null) {
  const meta = query.meta as LocalMugQueryMeta | undefined;
  return meta?.accountScoped === true && (!accountId || meta.accountId !== accountId);
}

export function requireOnline(isOnline: boolean) {
  if (!isOnline) throw new Error('Connect to the internet to make changes.');
}
