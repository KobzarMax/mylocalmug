import { useCallback, useEffect, useState } from 'react';
import {
  archiveContent,
  cancelEvent,
  deleteDraft,
  getBusinessContent,
  getFollowState,
  getPublicContentPage,
  followBusiness,
  registerPushDevice,
  setBusinessEventAlerts,
  unfollowBusiness,
} from './api';
import { addEventToCalendar, registerForEventNotifications } from './device';
import { removeContentCover } from './media';
import { ContentCursor, ContentDetail, ContentFilter, ContentItem, FeedFilter, publicationStateOf } from './types';
import { cancellationReasonSchema } from './validation';

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

export function usePublicContentFeed(followedOnly: boolean, filter: FeedFilter, businessId?: string | null) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState<ContentCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextCursor: ContentCursor | null, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const page = await getPublicContentPage({
        businessId,
        kind: filter === 'all' ? null : filter,
        followedOnly,
        cursor: nextCursor,
      });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setCursor(page.nextCursor);
    } catch (caught) {
      setError(messageFrom(caught, 'Could not load local stories.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [businessId, filter, followedOnly]);

  useEffect(() => { setCursor(null); void load(null, false); }, [load]);
  return {
    items, loading, loadingMore, error, hasMore: Boolean(cursor),
    refresh: () => load(null, false),
    loadMore: () => cursor ? load(cursor, true) : Promise.resolve(),
  };
}

export function useContentDetail(contentId: string | null) {
  const [item, setItem] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(contentId));
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    try {
      const page = await getPublicContentPage({ postId: contentId, pageSize: 1 });
      setItem(page.items[0] ?? null);
      if (!page.items[0]) setError('This story is unavailable or has not been published.');
    } catch (caught) { setError(messageFrom(caught, 'Could not open this story.')); }
    finally { setLoading(false); }
  }, [contentId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { item, loading, error, refresh };
}

export function useBusinessFollow(businessId: string) {
  const [state, setState] = useState({ following: false, eventNotificationsEnabled: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setState(await getFollowState(businessId)); }
    catch (caught) { setNotice(messageFrom(caught, 'Could not load following settings.')); }
    finally { setLoading(false); }
  }, [businessId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const enableDevice = async () => {
    const registration = await registerForEventNotifications(true);
    if (!registration) {
      setNotice('You are following this shop, but device notifications are disabled.');
      return;
    }
    await registerPushDevice(registration.token, registration.platform);
    setNotice('Event alerts are enabled for this device.');
  };

  const follow = async () => {
    setBusy(true); setNotice(null);
    try {
      await followBusiness(businessId);
      setState({ following: true, eventNotificationsEnabled: true });
      await enableDevice().catch((caught) => setNotice(messageFrom(caught, 'Followed, but notifications could not be enabled.')));
    } finally { setBusy(false); }
  };
  const setAlerts = async (enabled: boolean) => {
    setBusy(true); setNotice(null);
    try {
      await setBusinessEventAlerts(businessId, enabled);
      setState((current) => ({ ...current, eventNotificationsEnabled: enabled }));
      if (enabled) await enableDevice().catch((caught) => setNotice(messageFrom(caught, 'Alerts are saved, but this device is not registered.')));
    } finally { setBusy(false); }
  };
  const unfollow = async () => {
    setBusy(true); setNotice(null);
    try { await unfollowBusiness(businessId); setState({ following: false, eventNotificationsEnabled: false }); }
    finally { setBusy(false); }
  };
  return { ...state, loading, busy, notice, follow, setAlerts, unfollow };
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

export function messageFrom(caught: unknown, fallback: string) {
  if (caught && typeof caught === 'object' && 'message' in caught && typeof caught.message === 'string') {
    return caught.message.replace(/^.*?: /, '') || fallback;
  }
  return fallback;
}
