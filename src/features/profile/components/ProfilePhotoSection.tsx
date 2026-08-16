import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { profileStyles as styles } from '../styles';

export function ProfilePhotoSection({
  avatarUri,
  displayName,
  onChoose,
}: {
  avatarUri: string | null;
  displayName: string;
  onChoose: () => void;
}) {
  return (
    <View style={styles.photoSection}>
      <View style={styles.avatar}>
        {avatarUri ? (
          <Image accessibilityLabel="Profile photo" source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{displayName.slice(0, 2).toUpperCase()}</Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose profile photo"
        onPress={onChoose}
        style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="camera-outline" size={18} color={palette.green} />
        <Text style={styles.photoButtonText}>Choose photo</Text>
      </Pressable>
      <Text style={styles.help}>JPEG, PNG or WebP · maximum 5 MB</Text>
    </View>
  );
}
