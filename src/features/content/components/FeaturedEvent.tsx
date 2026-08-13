import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { palette } from '../../../lib/design';
import { usePublicContentFeed } from '../hooks';
import { styles } from '../styles';
import { ContentCard } from './ContentCard';

export function FeaturedEvent({ onOpen }: { onOpen: (contentId: string) => void }) {
  const feed = usePublicContentFeed(false, 'event');
  const event = feed.items.find((item) => !item.eventCancelledAt
    && item.eventStartsAt
    && new Date(item.eventStartsAt) > new Date());

  if (feed.loading) return <View style={styles.compactState}><ActivityIndicator color={palette.green} /></View>;
  if (feed.error) return <View style={styles.compactState}>
    <Text style={styles.errorText}>{feed.error}</Text>
    <Pressable accessibilityRole="button" onPress={feed.refresh}><Text style={styles.link}>Try again</Text></Pressable>
  </View>;
  if (!event) return <View style={styles.compactState}><Text style={styles.subtle}>No upcoming local events yet.</Text></View>;
  return <ContentCard item={event} onPress={() => onOpen(event.id)} />;
}
