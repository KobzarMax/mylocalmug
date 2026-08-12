import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function MenuHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}>
      <Ionicons name="arrow-back" size={21} color={palette.green} />
    </Pressable>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.spacer} />
  </View>;
}

export function MenuError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.errorCard}>
    <Ionicons name="alert-circle-outline" size={30} color={palette.orange} />
    <Text style={styles.errorText}>{message}</Text>
    <Pressable onPress={onRetry} style={styles.retryButton}>
      <Text style={styles.secondaryText}>Try again</Text>
    </Pressable>
  </View>;
}
