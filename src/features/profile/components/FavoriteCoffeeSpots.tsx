import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { profileStyles as styles } from '../styles';
import { CoffeeSpot } from '../types';

import { ProfileSection } from './ProfileSection';

type Props = {
  spots: CoffeeSpot[];
  favoriteIds: string[];
  loading: boolean;
  error: boolean;
  onToggle: (id: string) => void;
};

export function FavoriteCoffeeSpots({ spots, favoriteIds, loading, error, onToggle }: Props) {
  return (
    <ProfileSection title="Favourite coffee spots">
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading coffee spots" color={palette.green} />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.help}>
          Coffee spots could not be loaded. Check your connection and retry later.
        </Text>
      ) : spots.length === 0 ? (
        <Text style={styles.help}>No published coffee shops are available yet.</Text>
      ) : (
        spots.map((spot) => {
          const selected = favoriteIds.includes(spot.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${spot.name}, favourite`}
              accessibilityState={{ checked: selected }}
              key={spot.id}
              onPress={() => onToggle(spot.id)}
              style={({ pressed }) => [styles.spotRow, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.spotLogo, selected && styles.spotLogoSelected]}>
                <Ionicons name="cafe" size={18} color={selected ? palette.paper : palette.green} />
              </View>
              <View style={styles.spotCopy}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text numberOfLines={1} style={styles.help}>
                  {spot.address}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'heart' : 'heart-outline'}
                size={22}
                color={selected ? palette.orange : palette.muted}
              />
            </Pressable>
          );
        })
      )}
    </ProfileSection>
  );
}
