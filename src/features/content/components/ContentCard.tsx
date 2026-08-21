import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CachedImage } from '../../../components/CachedImage';
import { resolveBusinessTheme } from '../../branding/theme';
import { styles } from '../styles';
import { ContentItem, ContentSummary, publicationStateOf } from '../types';

export function ContentCard({
  item,
  onPress,
  management = false,
}: {
  item: ContentItem | ContentSummary;
  onPress: () => void;
  management?: boolean;
}) {
  const state = publicationStateOf(item);
  const theme = resolveBusinessTheme(management ? undefined : item.brandPalette);
  const eventMeta =
    item.kind === 'event' && item.eventStartsAt
      ? formatEventDate(item.eventStartsAt, item.eventAllDay, item.eventTimezone)
      : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        !management && { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      {(item.coverPath || item.coverUrl) && (
        <CachedImage
          uri={item.coverUrl}
          cacheKey={item.coverPath ?? item.coverUrl ?? item.id}
          style={styles.cardImage}
          accessibilityLabel={`${item.title} cover`}
        />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          {item.businessLogoUrl ? (
            <CachedImage
              uri={item.businessLogoUrl}
              cacheKey={item.businessLogoUrl}
              style={styles.logo}
              accessibilityLabel={`${item.businessName} logo`}
            />
          ) : (
            <View style={[styles.logo, styles.logoEmpty, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="cafe" size={15} color={theme.primary} />
            </View>
          )}
          <Text style={[styles.businessName, { color: theme.text }]}>{item.businessName}</Text>
          <View
            style={[
              styles.badge,
              !item.eventCancelledAt && state !== 'archived' && { backgroundColor: theme.accentSoft },
              (item.eventCancelledAt || state === 'archived') && styles.badgeWarning,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                !item.eventCancelledAt && state !== 'archived' && { color: theme.accent },
              ]}
            >
              {item.eventCancelledAt ? 'cancelled' : management ? state : item.kind}
            </Text>
          </View>
        </View>
        {item.isPinned && <Text style={[styles.overline, { color: theme.primary }]}>Pinned {item.kind}</Text>}
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.excerpt, { color: theme.mutedText }]} numberOfLines={3}>
          {item.excerpt}
        </Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>
          {eventMeta ??
            `${formatDate(item.publishedAt ?? item.updatedAt)} · ${'readingMinutes' in item ? item.readingMinutes : readingMinutes(item.bodyText)} min read`}{' '}
          · By {item.authorDisplayName}
        </Text>
      </View>
    </Pressable>
  );
}

export function formatEventDate(value: string, allDay: boolean, timezone: string | null) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(allDay ? {} : { hour: 'numeric', minute: '2-digit' }),
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );
}

function readingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200));
}
