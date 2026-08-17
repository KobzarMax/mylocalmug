import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function EmptyMenu({
  busy,
  onAddCategory,
  onAddDefaults,
}: {
  busy: boolean;
  onAddCategory: () => void;
  onAddDefaults: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="restaurant-outline" size={34} color={palette.green} />
      <Text style={styles.emptyTitle}>Set up menu categories</Text>
      <Text style={styles.emptyText}>
        Add editable café starter categories, or create a custom category for this business.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add editable starter menu categories"
        disabled={busy}
        onPress={onAddDefaults}
        style={[styles.submitButton, busy && styles.disabled]}
      >
        <Text style={styles.submitText}>{busy ? 'Adding categories…' : 'Add starter categories'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a custom menu category"
        disabled={busy}
        onPress={onAddCategory}
        style={[styles.emptySecondaryButton, busy && styles.disabled]}
      >
        <Text style={styles.secondaryText}>Create custom category</Text>
      </Pressable>
    </View>
  );
}
