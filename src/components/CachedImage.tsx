import { Ionicons } from '@expo/vector-icons';
import { Image, ImageStyle } from 'expo-image';
import { ReactNode, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View } from 'react-native';

import { palette } from '../lib/design';
import { useNetworkStatus } from '../lib/query/QueryProvider';

export function CachedImage({
  uri,
  cacheKey,
  style,
  accessibilityLabel,
  fallback,
}: {
  uri: string | null;
  cacheKey: string;
  style: StyleProp<ImageStyle>;
  accessibilityLabel: string;
  fallback?: ReactNode;
}) {
  const { isOnline } = useNetworkStatus();
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri, cacheKey, isOnline]);

  if (!uri || failed)
    return (
      <View accessibilityLabel={`${accessibilityLabel} unavailable`} style={[style, styles.placeholder]}>
        {fallback ?? <Ionicons name="cafe-outline" size={24} color={palette.green} />}
      </View>
    );
  return (
    <Image
      source={{ uri, cacheKey }}
      style={style}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint },
});
