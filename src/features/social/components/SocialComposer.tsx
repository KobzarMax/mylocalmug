import { Pressable, Text, TextInput, View } from 'react-native';

import { palette } from '../../../lib/design';
import { SocialConnection, SocialPlatform } from '../types';

export function SocialComposer({
  connections,
  selected,
  captions,
  defaultCaption,
  hasJpegCover,
  publicUrlReady,
  disabled,
  onToggle,
  onCaptionChange,
}: {
  connections: SocialConnection[];
  selected: SocialPlatform[];
  captions: Partial<Record<SocialPlatform, string>>;
  defaultCaption: string;
  hasJpegCover: boolean;
  publicUrlReady: boolean;
  disabled: boolean;
  onToggle: (provider: SocialPlatform) => void;
  onCaptionChange: (provider: SocialPlatform, value: string) => void;
}) {
  const ready = connections.filter((connection) => connection.status === 'ready');
  return (
    <View
      style={{
        marginTop: 22,
        padding: 17,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: palette.paper,
      }}
    >
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900' }}>Share to social media</Text>
      <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
        Review each caption. Social delivery is independent from Local Mug publishing.
      </Text>
      {!publicUrlReady ? (
        <Text style={{ color: palette.orange, marginTop: 10 }}>
          Configure EXPO_PUBLIC_APP_URL before social publishing.
        </Text>
      ) : null}
      {!ready.length ? (
        <Text style={{ color: palette.muted, marginTop: 10 }}>
          An owner or admin must connect Facebook or Instagram first.
        </Text>
      ) : null}
      {ready.map((connection) => {
        const provider = connection.provider;
        const active = selected.includes(provider);
        const unavailable = provider === 'instagram' && !hasJpegCover;
        return (
          <View key={provider} style={{ marginTop: 14 }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active, disabled: disabled || unavailable || !publicUrlReady }}
              accessibilityLabel={`Share on ${provider}`}
              disabled={disabled || unavailable || !publicUrlReady}
              onPress={() => onToggle(provider)}
              style={{
                minHeight: 46,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 14,
                backgroundColor: active ? palette.mint : palette.cream,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ color: palette.ink, fontWeight: '900', textTransform: 'capitalize' }}>
                {provider} · {connection.accountName}
              </Text>
              <Text style={{ color: active ? palette.green : palette.muted }}>
                {active ? 'Selected' : 'Select'}
              </Text>
            </Pressable>
            {unavailable ? (
              <Text style={{ color: palette.orange, fontSize: 12, marginTop: 6 }}>
                Instagram requires a JPEG cover image.
              </Text>
            ) : null}
            {active ? (
              <TextInput
                accessibilityLabel={`${provider} caption`}
                editable={!disabled}
                maxLength={2000}
                multiline
                onChangeText={(value) => onCaptionChange(provider, value)}
                value={captions[provider] ?? defaultCaption}
                style={{
                  minHeight: 120,
                  marginTop: 8,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: palette.line,
                  color: palette.ink,
                  padding: 12,
                  textAlignVertical: 'top',
                }}
              />
            ) : null}
          </View>
        );
      })}
      {selected.includes('instagram') ? (
        <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>
          Links in Instagram captions may not be clickable.
        </Text>
      ) : null}
    </View>
  );
}
