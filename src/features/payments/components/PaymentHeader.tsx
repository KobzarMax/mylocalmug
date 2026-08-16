import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles';
export function PaymentHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#235C4B" />
      </Pressable>
      <View>
        <Text style={styles.overline}>Business finance</Text>
        <Text style={styles.title}>Payments</Text>
      </View>
    </View>
  );
}
