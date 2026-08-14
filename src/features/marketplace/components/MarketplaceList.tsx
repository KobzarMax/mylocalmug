import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { PublicBusinessSummary } from '../types';
import { BusinessCard } from './BusinessCard';

export function MarketplaceList({ items, loading, error, isOnline, hasMore, loadingMore, onOpen, onRetry, onLoadMore }: {
  items: PublicBusinessSummary[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onOpen: (businessId: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}) {
  if (loading && !items.length) return <State icon="hourglass-outline" title="Loading coffee shops…" />;
  if (!items.length && !isOnline) return <State icon="cloud-offline-outline" title="No saved coffee shops" text="Connect to the internet and browse shops once to keep them available offline." />;
  if (error && !items.length) return <State icon="alert-circle-outline" title="Could not load coffee shops" text={error} action="Try again" onAction={onRetry} />;
  if (!items.length) return <State icon="cafe-outline" title="No coffee shops found" text="Try a different shop, category, or menu item." />;
  return <>{items.map((business) => <BusinessCard key={business.id} business={business} onPress={() => onOpen(business.id)} />)}
    {hasMore && <Pressable disabled={loadingMore || !isOnline} onPress={onLoadMore} style={styles.loadMore}>{loadingMore ? <ActivityIndicator color={palette.green} /> : <Text style={styles.link}>{isOnline ? 'Load more' : 'Reconnect to load more'}</Text>}</Pressable>}
  </>;
}

function State({ icon, title, text, action, onAction }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; text?: string; action?: string; onAction?: () => void }) {
  return <View style={styles.stateCard}><Ionicons name={icon} size={28} color={palette.green} /><Text style={styles.stateTitle}>{title}</Text>{text && <Text style={styles.stateText}>{text}</Text>}{action && <Pressable onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable>}</View>;
}
