import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { useSocialConnections } from '../hooks';
import { SocialPlatform } from '../types';

export function SocialConnectionsScreen({
  businessId,
  sessionId,
  onBack,
}: {
  businessId: string;
  sessionId?: string | null;
  onBack: () => void;
}) {
  const state = useSocialConnections(businessId, sessionId);
  const act = (provider: SocialPlatform, connected: boolean) =>
    (connected ? state.disconnect(provider) : state.connect(provider)).catch((error) =>
      Alert.alert(
        'Social connection unavailable',
        error instanceof Error ? error.message : 'Please try again.',
      ),
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.cream }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: palette.paper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={palette.green} />
          </Pressable>
          <Text style={{ color: palette.ink, fontSize: 28, fontWeight: '900' }}>Social publishing</Text>
        </View>
        <Text style={{ color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 20 }}>
          Connect one Facebook Page and one Instagram Professional account. Public profile links remain in
          Business Profile.
        </Text>
        {state.candidates.length ? (
          <View style={{ marginTop: 18, borderRadius: 20, backgroundColor: palette.mint, padding: 17 }}>
            <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '900' }}>
              Choose a Facebook Page
            </Text>
            {state.candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                accessibilityRole="button"
                accessibilityLabel={`Connect ${candidate.name}`}
                onPress={() => void state.selectCandidate(candidate.id)}
                style={{
                  minHeight: 46,
                  justifyContent: 'center',
                  marginTop: 8,
                  borderRadius: 13,
                  backgroundColor: palette.paper,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: palette.green, fontWeight: '800' }}>{candidate.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {(['facebook', 'instagram'] as const).map((provider) => {
          const connection = state.connections.find((item) => item.provider === provider);
          const connected = connection?.status === 'ready';
          return (
            <View
              key={provider}
              style={{
                marginTop: 18,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.paper,
                padding: 18,
              }}
            >
              <Text
                style={{ color: palette.ink, fontSize: 19, fontWeight: '900', textTransform: 'capitalize' }}
              >
                {provider}
              </Text>
              <Text style={{ color: connected ? palette.green : palette.muted, marginTop: 5 }}>
                {connection ? `${connection.accountName} · ${connection.status}` : 'Not connected'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${connected ? 'Disconnect' : 'Connect'} ${provider}`}
                onPress={() => act(provider, connected)}
                style={{
                  minHeight: 46,
                  marginTop: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: connected ? palette.softOrange : palette.green,
                }}
              >
                <Text style={{ color: connected ? palette.orange : palette.paper, fontWeight: '900' }}>
                  {connected ? 'Disconnect' : `Connect ${provider}`}
                </Text>
              </Pressable>
            </View>
          );
        })}
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 18 }}>
          Connecting requires a configured Meta Business app and approved publishing permissions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
