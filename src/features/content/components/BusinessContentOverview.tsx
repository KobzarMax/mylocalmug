import React, { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { filterBusinessContent } from '../hooks';
import { styles } from '../styles';
import { ContentFilter, ContentItem, publicationStateOf } from '../types';
import { ContentCard } from './ContentCard';
import { ContentError, ContentHeader, ContentLoading, EmptyContent } from './ContentUI';

const filters: ContentFilter[] = ['all', 'news', 'event', 'draft', 'scheduled', 'published', 'cancelled', 'archived'];

export function BusinessContentOverview(props: {
  items: ContentItem[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
  onCreate: (kind: 'news' | 'event') => void;
  onEdit: (item: ContentItem) => void;
  onArchive: (item: ContentItem) => Promise<void>;
  onDelete: (item: ContentItem) => Promise<void>;
  onCancel: (item: ContentItem) => void;
}) {
  const [filter, setFilter] = useState<ContentFilter>('all');
  const visible = useMemo(() => filterBusinessContent(props.items, filter), [filter, props.items]);
  const confirm = (title: string, message: string, action: () => Promise<void>) => Alert.alert(title, message, [
    { text: 'Keep', style: 'cancel' },
    { text: 'Continue', style: 'destructive', onPress: () => action().catch((caught) => Alert.alert('Could not update content', caught instanceof Error ? caught.message : 'Please try again.')) },
  ]);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <ContentHeader title="News & events" onBack={props.onBack} />
    <Text style={styles.overline}>Content studio</Text><Text style={styles.title}>Tell your local story</Text>
    <Text style={styles.intro}>Publish shop news and dated events for customers who follow your business.</Text>
    <View style={styles.actions}>
      <Pressable disabled={props.busy} onPress={() => props.onCreate('news')} style={styles.primaryButton}><Ionicons name="newspaper-outline" size={18} color={palette.paper} /><Text style={styles.primaryText}>New story</Text></Pressable>
      <Pressable disabled={props.busy} onPress={() => props.onCreate('event')} style={styles.secondaryButton}><Ionicons name="calendar-outline" size={18} color={palette.green} /><Text style={styles.secondaryText}>New event</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipActive]}><Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</ScrollView>
    {props.loading ? <ContentLoading label="Loading business content…" /> : props.error ? <ContentError message={props.error} onRetry={props.onRetry} /> : !visible.length ? <EmptyContent title="Nothing here yet" message={filter === 'all' ? 'Create your first story or event.' : `No ${filter} content matches this filter.`} /> : visible.map((item) => <View key={item.id}>
      <ContentCard item={item} management onPress={() => props.onEdit(item)} />
      <View style={styles.actions}>
        <Pressable disabled={props.busy} onPress={() => props.onEdit(item)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Edit</Text></Pressable>
        {item.kind === 'event' && item.publishedAt && !item.eventCancelledAt && <Pressable disabled={props.busy} onPress={() => props.onCancel(item)} style={[styles.secondaryButton, styles.warningButton]}><Text style={[styles.secondaryText, styles.warningText]}>Cancel event</Text></Pressable>}
        {publicationStateOf(item) === 'draft'
          ? <Pressable disabled={props.busy} onPress={() => confirm('Delete draft?', 'This draft and its cover image will be removed.', () => props.onDelete(item))} style={[styles.secondaryButton, styles.warningButton]}><Text style={[styles.secondaryText, styles.warningText]}>Delete</Text></Pressable>
          : publicationStateOf(item) !== 'archived' && <Pressable disabled={props.busy} onPress={() => confirm('Archive content?', 'Customers will no longer see it.', () => props.onArchive(item))} style={[styles.secondaryButton, styles.warningButton]}><Text style={[styles.secondaryText, styles.warningText]}>Archive</Text></Pressable>}
      </View>
    </View>)}
  </ScrollView></SafeAreaView>;
}

