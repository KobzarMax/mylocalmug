import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CachedImage } from '../../../components/CachedImage';
import { palette } from '../../../lib/design';
import { resolveBusinessTheme } from '../../branding/theme';
import { styles } from '../styles';
import { PublicBusinessSummary } from '../types';

export function BusinessCard({
  business,
  onPress,
}: {
  business: PublicBusinessSummary;
  onPress: () => void;
}) {
  const image = business.headerUrl ?? business.logoUrl;
  const theme = resolveBusinessTheme(business.brandPalette);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <CachedImage
        uri={image}
        cacheKey={image ?? `business-${business.id}`}
        style={styles.cardImage}
        accessibilityLabel={`${business.name} cover`}
      />
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{business.name}</Text>
        <Text style={[styles.category, { color: theme.primary }]}>{business.category}</Text>
        <Text numberOfLines={2} style={[styles.meta, { color: theme.mutedText }]}>
          {business.address || 'Address coming soon'}
        </Text>
        {business.rating !== null && (
          <View style={styles.rating}>
            <Ionicons name="star" size={13} color={palette.star} />
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {business.rating.toFixed(1)} · {business.reviewCount} reviews
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
