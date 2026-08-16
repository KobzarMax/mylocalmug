import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function ContentHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={styles.iconButton}
      >
        <Ionicons name="arrow-back" size={21} color={palette.green} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

export function ContentLoading({ label = 'Loading stories…' }: { label?: string }) {
  return (
    <View style={styles.emptyCard}>
      <ActivityIndicator color={palette.green} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

export function ContentError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.errorCard}>
      <Ionicons name="alert-circle-outline" size={28} color={palette.orange} />
      <Text style={styles.errorText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Try again</Text>
      </Pressable>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[styles.secondaryButton, { marginTop: 8 }]}
        >
          <Text style={styles.secondaryText}>Back to stories</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyContent({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="newspaper-outline" size={32} color={palette.green} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {action && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.secondaryButton, { marginTop: 14 }]}
        >
          <Text style={styles.secondaryText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
