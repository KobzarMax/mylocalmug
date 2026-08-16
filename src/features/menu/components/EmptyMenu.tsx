import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function EmptyMenu({ onAddCategory }: { onAddCategory: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="restaurant-outline" size={34} color={palette.green} />
      <Text style={styles.emptyTitle}>Start your menu</Text>
      <Text style={styles.emptyText}>
        Create a category such as Coffee, Tea, or Food, then add the first item.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create first menu category"
        onPress={onAddCategory}
        style={styles.submitButton}
      >
        <Text style={styles.submitText}>Create first category</Text>
      </Pressable>
    </View>
  );
}
