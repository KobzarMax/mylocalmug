import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { CachedImage } from '../../../components/CachedImage';
import { OfflineNotice } from '../../../components/OfflineNotice';
import { palette } from '../../../lib/design';
import { usePublicBusiness } from '../hooks';
import { styles } from '../styles';
import { BusinessHours } from './BusinessHours';
import { PublicMenuSection } from './PublicMenuSection';
import { useBusinessFollow, usePublicContentFeed } from '../../content/hooks';
import { ContentCard } from '../../content/components/ContentCard';
import { BasketLine } from '../../ordering/types';
import { CustomerCheckout } from '../../ordering/components/CustomerCheckout';

export function ShopDetailScreen({ accountId, businessId, onBack, onOpenContent }: { accountId: string; businessId: string; onBack: () => void; onOpenContent: (contentId: string) => void }) {
  const { detail, menu } = usePublicBusiness(businessId);
  const stories = usePublicContentFeed(accountId, false, 'all', businessId);
  const follow = useBusinessFollow(accountId, businessId);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [checkout, setCheckout] = useState(false);
  const basketTotal = useMemo(() => basket.reduce((sum, line) => sum + line.unitPricePence * line.quantity, 0), [basket]);
  const updateFollow = () => (follow.following ? follow.unfollow() : follow.follow()).catch((caught) => {
    const message = caught instanceof Error ? caught.message : 'Please try again.';
    Alert.alert('Could not update following', message);
  });
  if (detail.loading && !detail.data) return <SafeAreaView style={styles.safe}><View style={[styles.stateCard, { flex: 1 }]}><Text style={styles.stateTitle}>Opening coffee shop…</Text></View></SafeAreaView>;
  if (!detail.data) return <SafeAreaView style={styles.safe}><View style={[styles.stateCard, { flex: 1 }]}><Ionicons name={detail.isOnline ? 'alert-circle-outline' : 'cloud-offline-outline'} size={28} color={palette.green} /><Text style={styles.stateTitle}>{detail.error ?? 'This shop is not saved for offline reading.'}</Text><Pressable onPress={onBack}><Text style={styles.link}>Go back</Text></Pressable></View></SafeAreaView>;
  const business = detail.data;
  if (checkout) return <CustomerCheckout businessId={business.id} businessName={business.name} location={business.address} basket={basket} onBack={() => setCheckout(false)} onComplete={() => { setBasket([]); setCheckout(false); }} />;
  const addItem = (item: { id: string; name: string; price: number }) => setBasket((current) => {
    const found = current.find((line) => line.menuItemId === item.id);
    return found ? current.map((line) => line.menuItemId === item.id ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line)
      : [...current, { menuItemId: item.id, name: item.name, unitPricePence: Math.round(item.price * 100), quantity: 1 }];
  });
  const image = business.headerUrl ?? business.logoUrl;
  return <SafeAreaView style={styles.safe}><ScrollView showsVerticalScrollIndicator={false}>
    <View><CachedImage uri={image} cacheKey={image ?? `business-${business.id}`} style={styles.hero} accessibilityLabel={`${business.name} cover`} /><View style={styles.heroActions}><Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={palette.ink} /></Pressable><View /></View></View>
    <View style={styles.detailBody}>
      <OfflineNotice isOnline={detail.isOnline} updatedAt={Math.min(detail.dataUpdatedAt || Date.now(), menu.dataUpdatedAt || Date.now())} stale={Boolean(detail.error || menu.error)} />
      <Text style={styles.detailTitle}>{business.name}</Text><Text style={styles.category}>{business.category}</Text>
      {business.rating !== null && <View style={styles.rating}><Ionicons name="star" size={14} color="#E2A43B" /><Text style={styles.ratingText}>{business.rating.toFixed(1)} · {business.reviewCount} reviews</Text></View>}
      <Text style={styles.description}>{business.description || 'This coffee shop has not added a description yet.'}</Text>
      <Text style={styles.meta}>{business.address}</Text>
      <Pressable disabled={follow.busy || !follow.isOnline} onPress={updateFollow} style={[styles.followButton, !follow.isOnline && styles.disabled]}><Text style={styles.followText}>{follow.isOnline ? (follow.following ? 'Unfollow this coffee shop' : 'Follow this coffee shop') : 'Reconnect to change following'}</Text></Pressable>
      <View style={styles.actions}>{business.phone ? <Action icon="call-outline" label="Call" onPress={() => void Linking.openURL(`tel:${business.phone}`)} /> : null}{business.websiteUrl ? <Action icon="globe-outline" label="Website" onPress={() => void Linking.openURL(business.websiteUrl)} /> : null}</View>
      <BusinessHours hours={business.hours} />
      {menu.data ? <PublicMenuSection menu={menu.data} onAdd={detail.isOnline ? addItem : undefined} /> : <View style={styles.section}><Text style={styles.sectionHeading}>Menu</Text><Text style={styles.stateText}>{menu.isOnline ? menu.error ?? 'Loading menu…' : 'This menu was not saved before going offline.'}</Text></View>}
      {basket.length ? <Pressable onPress={() => setCheckout(true)} style={styles.followButton}><Text style={styles.followText}>Review order · £{(basketTotal / 100).toFixed(2)}</Text></Pressable> : null}
      <View style={styles.section}><Text style={styles.sectionHeading}>News & events</Text>{stories.items.slice(0, 3).map((item) => <ContentCard key={item.id} item={item} onPress={() => onOpenContent(item.id)} />)}{!stories.loading && !stories.items.length && <Text style={styles.stateText}>{stories.isOnline ? 'No published stories from this shop yet.' : 'Stories from this shop were not saved before going offline.'}</Text>}</View>
    </View>
  </ScrollView></SafeAreaView>;
}

function Action({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}><Ionicons name={icon} size={19} color={palette.green} /><Text style={styles.actionText}>{label}</Text></Pressable>;
}
