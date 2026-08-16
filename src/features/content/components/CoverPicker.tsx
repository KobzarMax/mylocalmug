import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function CoverPicker({
  url,
  disabled,
  onPick,
  onRemove,
}: {
  url: string | null;
  disabled: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={url ? 'Replace cover image' : 'Choose cover image'}
      disabled={disabled}
      onPress={onPick}
      style={styles.coverPicker}
    >
      {url ? (
        <Image source={{ uri: url }} style={styles.coverImage} />
      ) : (
        <>
          <Ionicons name="image-outline" size={35} color={palette.green} />
          <Text style={styles.secondaryText}>Choose cover image</Text>
        </>
      )}
      {url && (
        <View style={styles.coverOverlay}>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={(event) => {
              event.stopPropagation();
              onPick();
            }}
            style={styles.overlayButton}
          >
            <Ionicons name="image-outline" size={16} color={palette.paper} />
            <Text style={styles.overlayText}>Replace</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            style={styles.overlayButton}
          >
            <Ionicons name="trash-outline" size={16} color={palette.paper} />
            <Text style={styles.overlayText}>Remove</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
