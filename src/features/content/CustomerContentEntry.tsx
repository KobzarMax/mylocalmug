import React, { useEffect, useState } from 'react';
import { ContentDetailScreen } from './components/ContentDetailScreen';
import { CustomerContentFeed } from './components/CustomerContentFeed';
import { ContentError, ContentLoading } from './components/ContentUI';
import { useContentDetail, usePublicContentFeed } from './hooks';
import { FeedFilter } from './types';

export function CustomerContentEntry({ initialContentId, onInitialContentHandled }: { initialContentId?: string | null; onInitialContentHandled?: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(initialContentId ?? null);
  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null);
  const [followedOnly, setFollowedOnly] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const feed = usePublicContentFeed(business ? false : followedOnly, filter, business?.id);
  const detail = useContentDetail(selectedId);

  useEffect(() => {
    if (!initialContentId) return;
    setSelectedId(initialContentId);
    onInitialContentHandled?.();
  }, [initialContentId, onInitialContentHandled]);

  if (selectedId) {
    if (detail.loading) return <ContentLoading label="Opening story…" />;
    if (detail.error || !detail.item) return <ContentError message={detail.error ?? 'Story not found.'} onRetry={detail.refresh} onBack={() => setSelectedId(null)} />;
    return <ContentDetailScreen item={detail.item} onBack={() => setSelectedId(null)} onMoreFromBusiness={(id, name) => { setBusiness({ id, name }); setSelectedId(null); }} />;
  }
  return <CustomerContentFeed
    items={feed.items} loading={feed.loading} loadingMore={feed.loadingMore} error={feed.error}
    followedOnly={followedOnly} filter={filter} businessName={business?.name}
    hasMore={feed.hasMore} onSetFollowedOnly={setFollowedOnly} onSetFilter={setFilter}
    onOpen={setSelectedId} onRetry={feed.refresh} onLoadMore={feed.loadMore}
    onBackFromBusiness={business ? () => setBusiness(null) : undefined}
  />;
}
