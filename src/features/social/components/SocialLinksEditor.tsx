import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';

import { palette } from '../../../lib/design';
import { SocialLinkPlatform, SocialLinks, socialLinkPlatforms } from '../types';

const labels: Record<SocialLinkPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  youtube: 'YouTube',
  threads: 'Threads',
};

export function SocialLinksEditor({
  value,
  editable,
  error,
  onChange,
}: {
  value: SocialLinks;
  editable: boolean;
  error: string | null;
  onChange: (platform: SocialLinkPlatform, value: string) => void;
}) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>Social accounts</Text>
      <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
        Add public profile links. Facebook and Instagram publishing connections are managed separately.
      </Text>
      {socialLinkPlatforms.map((platform) => (
        <View key={platform} style={{ marginTop: 14 }}>
          <Text style={{ color: palette.muted, fontSize: 10, fontWeight: '900', marginBottom: 7 }}>
            {labels[platform].toUpperCase()}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.paper,
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="link-outline" size={18} color={palette.green} />
            <TextInput
              accessibilityLabel={`${labels[platform]} profile URL`}
              autoCapitalize="none"
              autoCorrect={false}
              editable={editable}
              keyboardType="url"
              onChangeText={(next) => onChange(platform, next)}
              placeholder={`https://${platform === 'x' ? 'x.com' : `${platform}.com`}/…`}
              placeholderTextColor={palette.placeholder}
              value={value[platform]}
              style={{ flex: 1, color: palette.ink, paddingHorizontal: 10, paddingVertical: 12 }}
            />
          </View>
        </View>
      ))}
      {error ? (
        <Text accessibilityLiveRegion="assertive" style={{ color: palette.orange, marginTop: 10 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
