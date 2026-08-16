import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { palette } from '../../../lib/design';
import { getProfileAvatarUrl } from '../../../lib/profileImage';
import { MemberRole } from '../../business/types';
import { styles } from '../styles';
import { assignableRoles, MembershipStatus, TeamMember } from '../types';

import { RoleOption, TeamHeader } from './TeamUI';

export function TeamMemberDetail({
  member,
  editable,
  roles,
  busy,
  onBack,
  onRole,
  onStatus,
}: {
  member: TeamMember;
  editable: boolean;
  roles: typeof assignableRoles;
  busy: boolean;
  onBack: () => void;
  onRole: (role: MemberRole) => Promise<void>;
  onStatus: (status: MembershipStatus) => Promise<void>;
}) {
  const run = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      Alert.alert('Team updated', message);
    } catch (error) {
      Alert.alert(
        'Could not update team member',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };
  const confirmRemove = () =>
    Alert.alert('Remove team member?', `${member.displayName} will lose access to this business.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => run(() => onStatus('removed'), 'Access has been removed.'),
      },
    ]);
  const avatarUrl = getProfileAvatarUrl(member.avatarPath);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TeamHeader title="Team member" onBack={onBack} />
        <View style={styles.detailCard}>
          <View style={styles.detailAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{member.displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.detailName}>{member.displayName}</Text>
          <Text style={styles.detailMeta}>
            {member.role} · {member.status}
          </Text>
        </View>
        {editable && (
          <>
            <Text style={styles.sectionTitle}>Access level</Text>
            {roles.map((role) => (
              <RoleOption
                key={role.value}
                label={role.label}
                description={role.description}
                active={member.role === role.value}
                onPress={() =>
                  member.role !== role.value &&
                  run(() => onRole(role.value), `Role changed to ${role.label}.`)
                }
              />
            ))}
            {busy ? (
              <ActivityIndicator color={palette.green} />
            ) : member.status === 'suspended' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => run(() => onStatus('active'), 'Access has been restored.')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Restore access</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => run(() => onStatus('suspended'), 'Access has been suspended.')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Suspend access</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.dangerButton}>
              <Text style={styles.dangerText}>Remove from business</Text>
            </Pressable>
          </>
        )}
        {!editable && (
          <Text style={styles.lead}>
            {member.role === 'owner'
              ? 'Ownership requires a separate protected transfer workflow.'
              : 'Your role can view this member but cannot change their access.'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
