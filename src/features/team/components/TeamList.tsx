import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfileAvatarUrl } from '../../../lib/profileImage';
import { palette } from '../../../lib/design';
import { TeamInvitation, TeamMember } from '../types';
import { styles } from '../styles';
import { TeamHeader } from './TeamUI';

export function TeamList({ members, invitations, loading, error, canManage, onBack, onInvite, onMember, onRevoke, onRetry }: {
  members: TeamMember[]; invitations: TeamInvitation[]; loading: boolean; error: string | null; canManage: boolean;
  onBack: () => void; onInvite: () => void; onMember: (member: TeamMember) => void; onRevoke: (id: string) => Promise<void>; onRetry: () => void;
}) {
  const revoke = (invitation: TeamInvitation) => Alert.alert('Revoke invitation?', `${invitation.email} will no longer be able to join.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Revoke', style: 'destructive', onPress: () => onRevoke(invitation.id).catch((caught) => Alert.alert('Could not revoke invitation', caught instanceof Error ? caught.message : 'Please try again.')) },
  ]);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <TeamHeader title="Team" onBack={onBack} />
    <Text style={styles.lead}>Manage who can access this business and what each person can do.</Text>
    {canManage && <Pressable onPress={onInvite} style={styles.primaryButton}><Text style={styles.primaryText}>Invite employee</Text></Pressable>}
    <Text style={styles.sectionTitle}>Members</Text>
    {loading ? <ActivityIndicator color={palette.green} /> : error ? <View style={styles.empty}><Ionicons name="alert-circle-outline" size={30} color={palette.orange} /><Text style={styles.error}>{error}</Text><Pressable onPress={onRetry} style={styles.secondaryButton}><Text style={styles.secondaryText}>Try again</Text></Pressable></View> : members.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No team members</Text><Text style={styles.emptyText}>Invite the first employee to start collaborating.</Text></View> : members.map((member) => <MemberRow key={member.profileId} member={member} onPress={() => onMember(member)} />)}
    {invitations.length > 0 && <><Text style={styles.sectionTitle}>Pending invitations</Text>{invitations.map((invitation) => <View key={invitation.id} style={styles.card}><View style={styles.avatar}><Ionicons name="mail-outline" size={20} color={palette.green} /></View><View style={styles.cardBody}><Text style={styles.cardTitle}>{invitation.email}</Text><Text style={styles.cardMeta}>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</Text></View>{canManage && <Pressable onPress={() => revoke(invitation)} style={styles.iconButton}><Ionicons name="close" size={18} color={palette.orange} /></Pressable>}</View>)}</>}
  </ScrollView></SafeAreaView>;
}

function MemberRow({ member, onPress }: { member: TeamMember; onPress: () => void }) {
  const avatarUrl = getProfileAvatarUrl(member.avatarPath);
  return <Pressable onPress={onPress} style={styles.card}><View style={styles.avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{member.displayName.charAt(0).toUpperCase()}</Text>}</View><View style={styles.cardBody}><Text style={styles.cardTitle}>{member.displayName}</Text><Text style={[styles.cardMeta, member.status === 'suspended' && styles.statusWarning]}>{member.status}</Text></View><View style={styles.rolePill}><Text style={styles.roleText}>{member.role}</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted} /></Pressable>;
}
