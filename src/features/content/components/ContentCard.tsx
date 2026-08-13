import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentItem, publicationStateOf } from '../types';

export function ContentCard({ item, onPress, management = false }: { item: ContentItem; onPress: () => void; management?: boolean }) {
  const state = publicationStateOf(item);
  const eventMeta = item.kind === 'event' && item.eventStartsAt
    ? formatEventDate(item.eventStartsAt, item.eventAllDay, item.eventTimezone)
    : null;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}>
    {item.coverUrl && <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />}
    <View style={styles.cardBody}>
      <View style={styles.cardTop}>
        {item.businessLogoUrl ? <Image source={{ uri: item.businessLogoUrl }} style={styles.logo} /> : <View style={[styles.logo, styles.logoEmpty]}><Ionicons name="cafe" size={15} color={palette.green} /></View>}
        <Text style={styles.businessName}>{item.businessName}</Text>
        <View style={[styles.badge, (item.eventCancelledAt || state === 'archived') && styles.badgeWarning]}>
          <Text style={styles.badgeText}>{item.eventCancelledAt ? 'cancelled' : management ? state : item.kind}</Text>
        </View>
      </View>
      {item.isPinned && <Text style={styles.overline}>Pinned {item.kind}</Text>}
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.excerpt} numberOfLines={3}>{item.excerpt}</Text>
      <Text style={styles.meta}>{eventMeta ?? `${formatDate(item.publishedAt ?? item.updatedAt)} · ${readingMinutes(item.bodyText)} min read`} · By {item.authorDisplayName}</Text>
    </View>
  </Pressable>;
}

export function formatEventDate(value: string, allDay: boolean, timezone: string | null) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    ...(allDay ? {} : { hour: 'numeric', minute: '2-digit' }),
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function readingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200));
}

