import { Text, View } from 'react-native';

import { styles } from '../payments/styles';

export function TillFeature({ businessId: _businessId }: { businessId: string }) {
  return (
    <View accessibilityRole="summary" style={styles.card}>
      <Text style={styles.cardTitle}>Card readers are not available on web</Text>
      <Text style={styles.body}>
        Terminal support is postponed and isolated from the supported web experience.
      </Text>
    </View>
  );
}
