import { Text, View } from 'react-native';

import { styles } from '../../payments/styles';
import { BasketLine } from '../types';

type Props = {
  businessId: string;
  businessName: string;
  location: string;
  basket: BasketLine[];
  onBack: () => void;
  onComplete: () => void;
};

export function CustomerCheckout({ businessName }: Props) {
  return (
    <View accessibilityRole="summary" style={styles.card}>
      <Text style={styles.cardTitle}>Checkout is not available</Text>
      <Text style={styles.body}>
        {businessName} can still be browsed on web. Payments remain postponed while provider support is
        researched.
      </Text>
    </View>
  );
}
