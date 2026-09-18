import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { useSocialPublications } from '../hooks';

export function SocialDeliveryStatus({ postId }: { postId: string | null }) {
  const state = useSocialPublications(postId);
  if (!postId || (!state.loading && !state.publications.length)) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '900' }}>Social delivery</Text>
      {state.publications.map((publication) => (
        <View
          key={publication.id}
          style={{
            marginTop: 8,
            borderRadius: 14,
            backgroundColor: palette.paper,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 12,
          }}
        >
          <Text style={{ color: palette.ink, fontWeight: '800', textTransform: 'capitalize' }}>
            {publication.provider} · {publication.publicationType}
          </Text>
          <Text
            style={{
              color: ['failed', 'blocked', 'needs_review'].includes(publication.status)
                ? palette.orange
                : palette.green,
              marginTop: 3,
            }}
          >
            {publication.status.replace('_', ' ')}
          </Text>
          {publication.lastError ? (
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>{publication.lastError}</Text>
          ) : null}
          {publication.providerUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${publication.provider} post`}
              onPress={() => void Linking.openURL(publication.providerUrl!)}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ color: palette.green, fontWeight: '800' }}>Open published post</Text>
            </Pressable>
          ) : null}
          {publication.status === 'failed' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retry ${publication.provider} publication`}
              onPress={() =>
                void state
                  .retry(publication.id)
                  .catch((error) =>
                    Alert.alert(
                      'Could not retry',
                      error instanceof Error ? error.message : 'Please try again.',
                    ),
                  )
              }
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ color: palette.green, fontWeight: '800' }}>Retry safely</Text>
            </Pressable>
          ) : null}
          {publication.status === 'blocked' ? (
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
              Review this result manually to prevent a duplicate Facebook post.
            </Text>
          ) : null}
          {publication.status === 'needs_review' ? (
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
              Content changed. Review and confirm a new social publication.
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
