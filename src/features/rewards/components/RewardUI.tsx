import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { rewardColors, rewardStyles as s } from '../styles';

export function RewardHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={s.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={s.iconButton}
      >
        <Ionicons name="arrow-back" size={22} color={rewardColors.green} />
      </Pressable>
      <Text style={s.title}>{title}</Text>
    </View>
  );
}
export function RewardLoading({ label = 'Loading rewards…' }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={rewardColors.green} />
      <Text style={s.meta}>{label}</Text>
    </View>
  );
}
export function RewardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Could not load rewards</Text>
      <Text style={s.error}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={s.secondary}>
        <Text style={s.secondaryText}>Try again</Text>
      </Pressable>
    </View>
  );
}
export function EmptyRewards({ title, message }: { title: string; message: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.meta}>{message}</Text>
    </View>
  );
}
