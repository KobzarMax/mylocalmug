import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { CreatedInvitation } from '../types';
import { styles } from '../styles';
import { useClipboard } from '../useClipboard';
import { TeamHeader } from './TeamUI';

export function InvitationCreatedScreen({ invitation, onBack, onDone }: { invitation: CreatedInvitation; onBack: () => void; onDone: () => void }) {
  const clipboard = useClipboard();
  const copyCode = () => clipboard.copy(invitation.token).catch((caught) => {
    Alert.alert('Could not copy code', caught instanceof Error ? caught.message : 'Please try again.');
  });

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <TeamHeader title="Invitation ready" onBack={onBack} />
    <View style={styles.inviteBanner}><Text style={styles.inviteTitle}>Share this code securely</Text><Text style={styles.inviteText}>Send it only to {invitation.email}. They must sign in with that exact email and open the Business Portal.</Text></View>
    <View style={styles.tokenCard}>
      <Text style={styles.tokenLabel}>Single-use invitation code</Text>
      <Text selectable style={styles.token}>{invitation.token}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Copy invitation code" accessibilityLiveRegion="polite" onPress={copyCode} style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}>
        <Ionicons name={clipboard.copied ? 'checkmark' : 'copy-outline'} size={18} color={palette.green} />
        <Text style={styles.copyButtonText}>{clipboard.copied ? 'Copied' : 'Copy code'}</Text>
      </Pressable>
      <Text style={styles.warning}>This is the only time the full code is shown. It expires {new Date(invitation.expiresAt).toLocaleString()}.</Text>
    </View>
    <Pressable onPress={onDone} style={styles.primaryButton}><Text style={styles.primaryText}>Return to team</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
