import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';

import { palette } from '../../../lib/design';
import { SocialComposer } from '../../social/components/SocialComposer';
import { useSocialConnections } from '../../social/hooks';
import { SocialFollowUpInput, SocialPlatform } from '../../social/types';
import { isJpegPath } from '../../social/validation';
import { styles } from '../styles';
import { ContentItem } from '../types';

import { ContentHeader } from './ContentUI';

export function CancelEventScreen({
  item,
  businessId,
  busy,
  onBack,
  onCancel,
}: {
  item: ContentItem;
  businessId: string;
  busy: boolean;
  onBack: () => void;
  onCancel: (reason: string, social?: SocialFollowUpInput) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const connections = useSocialConnections(businessId);
  const [providers, setProviders] = useState<SocialPlatform[]>([]);
  const [captions, setCaptions] = useState<Partial<Record<SocialPlatform, string>>>({});
  const publicAppUrl = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const contentUrl = `${publicAppUrl}/content/${item.id}`;
  const defaultCaption =
    `Cancelled: ${item.title}\n\n${reason.trim() || 'This event has been cancelled.'}\n\n${contentUrl}`.slice(
      0,
      2000,
    );
  const submit = () =>
    onCancel(
      reason,
      providers.length
        ? {
            providers,
            captions: Object.fromEntries(
              providers.map((provider) => [provider, captions[provider] ?? defaultCaption]),
            ),
            contentUrl,
          }
        : undefined,
    ).catch((caught) =>
      Alert.alert('Could not cancel event', caught instanceof Error ? caught.message : 'Please try again.'),
    );
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.scroll}>
        <ContentHeader title="Cancel event" onBack={onBack} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.intro}>
          Followers will receive one cancellation alert and future reminders will stop. The cancelled event
          remains visible.
        </Text>
        <View style={styles.field}>
          <Text style={styles.label}>Reason for cancellation</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            editable={!busy}
            maxLength={300}
            multiline
            placeholder="Explain what changed"
            placeholderTextColor={palette.placeholder}
            style={[styles.input, styles.multiline]}
          />
        </View>
        <SocialComposer
          captions={captions}
          connections={connections.connections}
          defaultCaption={defaultCaption}
          disabled={busy}
          hasJpegCover={isJpegPath(item.coverPath)}
          onCaptionChange={(provider, value) => setCaptions((current) => ({ ...current, [provider]: value }))}
          onToggle={(provider) =>
            setProviders((current) =>
              current.includes(provider)
                ? current.filter((value) => value !== provider)
                : [...current, provider],
            )
          }
          publicUrlReady={/^https:\/\//.test(publicAppUrl)}
          selected={providers}
        />
        <Pressable
          accessibilityRole="button"
          disabled={busy || reason.trim().length < 3}
          onPress={submit}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.orange, marginTop: 20 },
            (busy || reason.trim().length < 3) && styles.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={palette.paper} />
          ) : (
            <Text style={styles.primaryText}>Cancel event and notify followers</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
