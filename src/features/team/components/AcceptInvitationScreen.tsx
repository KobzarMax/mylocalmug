import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { palette } from '../../../lib/design';
import { TeamInvitation } from '../types';
import { styles } from '../styles';

export function AcceptInvitationScreen({ email, invitations, busy, onAccept, onSkip }: { email: string; invitations: TeamInvitation[]; busy: boolean; onAccept: (token: string) => Promise<void>; onSkip: () => void }) {
  const [token, setToken] = useState('');
  const accept = async () => {
    try { await onAccept(token); Alert.alert('Invitation accepted', 'Your business workspace is ready.'); }
    catch (error) { Alert.alert('Could not accept invitation', error instanceof Error ? error.message : 'Please try again.'); }
  };
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.inviteBanner}><Text style={styles.inviteTitle}>You have a business invitation</Text><Text style={styles.inviteText}>{email} has {invitations.length} pending invitation{invitations.length === 1 ? '' : 's'}. Enter the code shared by the business owner.</Text></View>
    {invitations.map((invitation) => <View key={invitation.id} style={styles.card}><View style={styles.cardBody}><Text style={styles.cardTitle}>{invitation.role} access</Text><Text style={styles.cardMeta}>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</Text></View><View style={styles.rolePill}><Text style={styles.roleText}>pending</Text></View></View>)}
    <Text style={styles.label}>Invitation code</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} multiline placeholder="Paste the 48-character code" placeholderTextColor="#9B918A" style={[styles.input, styles.tokenInput]} />
    <Pressable disabled={busy} onPress={accept} style={styles.primaryButton}>{busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryText}>Accept invitation</Text>}</Pressable>
    <Pressable onPress={onSkip} style={styles.secondaryButton}><Text style={styles.secondaryText}>Apply for my own business instead</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
