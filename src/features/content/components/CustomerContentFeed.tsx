import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentItem, FeedFilter } from '../types';
import { ContentCard } from './ContentCard';
import { ContentError, ContentLoading, EmptyContent } from './ContentUI';

export function CustomerContentFeed(props: {
  items: ContentItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
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
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <Text style={styles.overline}>{props.businessName ? 'Coffee shop stories' : 'From local coffee shops'}</Text>
    <View style={styles.row}><Text style={styles.title}>{props.businessName ?? 'Local stories'}</Text>{props.onBackFromBusiness && <Pressable onPress={props.onBackFromBusiness} style={styles.chip}><Text style={styles.chipText}>Back</Text></Pressable>}</View>
    {!props.businessName && <View style={styles.actions}>
      <Pressable onPress={() => props.onSetFollowedOnly(true)} style={[styles.chip, { flex: 1 }, props.followedOnly && styles.chipActive]}><Text style={[styles.chipText, props.followedOnly && styles.chipTextActive]}>Following</Text></Pressable>
      <Pressable onPress={() => props.onSetFollowedOnly(false)} style={[styles.chip, { flex: 1 }, !props.followedOnly && styles.chipActive]}><Text style={[styles.chipText, !props.followedOnly && styles.chipTextActive]}>Discover</Text></Pressable>
    </View>}
    <View style={[styles.wrap, { marginBottom: 14 }]}>{(['all', 'news', 'event'] as FeedFilter[]).map((value) => <Pressable key={value} onPress={() => props.onSetFilter(value)} style={[styles.chip, props.filter === value && styles.chipActive]}><Text style={[styles.chipText, props.filter === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View>
    {props.loading ? <ContentLoading /> : props.error ? <ContentError message={props.error} onRetry={props.onRetry} /> : !props.items.length ? <EmptyContent title={props.followedOnly ? 'No stories from followed shops' : 'No published stories yet'} message={props.followedOnly ? 'Follow a coffee shop from a story to see its updates here.' : 'Published news and events will appear here.'} action={props.followedOnly ? 'Browse all stories' : undefined} onAction={props.followedOnly ? () => props.onSetFollowedOnly(false) : undefined} /> : <>
      {props.items.map((item) => <ContentCard key={item.id} item={item} onPress={() => props.onOpen(item.id)} />)}
      {props.hasMore && <Pressable disabled={props.loadingMore} onPress={props.onLoadMore} style={styles.loadMore}>{props.loadingMore ? <ActivityIndicator color={palette.green} /> : <Text style={styles.secondaryText}>Load more stories</Text>}</Pressable>}
    </>}
  </ScrollView>;
}

