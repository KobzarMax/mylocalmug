import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function AuthBrand() {
  return (
    <>
      <View style={styles.logo}>
        <Ionicons name="cafe" size={38} color={palette.paper} />
      </View>
      <Text style={styles.brand}>Local Mug</Text>
    </>
  );
}
