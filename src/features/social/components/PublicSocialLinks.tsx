import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';

import { ResolvedBusinessTheme } from '../../branding/types';
import { SocialLinks, socialLinkPlatforms } from '../types';

const labels = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  youtube: 'YouTube',
  threads: 'Threads',
} as const;

export function PublicSocialLinks({ links, theme }: { links: SocialLinks; theme: ResolvedBusinessTheme }) {
  const available = socialLinkPlatforms.filter((platform) => links[platform]);
  if (!available.length) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 10 }}>Follow us</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {available.map((platform) => (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${labels[platform]}`}
            key={platform}
            onPress={() => void Linking.openURL(links[platform])}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              paddingHorizontal: 13,
            }}
          >
            <Ionicons name="open-outline" size={16} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '800' }}>{labels[platform]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
