import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { OfflineNotice } from '../../../components/OfflineNotice';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentSummary, FeedFilter } from '../types';

import { ContentCard } from './ContentCard';
import { ContentError, ContentLoading, EmptyContent } from './ContentUI';

export function CustomerContentFeed(props: {
  items: ContentSummary[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  isOnline: boolean;
  dataUpdatedAt: number;
  followedOnly: boolean;
  filter: FeedFilter;
  businessName?: string | null;
  hasMore: boolean;
  onSetFollowedOnly: (value: boolean) => void;
  onSetFilter: (value: FeedFilter) => void;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onBackFromBusiness?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.overline}>
        {props.businessName ? 'Coffee shop stories' : 'From local coffee shops'}
      </Text>
      <View style={styles.row}>
        <Text style={styles.title}>{props.businessName ?? 'Local stories'}</Text>
        {props.onBackFromBusiness && (
          <Pressable accessibilityRole="button" onPress={props.onBackFromBusiness} style={styles.chip}>
            <Text style={styles.chipText}>Back</Text>
          </Pressable>
        )}
      </View>
      {!props.businessName && (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => props.onSetFollowedOnly(true)}
            style={[styles.chip, { flex: 1 }, props.followedOnly && styles.chipActive]}
          >
            <Text style={[styles.chipText, props.followedOnly && styles.chipTextActive]}>Following</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => props.onSetFollowedOnly(false)}
            style={[styles.chip, { flex: 1 }, !props.followedOnly && styles.chipActive]}
          >
            <Text style={[styles.chipText, !props.followedOnly && styles.chipTextActive]}>Discover</Text>
          </Pressable>
        </View>
      )}
      <View style={[styles.wrap, { marginBottom: 14 }]}>
        {(['all', 'news', 'event'] as FeedFilter[]).map((value) => (
          <Pressable
            accessibilityRole="button"
            key={value}
            onPress={() => props.onSetFilter(value)}
            style={[styles.chip, props.filter === value && styles.chipActive]}
          >
            <Text style={[styles.chipText, props.filter === value && styles.chipTextActive]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <OfflineNotice
        isOnline={props.isOnline}
        updatedAt={props.dataUpdatedAt}
        stale={Boolean(props.error && props.items.length)}
      />
      {props.loading && !props.items.length ? (
        <ContentLoading />
      ) : props.error && !props.items.length ? (
        <ContentError
          message={props.isOnline ? props.error : 'These stories were not saved before going offline.'}
          onRetry={props.onRetry}
        />
      ) : !props.items.length ? (
        <EmptyContent
          title={
            props.isOnline
              ? props.followedOnly
                ? 'No stories from followed shops'
                : 'No published stories yet'
              : 'No saved stories'
          }
          message={
            props.isOnline
              ? props.followedOnly
                ? 'Follow a coffee shop from a story to see its updates here.'
                : 'Published news and events will appear here.'
              : 'Connect to the internet and open stories once to keep them available offline.'
          }
          action={props.isOnline && props.followedOnly ? 'Browse all stories' : undefined}
          onAction={props.isOnline && props.followedOnly ? () => props.onSetFollowedOnly(false) : undefined}
        />
      ) : (
        <>
          {props.items.map((item) => (
            <ContentCard key={item.id} item={item} onPress={() => props.onOpen(item.id)} />
          ))}
          {props.hasMore && (
            <Pressable
              accessibilityRole="button"
              disabled={props.loadingMore || !props.isOnline}
              onPress={props.onLoadMore}
              style={styles.loadMore}
            >
              {props.loadingMore ? (
                <ActivityIndicator color={palette.green} />
              ) : (
                <Text style={styles.secondaryText}>
                  {props.isOnline ? 'Load more stories' : 'Reconnect to load more'}
                </Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );
}
