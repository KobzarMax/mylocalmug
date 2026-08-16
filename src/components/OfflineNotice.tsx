import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../lib/design';

export function OfflineNotice({
  isOnline,
  updatedAt,
  stale = false,
}: {
  isOnline: boolean;
  updatedAt?: number;
  stale?: boolean;
}) {
  if (isOnline && !stale) return null;
  const updated = updatedAt ? ` · updated ${formatRelative(updatedAt)}` : '';
  return (
    <View style={styles.notice}>
      <Text style={styles.text}>
        {isOnline ? 'Showing saved data' : 'Offline'}
        {updated}
      </Text>
    </View>
  );
}

function formatRelative(value: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - value) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  notice: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: palette.warningPaper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  text: { color: palette.orange, fontSize: 11, fontWeight: '800' },
});
