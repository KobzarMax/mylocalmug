import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { CachedImage } from '../../../components/CachedImage';
import { OfflineNotice } from '../../../components/OfflineNotice';
import { resolveBusinessTheme } from '../../branding/theme';
import { useBusinessFollow, useEventCalendar } from '../hooks';
import { styles } from '../styles';
import { ContentDetail } from '../types';

import { formatEventDate } from './ContentCard';
import { RichTextReader } from './RichTextField';

export function ContentDetailScreen({
  accountId,
  item,
  isOnline,
  dataUpdatedAt,
  onBack,
  onMoreFromBusiness,
}: {
  accountId: string;
  item: ContentDetail;
  isOnline: boolean;
  dataUpdatedAt: number;
  onBack: () => void;
  onMoreFromBusiness: (businessId: string, businessName: string) => void;
}) {
  const follow = useBusinessFollow(accountId, item.businessId);
  const theme = resolveBusinessTheme(item.brandPalette);
  const calendar = useEventCalendar(item);
  const addToCalendar = () =>
    calendar
      .add()
      .catch((caught) =>
        Alert.alert(
          'Could not open calendar',
          caught instanceof Error ? caught.message : 'Please try again.',
        ),
      );
  const run = (action: () => Promise<void>) =>
    action().catch((caught) =>
      Alert.alert(
        'Could not update following',
        caught instanceof Error ? caught.message : 'Please try again.',
      ),
    );
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 48, backgroundColor: theme.background }}
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      {(item.coverPath || item.coverUrl) && (
        <CachedImage
          uri={item.coverUrl}
          cacheKey={item.coverPath ?? item.coverUrl ?? item.id}
          style={styles.detailHero}
          accessibilityLabel={`${item.title} cover`}
        />
      )}
      <View style={[styles.detailBody, { backgroundColor: theme.background }]}>
        <OfflineNotice isOnline={isOnline} updatedAt={dataUpdatedAt} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={21} color={theme.primary} />
        </Pressable>
        <Text style={[styles.overline, { color: theme.accent }]}>
          {item.kind}
          {item.isPinned ? ' · pinned' : ''}
        </Text>
        <Text style={[styles.detailTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>
          By {item.authorDisplayName} for {item.businessName}
        </Text>
        <Text style={[styles.excerpt, { color: theme.mutedText }]}>{item.excerpt}</Text>
        {item.eventCancelledAt && (
          <View style={styles.cancellation}>
            <Text style={styles.cancellationTitle}>Event cancelled</Text>
            <Text style={styles.cancellationText}>{item.eventCancellationReason}</Text>
          </View>
        )}
        {item.kind === 'event' && item.eventStartsAt && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {formatEventDate(item.eventStartsAt, item.eventAllDay, item.eventTimezone)}
            </Text>
            {item.eventEndsAt && (
              <Text style={[styles.meta, { color: theme.mutedText }]}>
                Ends {formatEventDate(item.eventEndsAt, item.eventAllDay, item.eventTimezone)}
              </Text>
            )}
            <Text style={[styles.excerpt, { color: theme.mutedText }]}>
              {[item.eventVenueName, item.eventVenueAddress].filter(Boolean).join(' · ') ||
                'Venue to be confirmed'}
            </Text>
            {!item.eventCancelledAt && (
              <Pressable
                accessibilityRole="button"
                disabled={calendar.busy}
                onPress={addToCalendar}
                style={[styles.secondaryButton, { marginTop: 14 }, calendar.busy && styles.disabled]}
              >
                {calendar.busy ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    <Text style={[styles.secondaryText, { color: theme.primary }]}>Add to calendar</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
        <RichTextReader document={item.bodyDocument} theme={theme} />
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.businessName}</Text>
          {follow.loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : follow.following ? (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={[styles.switchTitle, { color: theme.text }]}>Event alerts</Text>
                  <Text style={[styles.switchHint, { color: theme.mutedText }]}>
                    Receive reminders, updates, and cancellations from this shop.
                  </Text>
                </View>
                <Switch
                  disabled={follow.busy || !follow.isOnline}
                  value={follow.eventNotificationsEnabled}
                  onValueChange={(value) => run(() => follow.setAlerts(value))}
                  trackColor={{ false: theme.border, true: theme.primarySoft }}
                  thumbColor={follow.eventNotificationsEnabled ? theme.primary : theme.mutedText}
                />
              </View>
              <View style={[styles.actions, { marginTop: 12 }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onMoreFromBusiness(item.businessId, item.businessName)}
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>
                    More from this shop
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={follow.busy || !follow.isOnline}
                  onPress={() => run(follow.unfollow)}
                  style={[styles.secondaryButton, styles.warningButton, !follow.isOnline && styles.disabled]}
                >
                  <Text style={[styles.secondaryText, styles.warningText]}>Unfollow</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={follow.busy || !follow.isOnline}
              onPress={() => run(follow.follow)}
              style={[
                styles.primaryButton,
                { marginTop: 12, backgroundColor: theme.primary },
                !follow.isOnline && styles.disabled,
              ]}
            >
              {follow.busy ? (
                <ActivityIndicator color={theme.primaryForeground} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={theme.primaryForeground} />
                  <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>
                    {follow.isOnline ? 'Follow shop and enable alerts' : 'Reconnect to follow this shop'}
                  </Text>
                </>
              )}
            </Pressable>
          )}
          {follow.notice && <Text style={[styles.meta, { color: theme.mutedText }]}>{follow.notice}</Text>}
        </View>
      </View>
    </ScrollView>
  );
}
