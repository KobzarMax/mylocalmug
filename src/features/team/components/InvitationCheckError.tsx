import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { styles } from '../styles';

export function InvitationCheckError({
  message,
  onRetry,
  onContinue,
}: {
  message: string;
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Could not check invitations</Text>
        <Text style={styles.error}>{message}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onContinue} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Continue to application</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
