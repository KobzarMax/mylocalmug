import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { archiveContent, cancelEvent, deleteDraft, getBusinessContent, registerPushDevice } from './api';
import { addEventToCalendar, registerForEventNotifications } from './device';
import { messageFrom } from './errors';
import { removeContentCover } from './media';
import { ContentDetail, ContentFilter, ContentItem, publicationStateOf } from './types';
import { cancellationReasonSchema } from './validation';

export function useBusinessContent(businessId: string, businessName: string) {
  const queryKey = ['business-content', businessId] as const;
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => getBusinessContent(businessId, businessName),
    meta: { persist: false },
  });
  const mutation = useMutation({
    mutationFn: (action: () => Promise<void>) => action(),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const mutate = async (action: () => Promise<void>) => {
    try {
      await mutation.mutateAsync(action);
    } catch (caught) {
      const message = messageFrom(caught, 'Could not update this content.');
      throw new Error(message);
    }
  };

  const archive = (item: ContentItem) => mutate(() => archiveContent(item.id));
  const removeDraft = (item: ContentItem) =>
    mutate(async () => {
      const path = await deleteDraft(item.id);
      await removeContentCover(businessId, item.id, path).catch(() => undefined);
    });
  const cancel = (item: ContentItem, reason: string) =>
    mutate(() => cancelEvent(item.id, cancellationReasonSchema.parse(reason)));

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    busy: mutation.isPending,
    error: query.error
      ? messageFrom(query.error, 'Could not load news and events.')
      : mutation.error
        ? messageFrom(mutation.error, 'Could not update this content.')
        : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    archive,
    removeDraft,
    cancel,
  };
}

export function filterBusinessContent(items: ContentItem[], filter: ContentFilter) {
  if (filter === 'all') return items;
  if (filter === 'news' || filter === 'event') return items.filter((item) => item.kind === filter);
  if (filter === 'cancelled') return items.filter((item) => Boolean(item.eventCancelledAt));
  return items.filter((item) => publicationStateOf(item) === filter);
}

export function useEventCalendar(item: ContentDetail) {
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      await addEventToCalendar(item);
    } finally {
      setBusy(false);
    }
  };
  return { busy, add };
}

export function usePushDeviceRefresh(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void registerForEventNotifications(false)
      .then((registration) => {
        if (registration) return registerPushDevice(registration.token, registration.platform);
      })
      .catch(() => undefined);
  }, [enabled]);
}

export { useBusinessFollow, useContentDetail, usePublicContentFeed } from './customerHooks';
