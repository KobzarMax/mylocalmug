import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { styles } from '../styles';

export function AccountLoadError({ message, onRetry, onSignOut }: {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return <SafeAreaView style={styles.safe}><View style={styles.center}>
    <Text style={styles.title}>Could not open your account</Text>
    <Text style={styles.error}>{message}</Text>
    <Pressable onPress={onRetry} style={styles.primary}><Text style={styles.primaryText}>Try again</Text></Pressable>
    <Pressable onPress={onSignOut} style={styles.secondary}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
  </View></SafeAreaView>;
}
