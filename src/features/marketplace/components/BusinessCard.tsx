import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CachedImage } from '../../../components/CachedImage';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { PublicBusinessSummary } from '../types';

export function BusinessCard({ business, onPress }: { business: PublicBusinessSummary; onPress: () => void }) {
  const image = business.headerUrl ?? business.logoUrl;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}>
    <CachedImage uri={image} cacheKey={image ?? `business-${business.id}`} style={styles.cardImage} accessibilityLabel={`${business.name} cover`} />
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{business.name}</Text>
      <Text style={styles.category}>{business.category}</Text>
      <Text numberOfLines={2} style={styles.meta}>{business.address || 'Address coming soon'}</Text>
      {business.rating !== null && <View style={styles.rating}><Ionicons name="star" size={13} color="#E2A43B" /><Text style={styles.ratingText}>{business.rating.toFixed(1)} · {business.reviewCount} reviews</Text></View>}
    </View>
  </Pressable>;
}
