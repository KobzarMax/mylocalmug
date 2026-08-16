import {
  useInfiniteQuery,
  useIsRestoring,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';

import { useNetworkStatus } from '../../lib/query/QueryProvider';
import { requireOnline } from '../../lib/query/config';

import {
  followBusiness,
  getFollowState,
  getPublicContentDetail,
  getPublicContentPage,
  registerPushDevice,
  setBusinessEventAlerts,
  unfollowBusiness,
} from './api';
import { registerForEventNotifications } from './device';
import { messageFrom } from './errors';
import { ContentCursor, FeedFilter } from './types';

export const contentKeys = {
  all: ['content'] as const,
  feeds: () => [...contentKeys.all, 'feed'] as const,
  feed: (accountId: string, followedOnly: boolean, filter: FeedFilter, businessId: string | null) =>
    [...contentKeys.feeds(), followedOnly ? accountId : 'public', followedOnly, filter, businessId] as const,
  detail: (contentId: string) => [...contentKeys.all, 'detail', contentId] as const,
  follow: (accountId: string, businessId: string) =>
    [...contentKeys.all, 'follow', accountId, businessId] as const,
};

export function usePublicContentFeed(
  accountId: string,
  followedOnly: boolean,
  filter: FeedFilter,
  businessId?: string | null,
) {
  const query = useInfiniteQuery({
    queryKey: contentKeys.feed(accountId, followedOnly, filter, businessId ?? null),
    queryFn: ({ pageParam }) =>
      getPublicContentPage({
        businessId,
        kind: filter === 'all' ? null : filter,
        followedOnly,
        cursor: pageParam,
      }),
    initialPageParam: null as ContentCursor | null,
    getNextPageParam: (page) => page.nextCursor,
    maxPages: 2,
    meta: { persist: true, accountScoped: followedOnly, accountId: followedOnly ? accountId : undefined },
  });
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();
  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    loading: query.isLoading || isRestoring,
    loadingMore: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    hasMore: Boolean(query.hasNextPage),
    isOnline,
    isOffline: !isOnline,
    isRestoring,
    isFromCache: !isOnline && query.dataUpdatedAt > 0,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh: query.refetch,
    loadMore: query.fetchNextPage,
  };
}

export function useContentDetail(contentId: string | null) {
  const query = useQuery({
    queryKey: contentKeys.detail(contentId ?? 'none'),
    queryFn: () => getPublicContentDetail(contentId as string),
    enabled: Boolean(contentId),
    meta: { persist: true },
  });
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();
  return {
    item: query.data ?? null,
    loading: query.isLoading || isRestoring,
    error:
      query.error?.message ??
      (query.data === null && !query.isLoading
        ? 'This story is unavailable or has not been published.'
        : null),
    isOnline,
    isOffline: !isOnline,
    isRestoring,
    isFromCache: !isOnline && query.dataUpdatedAt > 0,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh: query.refetch,
  };
}

export function useBusinessFollow(accountId: string, businessId: string) {
  const client = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [notice, setNotice] = useState<string | null>(null);
  const state = useQuery({
    queryKey: contentKeys.follow(accountId, businessId),
    queryFn: () => getFollowState(businessId),
    meta: { persist: true, accountScoped: true, accountId },
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: contentKeys.follow(accountId, businessId) }),
      client.invalidateQueries({ queryKey: contentKeys.feeds() }),
    ]);
  };
  const enableDevice = async () => {
    const registration = await registerForEventNotifications(true);
    if (!registration) return setNotice('Following is saved, but device notifications are disabled.');
    await registerPushDevice(registration.token, registration.platform);
    setNotice('Event alerts are enabled for this device.');
  };
  const followMutation = useMutation({
    mutationFn: async () => {
      requireOnline(isOnline);
      await followBusiness(businessId);
    },
    onSuccess: refresh,
  });
  const alertsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      requireOnline(isOnline);
      await setBusinessEventAlerts(businessId, enabled);
    },
    onSuccess: refresh,
  });
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      requireOnline(isOnline);
      await unfollowBusiness(businessId);
    },
    onSuccess: refresh,
  });

  const follow = async () => {
    setNotice(null);
    await followMutation.mutateAsync();
    await enableDevice().catch((caught) =>
      setNotice(messageFrom(caught, 'Followed, but notifications could not be enabled.')),
    );
  };
  const setAlerts = async (enabled: boolean) => {
    setNotice(null);
    await alertsMutation.mutateAsync(enabled);
    if (enabled)
      await enableDevice().catch((caught) =>
        setNotice(messageFrom(caught, 'Alerts are saved, but this device is not registered.')),
      );
  };
  return {
    following: state.data?.following ?? false,
    eventNotificationsEnabled: state.data?.eventNotificationsEnabled ?? false,
    loading: state.isLoading,
    busy: followMutation.isPending || alertsMutation.isPending || unfollowMutation.isPending,
    isOnline,
    notice,
    follow,
    setAlerts,
    unfollow: () => unfollowMutation.mutateAsync(),
  };
}
