import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '../../lib/design';

import { AppButton } from './AppButton';

type Props = { kind: 'loading' | 'empty' | 'error'; title: string; message?: string; onRetry?: () => void };

export function StateView({ kind, title, message, onRetry }: Props) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.state}>
      {kind === 'loading' ? (
        <ActivityIndicator color={palette.green} size="large" />
      ) : (
        <Ionicons
          name={kind === 'error' ? 'alert-circle-outline' : 'cafe-outline'}
          size={32}
          color={palette.green}
        />
      )}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? <AppButton label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, color: palette.muted, textAlign: 'center' },
});
