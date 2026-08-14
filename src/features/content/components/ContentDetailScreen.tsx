import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../../../components/CachedImage';
import { OfflineNotice } from '../../../components/OfflineNotice';
import { palette } from '../../../lib/design';
import { useBusinessFollow, useEventCalendar } from '../hooks';
import { styles } from '../styles';
import { ContentDetail } from '../types';
import { formatEventDate } from './ContentCard';
import { RichTextReader } from './RichTextField';

export function ContentDetailScreen({ accountId, item, isOnline, dataUpdatedAt, onBack, onMoreFromBusiness }: { accountId: string; item: ContentDetail; isOnline: boolean; dataUpdatedAt: number; onBack: () => void; onMoreFromBusiness: (businessId: string, businessName: string) => void }) {
  const follow = useBusinessFollow(accountId, item.businessId);
  const calendar = useEventCalendar(item);
  const addToCalendar = () => calendar.add().catch((caught) => Alert.alert('Could not open calendar', caught instanceof Error ? caught.message : 'Please try again.'));
  const run = (action: () => Promise<void>) => action().catch((caught) => Alert.alert('Could not update following', caught instanceof Error ? caught.message : 'Please try again.'));
  return <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
    {(item.coverPath || item.coverUrl) && <CachedImage uri={item.coverUrl} cacheKey={item.coverPath ?? item.coverUrl ?? item.id} style={styles.detailHero} accessibilityLabel={`${item.title} cover`} />}
    <View style={styles.detailBody}>
      <OfflineNotice isOnline={isOnline} updatedAt={dataUpdatedAt} />
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color={palette.green} /></Pressable>
      <Text style={styles.overline}>{item.kind}{item.isPinned ? ' · pinned' : ''}</Text>
      <Text style={styles.detailTitle}>{item.title}</Text>
      <Text style={styles.meta}>By {item.authorDisplayName} for {item.businessName}</Text>
      <Text style={styles.excerpt}>{item.excerpt}</Text>
      {item.eventCancelledAt && <View style={styles.cancellation}><Text style={styles.cancellationTitle}>Event cancelled</Text><Text style={styles.cancellationText}>{item.eventCancellationReason}</Text></View>}
      {item.kind === 'event' && item.eventStartsAt && <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>{formatEventDate(item.eventStartsAt, item.eventAllDay, item.eventTimezone)}</Text>
        {item.eventEndsAt && <Text style={styles.meta}>Ends {formatEventDate(item.eventEndsAt, item.eventAllDay, item.eventTimezone)}</Text>}
        <Text style={styles.excerpt}>{[item.eventVenueName, item.eventVenueAddress].filter(Boolean).join(' · ') || 'Venue to be confirmed'}</Text>
        {!item.eventCancelledAt && <Pressable disabled={calendar.busy} onPress={addToCalendar} style={[styles.secondaryButton, { marginTop: 14 }, calendar.busy && styles.disabled]}>{calendar.busy ? <ActivityIndicator color={palette.green} /> : <><Ionicons name="calendar-outline" size={18} color={palette.green} /><Text style={styles.secondaryText}>Add to calendar</Text></>}</Pressable>}
      </View>}
      <RichTextReader document={item.bodyDocument} />
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>{item.businessName}</Text>
        {follow.loading ? <ActivityIndicator color={palette.green} /> : follow.following ? <>
          <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Event alerts</Text><Text style={styles.switchHint}>Receive reminders, updates, and cancellations from this shop.</Text></View><Switch disabled={follow.busy || !follow.isOnline} value={follow.eventNotificationsEnabled} onValueChange={(value) => run(() => follow.setAlerts(value))} trackColor={{ false: '#D7CEC6', true: palette.mint }} thumbColor={follow.eventNotificationsEnabled ? palette.green : palette.muted} /></View>
          <View style={[styles.actions, { marginTop: 12 }]}><Pressable onPress={() => onMoreFromBusiness(item.businessId, item.businessName)} style={styles.primaryButton}><Text style={styles.primaryText}>More from this shop</Text></Pressable><Pressable disabled={follow.busy || !follow.isOnline} onPress={() => run(follow.unfollow)} style={[styles.secondaryButton, styles.warningButton, !follow.isOnline && styles.disabled]}><Text style={[styles.secondaryText, styles.warningText]}>Unfollow</Text></Pressable></View>
        </> : <Pressable disabled={follow.busy || !follow.isOnline} onPress={() => run(follow.follow)} style={[styles.primaryButton, { marginTop: 12 }, !follow.isOnline && styles.disabled]}>{follow.busy ? <ActivityIndicator color={palette.paper} /> : <><Ionicons name="person-add-outline" size={18} color={palette.paper} /><Text style={styles.primaryText}>{follow.isOnline ? 'Follow shop and enable alerts' : 'Reconnect to follow this shop'}</Text></>}</Pressable>}
        {follow.notice && <Text style={styles.meta}>{follow.notice}</Text>}
      </View>
    </View>
  </ScrollView>;
}
