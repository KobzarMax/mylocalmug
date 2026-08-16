import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../payments/styles';

type TillUnavailableProps = {
  reason: 'expo-go' | 'native-module';
};

export function TillUnavailable({ reason }: TillUnavailableProps) {
  const message = reason === 'expo-go'
    ? 'The card reader needs a Local Mug iOS development build and cannot run inside Expo Go.'
    : 'This iOS build does not contain the Stripe Terminal native module. Rebuild the development client after installing native dependencies.';

  return (
    <View accessibilityRole="summary" style={styles.card}>
      <Text style={styles.cardTitle}>Card reader unavailable in this build</Text>
      <Text style={styles.body}>{message}</Text>
      <Text style={styles.body}>You can continue using the rest of the business portal normally.</Text>
    </View>
  );
}
