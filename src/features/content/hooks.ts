import { useCallback, useEffect, useState } from 'react';
import {
  archiveContent,
  cancelEvent,
  deleteDraft,
  getBusinessContent,
  registerPushDevice,
} from './api';
import { addEventToCalendar, registerForEventNotifications } from './device';
import { removeContentCover } from './media';
import { ContentDetail, ContentFilter, ContentItem, publicationStateOf } from './types';
import { cancellationReasonSchema } from './validation';
import { messageFrom } from './errors';

export function useBusinessContent(businessId: string, businessName: string) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setItems(await getBusinessContent(businessId, businessName)); }
    catch (caught) { setError(messageFrom(caught, 'Could not load news and events.')); }
    finally { setLoading(false); }
  }, [businessId, businessName]);

  useEffect(() => { refresh(); }, [refresh]);

  const mutate = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await action(); await refresh(); }
    catch (caught) {
      const message = messageFrom(caught, 'Could not update this content.');
      setError(message);
      throw new Error(message);
    } finally { setBusy(false); }
  };

  const archive = (item: ContentItem) => mutate(() => archiveContent(item.id));
  const removeDraft = (item: ContentItem) => mutate(async () => {
    const path = await deleteDraft(item.id);
    await removeContentCover(businessId, item.id, path).catch(() => undefined);
  });
  const cancel = (item: ContentItem, reason: string) => mutate(
    () => cancelEvent(item.id, cancellationReasonSchema.parse(reason)),
  );

  return { items, loading, busy, error, refresh, archive, removeDraft, cancel };
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
    try { await addEventToCalendar(item); }
    finally { setBusy(false); }
  };
  return { busy, add };
}

export function usePushDeviceRefresh(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void registerForEventNotifications(false).then((registration) => {
      if (registration) return registerPushDevice(registration.token, registration.platform);
    }).catch(() => undefined);
  }, [enabled]);
}

export { useBusinessFollow, useContentDetail, usePublicContentFeed } from './customerHooks';
